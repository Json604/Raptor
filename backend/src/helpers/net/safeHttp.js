import axios from "axios";
import dns from "dns";
import http from "http";
import https from "https";
import net from "net";

// Website scans fetch URLs that users type in, from our server. Without these
// guards anyone could point Raptor at 127.0.0.1, the droplet's other services or
// the cloud metadata endpoint. Every hop (including redirects) is checked, and
// DNS answers are checked too so a public hostname can't resolve to a private IP.

const blocked = new net.BlockList()
for (const [address, prefix] of [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
    ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
    ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(address, prefix, 'ipv4')
for (const [address, prefix] of [
    ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['64:ff9b::', 96], ['2001:db8::', 32],
]) blocked.addSubnet(address, prefix, 'ipv6')

export const isPrivateAddress = (address) => {
    const family = net.isIP(address)
    if (family === 4) return blocked.check(address, 'ipv4')
    if (family === 6) {
        const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
        if (mapped) return blocked.check(mapped[1], 'ipv4')
        return blocked.check(address, 'ipv6')
    }
    return true
}

const blockedError = () => {
    const error = new Error("That address points to a private network, so Raptor won't scan it.")
    error.status = 400
    error.expose = true
    return error
}

const safeLookup = (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err)
        if (!addresses.length || addresses.some(entry => isPrivateAddress(entry.address))) {
            return callback(blockedError())
        }
        if (options.all) return callback(null, addresses)
        callback(null, addresses[0].address, addresses[0].family)
    })
}

const httpAgent = new http.Agent({ lookup: safeLookup, keepAlive: false })
const httpsAgent = new https.Agent({ lookup: safeLookup, keepAlive: false })

const ALLOWED_PORTS = new Set(['', '80', '443', '8080', '8443'])

export const assertPublicUrl = (url) => {
    if (!['http:', 'https:'].includes(url.protocol)) {
        const error = new Error("Only http and https links can be scanned.")
        error.status = 400
        error.expose = true
        throw error
    }
    if (!ALLOWED_PORTS.has(url.port)) {
        const error = new Error("Raptor only scans sites on standard web ports.")
        error.status = 400
        error.expose = true
        throw error
    }
    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(host) && isPrivateAddress(host)) throw blockedError()
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
        throw blockedError()
    }
}

const USER_AGENT = 'RaptorSecurityScanner/1.0 (+https://raptorscan.netlify.app)'

// GET with manual redirect handling so every hop goes through assertPublicUrl.
export const safeGet = async (input, { headers = {}, maxBytes = 3 * 1024 * 1024, timeout = 10000, maxRedirects = 5 } = {}) => {
    let url = new URL(input)
    const chain = []

    for (let hop = 0; hop <= maxRedirects; hop++) {
        assertPublicUrl(url)
        const response = await axios.get(url.toString(), {
            httpAgent,
            httpsAgent,
            proxy: false,
            maxRedirects: 0,
            timeout,
            maxContentLength: maxBytes,
            responseType: 'text',
            transformResponse: [data => data],
            validateStatus: () => true,
            decompress: true,
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
                ...headers,
            },
        })

        const location = response.headers.location
        if (response.status >= 300 && response.status < 400 && location) {
            chain.push({ url: url.toString(), status: response.status })
            url = new URL(location, url)
            continue
        }

        return {
            url: url.toString(),
            status: response.status,
            headers: response.headers,
            body: typeof response.data === 'string' ? response.data : '',
            redirects: chain,
        }
    }

    const error = new Error("The site redirected too many times.")
    error.status = 400
    error.expose = true
    throw error
}

// Turns low-level network failures into messages a person can act on.
export const describeNetworkError = (error) => {
    if (error.expose) return error
    const code = error.code || error.cause?.code
    const messages = {
        ENOTFOUND: "We couldn't find that site. Check the address for typos.",
        EAI_AGAIN: "We couldn't find that site. Check the address for typos.",
        ECONNREFUSED: "The site refused the connection. Is it deployed and running?",
        ECONNRESET: "The site closed the connection before we could check it.",
        ECONNABORTED: "The site took too long to respond (over 10 seconds).",
        ETIMEDOUT: "The site took too long to respond (over 10 seconds).",
        CERT_HAS_EXPIRED: "The site's HTTPS certificate has expired, so browsers will block it too.",
        ERR_TLS_CERT_ALTNAME_INVALID: "The site's HTTPS certificate doesn't match its address.",
        DEPTH_ZERO_SELF_SIGNED_CERT: "The site uses a self-signed HTTPS certificate that browsers won't trust.",
        ERR_FR_MAX_BODY_LENGTH_EXCEEDED: "The page is too large to scan.",
    }
    const wrapped = new Error(messages[code] || "We couldn't reach that site. Make sure it's live and publicly accessible.")
    wrapped.status = 400
    wrapped.expose = true
    return wrapped
}
