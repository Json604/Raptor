import mongoose from "mongoose";
import { DB_URI } from "../config/env.js";

if(!DB_URI){
    throw new Error(`Please use the correct DB_URI from env.<development/production>.local`)
}

const connectToDB = async() => {
    try {
        await mongoose.connect(DB_URI)
        console.log(`Connected to databse`);
    } catch (error) {
        console.log(`Error connecting to database`, error);
        process.exit(1);
    }
}

export default connectToDB;