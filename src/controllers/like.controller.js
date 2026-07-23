import mongoose,{isValidObjectId} from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import {ApiError, ApiResponse, asyncHandler} from "../utils/index.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    const existingLike = await Like.findOne({ video: videoId, user: req.user._id });
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200)
        .json(new ApiResponse(200, "Video unliked successfully",{ isLiked: false }));
    }
    const newLike = await Like.create({
        video: videoId,
        user: req.user._id
    });
    return res.status(200)
        .json(new ApiResponse(200, "Video liked successfully",{ isLiked: true ,like: newLike}));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    const existingLike = await Like.findOne({ tweet: tweetId, user: req.user._id });
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200)
        .json(new ApiResponse(200, "Tweet unliked successfully",{ isLiked: false }));
    }
    const newLike = await Like.create({
        tweet: tweetId,
        user: req.user._id
    });
    return res.status(200)
        .json(new ApiResponse(200, "Tweet liked successfully",{ isLiked: true ,like: newLike}));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    const existingLike = await Like.findOne({ comment: commentId, user: req.user._id });
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200)
        .json(new ApiResponse(200, "Comment unliked successfully",{ isLiked: false }));
    }
    const newLike = await Like.create({
        comment: commentId,
        user: req.user._id
    });
    return res.status(200)
        .json(new ApiResponse(200, "Comment liked successfully",{ isLiked: true ,like: newLike}));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const LikedVideos = await Like.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.user._id), video: { $exists: true } }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
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
                    },
                    {
                        $addFields: {
                            owner: { $first: "$ownerDetails" }
                        }
                    },
                    {
                        $project: {
                            ownerDetails: 0
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $first: "$videoDetails" }
            }
        },
        {
            $project: {
                videoDetails: 0
            }
        },
        {
            $match: {
                "video.isPublished": true // Only include likes for published videos
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by the time the like was created, most recent first
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200, "Liked videos fetched successfully", LikedVideos));

});

const getLikedTweets = asyncHandler(async (req, res) => {
    const LikedTweets = await Like.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.user._id), tweet: { $exists: true } }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "tweetDetails",
                pipeline: [
                    {
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
                    },
                    {
                        $addFields: {
                            user: { $first: "$userDetails" }
                        }
                    },
                    {
                        $project: {
                            userDetails: 0
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                tweet: { $first: "$tweetDetails" }
            }
        },
        {
            $project: {
                tweetDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by the time the like was created, most recent first
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200, "Liked tweets fetched successfully", LikedTweets));
});

const getLikedComments = asyncHandler(async (req, res) => {
    const LikedComments = await Like.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.user._id), comment: { $exists: true } }
        },
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "commentDetails",
                pipeline: [
                    {
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
                    },
                    {
                        $addFields: {
                            user: { $first: "$userDetails" }
                        }
                    },
                    {
                        $project: {
                            userDetails: 0
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                comment: { $first: "$commentDetails" }
            }
        },
        {
            $project: {
                commentDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by the time the like was created, most recent first
        }
    ])
    return res.status(200)
    .json(new ApiResponse(200, "Liked comments fetched successfully", LikedComments));
});

const getVideoLikes = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    const likes = await Like.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
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
        },
        {
            $addFields: {
                user: { $first: "$userDetails" }
            }
        },
        {
            $project: {
                userDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by the time the like was created, most recent first
        }
    ])
    const totalLikes= likes.length;
    const isLiked = likes.some(like => like.user._id.toString() === req.user._id.toString());
    return res.status(200)
    .json(new ApiResponse(200, "Video likes fetched successfully", { totalLikes, isLiked, likes }));
});

const getTweetLikes = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    const likes = await Like.aggregate([
        {
            $match: { tweet: new mongoose.Types.ObjectId(tweetId) }
        },
        {
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
        },
        {
            $addFields: {
                user: { $first: "$userDetails" }
            }
        },
        {
            $project: {
                userDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by the time the like was created, most recent first
        }
    ])
    const totalLikes= likes.length;
    const isLiked = likes.some(like => like.user._id.toString() === req.user._id.toString());
    return res.status(200)
    .json(new ApiResponse(200, "Tweet likes fetched successfully", { totalLikes, isLiked, likes }));
});

const getCommentLikes = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    const likes = await Like.aggregate([
        {
            $match: { comment: new mongoose.Types.ObjectId(commentId) }
        },
        {
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
        },
        {
            $addFields: {
                user: { $first: "$userDetails" }
            }
        },
        {
            $project: {
                userDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by the time the like was created, most recent first
        }
    ])
    const totalLikes= likes.length;
    const isLiked = likes.some(like => like.user._id.toString() === req.user._id.toString());
    return res.status(200)
    .json(new ApiResponse(200, "Comment likes fetched successfully", { totalLikes, isLiked, likes }));
});

export {
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos,
    getLikedTweets,
    getLikedComments,
    getVideoLikes,
    getTweetLikes,
    getCommentLikes
};