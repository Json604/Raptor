const errorMiddleware = (err,req,res,next) => {
    try {
        let error = {...err}
        error.message = err.message
    
        res.status(error.status || 500).json({success: false, error: error.message || "Internal server Error"})
    } catch (error) {
        console.log("Error in error.middleware.js", error);
        next(error)
    }
}

export default errorMiddleware