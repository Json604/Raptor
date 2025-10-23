import { config } from "dotenv";

config({path: `.env.local`})

export const{
    PORT,
    GEMINI_API_KEY
} = process.env