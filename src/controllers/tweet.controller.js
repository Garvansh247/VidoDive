import mongoose,{isValidObjectId} from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import {ApiError, ApiResponse, asyncHandler} from "../utils/index.js";

const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline = [];
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400,"Invalid userId");
        }
        pipeline.push({
            $match: { user: new mongoose.Types.ObjectId(userId) }
        })
    }
    if(query?.trim()){
        pipeline.push({
            $match: {
                content: { $regex: query, $options: "i" }
            }
        })
    }
    const sortOptions = {};
    if(sortBy){
        const sortField = sortBy;
        const sortOrder = sortType === "desc" ? -1 : 1;
        sortOptions[sortField] = sortOrder;
    } else{
        sortOptions["createdAt"] = -1; // Default sorting by createdAt in descending order
    }
    pipeline.push({ $sort: sortOptions });
    const aggregateQuery = Tweet.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }
    const tweets=await Tweet.aggregatePaginate(aggregateQuery, options);
    return res.status(200)
    .json(new ApiResponse(200, "Tweets fetched successfully", tweets));
});

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }
    const newTweet = await Tweet.create({
        content,
        user: req.user._id
    });
    if(!newTweet){
        throw new ApiError(500,"Failed to create tweet");
    }
    return res.status(201)
    .json(new ApiResponse(201, "Tweet created successfully", newTweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, sortBy, sortType } = req.query;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId");
    }
    const pipeline = [
        {
            $match: { user: new mongoose.Types.ObjectId(userId) }
        }
    ];
    const sortOptions = {};
    if(sortBy){
        const sortField = sortBy;
        const sortOrder = sortType === "desc" ? -1 : 1;
        sortOptions[sortField] = sortOrder;
    } else{
        sortOptions["createdAt"] = -1; // Default sorting by createdAt in descending order
    }
    pipeline.push({ $sort: sortOptions });
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
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
            user: { $first: "$userDetails" }
        }
    })
    pipeline.push({
        $project: {
            userDetails: 0
        }
    })
    const aggregateQuery = Tweet.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const tweets = await Tweet.aggregatePaginate(aggregateQuery, options);
    return res.status(200)
    .json(new ApiResponse(200, "User tweets fetched successfully", tweets));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }
    if(tweet.user.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to update this tweet");
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {$set: { content: content.trim() }},
        { new: true, runValidators: true }
    );

    return res.status(200)
    .json(new ApiResponse(200, "Tweet updated successfully", updatedTweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId");
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }
    if(tweet.user.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to delete this tweet");
    }
    await Tweet.findByIdAndDelete(tweetId);
    return res.status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully", tweet));
});

export {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}