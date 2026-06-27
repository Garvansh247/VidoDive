import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import fs from "fs";

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

export { userRegisterController };