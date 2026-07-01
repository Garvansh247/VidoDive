import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";


const cookieOptions={
    httpOnly: true, // The cookie is accessible only by the web server
    secure: process.env.NODE_ENV === "production", // The cookie is sent only over HTTPS in production
    sameSite: "None", // The cookie is sent in all contexts, i.e., in responses to both same-site and cross-site requests
    maxAge: 30 * 24 * 60 * 60 * 1000, // The cookie expires after 30 days
}
const generateAccessAndRefreshTokens = async (user,sessionStartedAt) => {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken(sessionStartedAt);
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
}

const userRegisterController = asyncHandler(async (req, res) => {
    // get the data from the request body
    const { username, email, password,fullName} = req.body;
    // validate the data
    if([username, email, password, fullName].some(field => !field || field.trim() === "")){
        throw new ApiError(409, "All fields are required");
    }
    // check if the user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }
    // get the avatar and coverImage from req.files
    const avatarFilePath = req.files?.avatar?.[0]?.path;
    const coverImageFilePath = req.files?.coverImage?.[0]?.path;
    // check if the avatar is must present
    if (!avatarFilePath || !fs.existsSync(avatarFilePath)) {
        throw new ApiError(400, "Avatar is required");
    }
    // upload them to cloudinary
    const avatar= await uploadToCloudinary(avatarFilePath);
    let coverImage;
    if (coverImageFilePath) {
        if (!fs.existsSync(coverImageFilePath)) {
            throw new ApiError(400, "Cover image is required");
        }
        coverImage = await uploadToCloudinary(coverImageFilePath);
    }
    // check if avatar and coverImage uploaded successfully
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar");
    }
    if (coverImageFilePath && !coverImage) {
        throw new ApiError(500, "Failed to upload cover image");
    }
    // create the user in the database
    const newUser = await User.create({
        username,
        email,
        password,
        fullName,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || undefined,
    });
    if(!newUser){
        throw new ApiError(500, "Failed to create user");
    }
    // get user by id from database and remove the password and refreshToken from the response
    const user = await User.findById(newUser._id).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(500, "Failed to create user");
    }
    // send the response with the user data
    res.status(201).json(
        new ApiResponse(201, "User registered successfully", user)
    )
});

const userLoginController = asyncHandler(async (req, res) => {
    const { username,email,password } = req.body;
    //anyone of username or email is required
    if(!username && !email){
        throw new ApiError(400, "Username or email is required");
    }
    if(!password){
        throw new ApiError(400, "Password is required");
    }
    const user = await User.findOne({ $or: [{ username }, { email }] }).select("+password");
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials");
    }
    // generate access token and refresh token
    const sessionStartedAt = new Date();
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user, sessionStartedAt);
    // create a new session in the database
    const session=await Session.create({
        user:user._id, 
        activeRefreshToken: refreshToken, 
        sessionStartedAt: sessionStartedAt,
        createdAt: new Date(),
    });
    if(!session){
        throw new ApiError(500, "Failed to create session");
    }
    // send the response with the access token and refresh token
    const userObject = user.toObject();
    delete userObject.password; // Remove password from the user object before sending the response
    res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, "User logged in successfully", {
            accessToken,
            refreshToken,
            user: userObject
        })
    );
});

const userLogoutController = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken; // Check for refresh token in cookies
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is missing");
    }
    // find the session by the refresh token
    const session = await Session.findOne({ activeRefreshToken: incomingRefreshToken });
    if(!session){
        throw new ApiError(401, "Invalid refresh token");
    }
    // delete the session from the database
    await Session.deleteOne({ _id: session._id });
    res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(200, "User logged out successfully")
    );
});


const userLogoutAllSessionsController = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // delete all sessions for the user from the database
    await Session.deleteMany({ user: userId });
    res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(200, "User logged out from all sessions successfully")
    );
});

const refreshAccessTokenController = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken; // Check for refresh token in cookies
    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is missing");
    }

    const compromisedSession = await Session.findOne({ oldRefreshToken: incomingRefreshToken });
    if(compromisedSession){
        // If the refresh token is found in the oldRefreshToken field, it means the session has been compromised
        await Session.deleteMany({ user: compromisedSession.user }); // Invalidate all sessions for the user
        throw new ApiError(401, "Session compromised. All sessions have been invalidated. Please log in again.");
    }
    const session = await Session.findOne({ activeRefreshToken: incomingRefreshToken });
    if(!session){
        throw new ApiError(401, "Invalid refresh token");
    }
    // verify the refresh token
    let decodedRefreshToken;
    try {
        decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }

    // check if the session has expired
    const sessionAge = Date.now() - new Date(decodedRefreshToken.sessionStartedAt).getTime();
    if(sessionAge > 30 * 24 * 60 * 60 * 1000) { // 30 days in milliseconds
        await Session.deleteOne({ _id: session._id });
        throw new ApiError(401, "Session expired. Please log in again.");
    }
    const user = await User.findById(session.user);
    if(!user){
        throw new ApiError(404, "User not found");
    }
    // generate new access token and refresh token
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user, session.sessionStartedAt);

    // update the session with the new refresh token
    await Session.updateOne(
        { _id: session._id },
        { 
            activeRefreshToken: newRefreshToken,
            oldRefreshToken: incomingRefreshToken,// Store the old refresh token for future checks
            createdAt: new Date() // Update the createdAt timestamp to the current time
        } 
    );

    res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
        new ApiResponse(200, "Access token refreshed successfully", {
            accessToken,
            refreshToken: newRefreshToken
        })
    );
});

export { userRegisterController, userLoginController, userLogoutController, userLogoutAllSessionsController, refreshAccessTokenController };