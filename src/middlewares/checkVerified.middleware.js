import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const checkVerifiedMiddleware = asyncHandler(async (req, _, next) => {
    if(!req.user.isVerified){
        throw new ApiError(403, "User account is not verified. Please verify your account to access this resource.");
    }
    next();
});

export default checkVerifiedMiddleware;