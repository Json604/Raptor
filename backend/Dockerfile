# Raptor API: Node + Gitleaks + TruffleHog in one small image.
FROM node:22-alpine

# Pinned and checksum-verified: these binaries read untrusted code, so we want
# exactly the build we tested, not whatever "latest" is today.
ARG GITLEAKS_VERSION=8.30.1
ARG GITLEAKS_SHA256=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
ARG TRUFFLEHOG_VERSION=3.97.9
ARG TRUFFLEHOG_SHA256=40377e6572495412fb9ba0bc21c9401f73b72f1d2afd11b9931bc4a5ed622866

RUN apk add --no-cache ca-certificates tini \
 && wget -qO /tmp/gitleaks.tar.gz "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
 && echo "${GITLEAKS_SHA256}  /tmp/gitleaks.tar.gz" | sha256sum -c - \
 && tar -xzf /tmp/gitleaks.tar.gz -C /usr/local/bin gitleaks \
 && wget -qO /tmp/trufflehog.tar.gz "https://github.com/trufflesecurity/trufflehog/releases/download/v${TRUFFLEHOG_VERSION}/trufflehog_${TRUFFLEHOG_VERSION}_linux_amd64.tar.gz" \
 && echo "${TRUFFLEHOG_SHA256}  /tmp/trufflehog.tar.gz" | sha256sum -c - \
 && tar -xzf /tmp/trufflehog.tar.gz -C /usr/local/bin trufflehog \
 && rm /tmp/*.tar.gz \
 && gitleaks version && trufflehog --version

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src

ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]
