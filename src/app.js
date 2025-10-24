import express from "express"
import { PORT } from "./config/env.js"
import scanRouter from "./routes/scan.route.js"
import errorMiddleware from "./middlewares/error.middleware.js"
import cors from 'cors'
import rateLimit from "express-rate-limit"

const app = express()

// Global Rate Limiter — limits all incoming requests
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 60 requests per window
  message: {
    error: "Too many requests",
    message: "You've exceeded the request limit. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false, 
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

app.use(globalLimiter);

app.use(express.json())
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://raptor.support",
    "https://raptorfe.netlify.app",
    "https://www.raptor.support"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/v1', scanRouter)

app.use(errorMiddleware)

app.get('/api/v1/health', (req,res) => {res.send("Raptor Health check route.")})

app.listen(PORT, () => {
    console.log(`The Server is running on http://localhost:${PORT}`);
})