import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";


const verifyJWT = asyncHandler(async (req, res, next) => {
    
        const incomingAccessToken= req.cookies?.accessToken || req.header("authorization")?.split(" ")[1]; // Check for access token in cookies or Authorization header
        if(!incomingAccessToken){
            throw new ApiError(401, "Access token is missing");
        }
        const decodedAccessToken=jwt.verify(incomingAccessToken, process.env.ACCESS_TOKEN_SECRET);
        if(!decodedAccessToken){
            throw new ApiError(401, "Invalid access token");
        }
        const user=await User.findById(decodedAccessToken._id);
        if(!user){
            throw new ApiError(404, "User not found");
        }
        req.user=user; // Attach the user object to the request for further use in the route handlers
        next(); // Call the next middleware function
    
});



export default verifyJWT;