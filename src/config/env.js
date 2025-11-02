import { config } from "dotenv";

config({path: `.env.local`})

export const{
    PORT,
    GEMINI_API_KEY,
    DB_URI
} = process.env