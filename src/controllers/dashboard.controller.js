import mongoose from "mongoose";
import { ApiResponse,asyncHandler } from "../utils/index.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Tweet } from "../models/tweet.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [subscriberCount, videoStats, tweetStats] = await Promise.all([
        Subscription.countDocuments({ subscribedTo: userId }),
        Video.aggregate([
            { $match: { owner: userObjectId } },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likesCount: { $size: "$likes" }
                }
            },
            {
                $facet: {
                    overallStats: [
                        {
                            $group: {
                                _id: null,
                                totalVideos: { $sum: 1 },
                                totalViews: { $sum: "$views" },
                                totalLikes: { $sum: "$likesCount" }
                            }
                        }
                    ],
                    currentMonthStats: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                                    $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalVideos: { $sum: 1 },
                                totalViews: { $sum: "$views" },
                                totalLikes: { $sum: "$likesCount" }
                            }
                        }
                    ],
                    mostLikedVideo: [
                        { $sort: { likesCount: -1, views: -1 } },
                        { $limit: 1 },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                likesCount: 1,
                                views: 1,
                                thumbnail: 1,
                                duration: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    mostViewedVideo: [
                        { $sort: { views: -1, likesCount: -1 } },
                        { $limit: 1 },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                likesCount: 1,
                                views: 1,
                                thumbnail: 1,
                                duration: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            }
        ]),
        Tweet.aggregate([
            { $match: { user: userObjectId } },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likesCount: { $size: "$likes" }
                }
            },
            {
                $facet: {
                    overallStats: [
                        {
                            $group: {
                                _id: null,
                                totalTweets: { $sum: 1 },
                                totalLikes: { $sum: "$likesCount" }
                            }
                        }
                    ],
                    currentMonthStats: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                                    $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalTweets: { $sum: 1 },
                                totalLikes: { $sum: "$likesCount" }
                            }
                        }
                    ],
                    mostLikedTweet: [
                        { $sort: { likesCount: -1 } },
                        { $limit: 1 },
                        {
                            $project: {
                                _id: 1,
                                content: 1,
                                likesCount: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            }
        ])
    ]);

    const videoStatsData = videoStats[0] || {};
    const tweetStatsData = tweetStats[0] || {};
    const overallVideoStats = videoStatsData.overallStats?.[0] || {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
    };
    const currentMonthVideoStats = videoStatsData.currentMonthStats?.[0] || {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
    };
    const mostLikedVideo = videoStatsData.mostLikedVideo?.[0] || null;
    const mostViewedVideo = videoStatsData.mostViewedVideo?.[0] || null;

    const overallTweetStats = tweetStatsData.overallStats?.[0] || {
        totalTweets: 0,
        totalLikes: 0
    };
    const currentMonthTweetStats = tweetStatsData.currentMonthStats?.[0] || {
        totalTweets: 0,
        totalLikes: 0
    };
    const mostLikedTweet = tweetStatsData.mostLikedTweet?.[0] || null;

    const stats= {
        subscriberCount,
        videoStats: {
            overall: {
                totalVideos: overallVideoStats.totalVideos,
                totalViews: overallVideoStats.totalViews,
                totalLikes: overallVideoStats.totalLikes
            },
            currentMonth: {
                totalVideos: currentMonthVideoStats.totalVideos,
                totalViews: currentMonthVideoStats.totalViews,
                totalLikes: currentMonthVideoStats.totalLikes
            },
            mostLikedVideo,
            mostViewedVideo
        },
        tweetStats: {
            overall: {
                totalTweets: overallTweetStats.totalTweets,
                totalLikes: overallTweetStats.totalLikes
            },
            currentMonth: {
                totalTweets: currentMonthTweetStats.totalTweets,
                totalLikes: currentMonthTweetStats.totalLikes
            },
            mostLikedTweet
        }
    }
    
    res.status(200).json(new ApiResponse(200, "Channel stats fetched successfully", stats));
});

const getChannelVideos= asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const videosList = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        { $sort: { createdAt: -1 } // Sort by createdAt in descending order
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                createdAt: 1,
                likesCount: { $size: "$likes" }
            }
        }
    ])
    const paginatedVideos = await Video.aggregatePaginate(videosList, options);
    res.status(200).json(new ApiResponse(200, "Channel videos fetched successfully", paginatedVideos));
});

export {
    getChannelStats,
    getChannelVideos
};