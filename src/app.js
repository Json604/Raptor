import express from "express"
import { PORT } from "./config/env.js"

const app = express()

app.get('/', (req,res) => {res.send("Raptor Health check route.")})

app.listen(PORT, () => {
    console.log(`The Server is running on http://localhost:${PORT}`);
})