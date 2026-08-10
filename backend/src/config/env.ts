import dotenv from "dotenv";
dotenv.config()

export const {
    NODE_ENV,
    PORT,
    BACKEND_URL,
    FRONTEND_URL
} = process.env;