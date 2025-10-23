import express from "express"
import { PORT } from "./config/env.js"
import scanRouter from "./routes/scan.route.js"
import errorMiddleware from "./middlewares/error.middleware.js"
import cors from 'cors'

const app = express()

app.use(express.json())
app.use(cors({
  // origin: "http://localhost:5173",
  // credentials: true
}));

app.use('/api/v1', scanRouter)

app.use(errorMiddleware)

app.get('/', (req,res) => {res.send("Raptor Health check route.")})

app.listen(PORT, () => {
    console.log(`The Server is running on http://localhost:${PORT}`);
})