const errorMiddleware = (err, req, res, next) => {
    if (res.headersSent) return next(err)

    // Malformed JSON bodies come through here from express.json().
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, error: 'Request body must be valid JSON.' })
    }

    const status = err.status || 500
    if (status >= 500 && !err.expose) console.error(err)

    res.status(status).json({
        success: false,
        error: err.expose || status < 500 ? err.message : 'Something went wrong on our side. Please try again.',
    })
}

export default errorMiddleware
