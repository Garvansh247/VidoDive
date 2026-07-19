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



// Import and use your routes here
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import tweetRoutes from "./routes/tweet.routes.js";
import likeRoutes from "./routes/like.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/tweets", tweetRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);

app.use(errorMiddleware); // This middleware should be added after all other middleware and routes to handle errors properly.



export {app};