import { Video } from "../models/video.model.js";
import {ApiError, ApiResponse, asyncHandler,extractPublicId,uploadToCloudinary,deleteFromCloudinary} from "../utils/index.js";
import mongoose,{isValidObjectId} from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Implementation for fetching all videos
    const pipeline=[];
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400,"Invalid userId");
        }
        pipeline.push({
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        })
    }
    if(query?.trim()){
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        })
    }
    pipeline.push({
        $match:{
            $or:[
                { isPublished: true },
                { owner: new mongoose.Types.ObjectId(req.user._id) }
            ]
        }
    })
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    }
                }
            ]
        }
    });
    pipeline.push({
        $addFields: {
            owner: { $first: "$ownerDetails" }
        }
    })
    pipeline.push({
        $project: {
            ownerDetails: 0
        }
    })
    const sortStage = {};
    if (sortBy) {
        sortStage[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
        sortStage["createdAt"] = -1; // Default sorting by createdAt in descending order
    }
    pipeline.push({ $sort: sortStage });
    const aggregateQuery = Video.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }
    const result = await Video.aggregatePaginate(aggregateQuery, options);
    return res.status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", result));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } }, // Increment the views count by 1
        { new: true } // Return the updated document
    ).populate({
        path: "owner",
        select: "username fullName avatar"
    });
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(!video.isPublished && video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to view this video");
    }
    if(req.user){
        await req.user.updateOne({
            $addToSet: { watchHistory: video._id } // Add the video to the user's watch history if not already present
        });
    }
    return res.status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video));
});

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body;
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if(!title || !description || !videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400,"Missing required fields");
    }
    const videoUploadResult = await uploadToCloudinary(videoFileLocalPath);
    if(!videoUploadResult) {
        throw new ApiError(500,"Failed to upload video file");
    }
    const thumbnailUploadResult = await uploadToCloudinary(thumbnailLocalPath);
    if(!thumbnailUploadResult) {
        // If thumbnail upload fails, delete the uploaded video file from Cloudinary
        const videoPublicId = extractPublicId(videoUploadResult.secure_url);
        await deleteFromCloudinary(videoPublicId);
        throw new ApiError(500,"Failed to upload thumbnail");
    }
    const newVideo = await Video.create({
        videoFile: videoUploadResult.secure_url,
        thumbnail: thumbnailUploadResult.secure_url,
        title,
        description,
        duration: videoUploadResult.duration, // Assuming Cloudinary provides the duration in the upload result
        isPublished: true,
        owner: req.user._id
    });
    return res.status(201)
    .json(new ApiResponse(201, "Video published successfully", newVideo))
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }
    const {title,description}= req.body;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(400,"At least one field (title, description, thumbnail) is required to update");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to update this video");
    }
    const updateFields={};
    if(title?.trim()) updateFields.title=title;
    if(description?.trim()) updateFields.description=description;
    let oldThumbnailUrl=null;
    if(thumbnailLocalPath){
        const thumbnailUploadResult = await uploadToCloudinary(thumbnailLocalPath);
        if(!thumbnailUploadResult){
            throw new ApiError(500,"Failed to upload thumbnail");
        }
        oldThumbnailUrl=video.thumbnail;
        updateFields.thumbnail=thumbnailUploadResult.secure_url;
    }
    const updatedVideo=await Video.findByIdAndUpdate(
        videoId, 
        { $set: updateFields }, 
        { new: true }
    );
    if(!updatedVideo){
        await deleteFromCloudinary(extractPublicId(updateFields.thumbnail));
        throw new ApiError(500,"Failed to update video");
    }
    if(oldThumbnailUrl){
        await deleteFromCloudinary(extractPublicId(oldThumbnailUrl));
    }
    return res.status(200)
    .json(new ApiResponse(200, "Video updated successfully", updatedVideo))
});

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to delete this video");
    }
    await deleteFromCloudinary(extractPublicId(video.videoFile));
    await deleteFromCloudinary(extractPublicId(video.thumbnail));
    await Video.findByIdAndDelete(videoId);
    return res.status(200)
    .json(new ApiResponse(200, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to change the publish status of this video");
    }
    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });
    return res.status(200)
    .json(new ApiResponse(200, "Publish status updated successfully", video));
});

export {
    getAllVideos,
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};