import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, // Allow requests from any origin
    // methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    // allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
    credentials: true, // Allow cookies to be sent with requests
}));

app.use(express.json({limit:"16kb"}));

app.use(express.urlencoded({extended:true, limit:"16kb"}));

app.use(express.static("public"));

app.use(cookieParser());


app.use(errorMiddleware); // This middleware should be added after all other middleware and routes to handle errors properly.



export {app};