import mongoose,{isValidObjectId} from "mongoose";

import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import {ApiError, ApiResponse, asyncHandler} from "../utils/index.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const videoExists = await Video.exists({ _id: videoId });
    if(!videoExists){
        throw new ApiError(404, "Video not found");
    }
    const comments = await Comment.find({ video: videoId }).populate("user", "username email avatar");
    res.status(200).json(new ApiResponse(200, "Comments fetched successfully", comments));
});

const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweetExists = await Tweet.exists({ _id: tweetId });
    if(!tweetExists){
        throw new ApiError(404, "Tweet not found");
    }
    const comments = await Comment.find({ tweet: tweetId }).populate("user", "username email avatar");
    res.status(200).json(new ApiResponse(200, "Comments fetched successfully", comments));
});

const addVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }
    const comment = new Comment({
        video: videoId,
        user: req.user._id,
        content
    });
    await comment.save();
    res.status(201).json(new ApiResponse(201, "Comment added successfully", comment));
});

const addTweetComment = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    const tweetExists = await Tweet.exists({ _id: tweetId });
    if (!tweetExists) {
        throw new ApiError(404, "Tweet not found");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }
    const comment = new Comment({
        tweet: tweetId,
        user: req.user._id,
        content
    });
    await comment.save();
    res.status(201).json(new ApiResponse(201, "Comment added successfully", comment));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    if(!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }
    comment.content = content;
    await comment.save();
    res.status(200).json(new ApiResponse(200, "Comment updated successfully", comment));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json(new ApiResponse(200, "Comment deleted successfully"));
});

export {
    getVideoComments,
    getTweetComments,
    addVideoComment,
    addTweetComment,
    updateComment,
    deleteComment
};