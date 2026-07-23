import mongoose,{isValidObjectId} from "mongoose";
import { ApiError,ApiResponse,asyncHandler } from "../utils/index.js";

import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { title, description, isPrivate } = req.body;
    if (!title?.trim() || !description?.trim() || !isPrivate) {
        throw new ApiError(400, "Title, description, and privacy setting are required");
    }
    const newPlaylist = await Playlist.create({
        title: title.trim(),
        description: description.trim(),
        isPrivate: isPrivate,
        owner: req.user._id,
        videos: []
    });
    return res.status(201).json(new ApiResponse(201, "Playlist created successfully", newPlaylist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, sortByPlaylist, sortTypePlaylist, sortByThumbnail, sortTypeThumbnail } = req.query;
    const validSortFieldsPlaylist = ["title", "createdAt", "updatedAt", "totalViews", "totalVideos", "totalLikes"];
    const sortFieldPlaylist = validSortFieldsPlaylist.includes(sortByPlaylist) ? sortByPlaylist : null;
    const sortOrderPlaylist = sortTypePlaylist === "desc" ? -1 : 1;
    const validSortFieldsThumbnail = ["createdAt", "title", "updatedAt", "views", "likes"];
    const sortFieldThumbnail = validSortFieldsThumbnail.includes(sortByThumbnail) ? sortByThumbnail : null;
    const sortOrderThumbnail = sortTypeThumbnail === "desc" ? -1 : 1;
    const rawVideosSubPipeline = [
        {
            $project: {
                _id: 1,
                title: 1,
                thumbnail: 1,
                createdAt: 1,
                views: 1,
            }
        }
    ];
    rawVideosSubPipeline.push(
            {$lookup: {
                    from: "likes",
                    let: { videoId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$video", "$$videoId"] }
                            }
                        },
                        {
                            $count: "count"
                        }
                    ],
                    as: "likes"
            }},
            {
                $addFields: {
                    likesCount: { $ifNull: [{ $arrayElemAt: ["$likes.count", 0] }, 0] }
                }
            },
            {
                $project: {
                    likes: 0
                }
            }
        );
    if(sortFieldThumbnail) {
        if(sortFieldThumbnail === "likes"){
            rawVideosSubPipeline.push(
                {$sort: { likesCount: sortOrderThumbnail }}
            );
        } else {
            rawVideosSubPipeline.push(
                {$sort: { [sortFieldThumbnail]: sortOrderThumbnail }}
            );
        }
    }
    const pipeline = [
        { $match: { owner: new mongoose.Types.ObjectId(userId),
            isPrivate: false 
         } },
        // get the thumbnail of the latest video added in the playlist
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "rawVideoDetails",
                pipeline: rawVideosSubPipeline
            }
        },
        {
                $addFields: {
                    totalLikes: { $sum: "$rawVideoDetails.likesCount" },
                    totalViews: { $sum: "$rawVideoDetails.views" },
                    totalVideos: { $size: "$rawVideoDetails" },
                    totalDuration: { $sum: "$rawVideoDetails.duration" },
                }
        }
    ];
    if(sortFieldThumbnail) {
        pipeline.push(
            {
                $addFields: {
                    coverImage: { $ifNull: [
                        { $arrayElemAt: ["$rawVideoDetails.thumbnail", 0] }, null
                    ]},
                    firstVideo: {
                        $ifNull: [
                            { $arrayElemAt: ["$rawVideoDetails", 0] },
                            null
                        ]
                    },
                    previewThumbnails: {
                        $slice: [
                            {
                                $map: {
                                    input: "$rawVideoDetails",
                                    as: "video",
                                    in: "$$video.thumbnail"
                                }
                            },0, { $min: [3, { $size: "$rawVideoDetails" }] } 
                        ]
                    }
                }
            },
            {
                $project: {
                    rawVideoDetails: 0,
                    videos: 0
                }
            }
        )
    } else{
        pipeline.push(
            {
                $addFields: {
                    videoDetails: {
                        $map: {
                            input: "$videos",
                            as: "videoId",
                            in: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$rawVideoDetails",
                                            as: "video",
                                            cond: { $eq: ["$$video._id", "$$videoId"] }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    },
                    coverImage: { $ifNull: [
                        { $arrayElemAt: ["$videoDetails.thumbnail", 0] }, null
                    ]},
                    firstVideo: {
                        $ifNull: [
                            { $arrayElemAt: ["$videoDetails", 0] },
                            null
                        ]
                    },
                    previewThumbnails: {
                        $slice: [
                            {
                                $map: {
                                    input: "$videoDetails",
                                    as: "video",
                                    in: "$$video.thumbnail"
                                }
                            },0, { $min: [3, { $size: "$videoDetails" }] } 
                        ]
                    }
                }
            },
            {
                $project: {
                    videoDetails: 0,
                    videos: 0
                }
            },
        )
    }
    pipeline .push(
        {
            $sort: {
                [sortFieldPlaylist || "createdAt"]: sortOrderPlaylist
            }
        }
    )
    const aggregateQuery = await Playlist.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const playlists = await Playlist.aggregatePaginate(aggregateQuery, options);
    return res.status(200)
    .json(new ApiResponse(200, "User playlists fetched successfully", playlists));
});



const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { page = 1, limit = 10, sortBy, sortType } = req.query;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlistExists = await Playlist.findById(playlistId);
    if (!playlistExists || (playlistExists.isPrivate && playlistExists.owner.toString() !== req.user._id.toString())) {
        throw new ApiError(404, "Playlist not found or is private");
    }
    const validSortFields = ["title", "createdAt", "updatedAt", "views", "likes"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : null;
    const sortOrder= sortType === "desc" ? -1 : 1;


    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;


    const rawVideosSubPipeline = [
        {
            $project: {
                _id: 1,
                title: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
            }
        },
        {
            $lookup: {
                from: "likes",
                let: { videoId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$$videoId", "$video"] }
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                as: "likeDetails"
            }
        },
        {
            $addFields: {
                likes: { $ifNull: [{ $arrayElemAt: ["$likeDetails.count", 0] }, 0] }
            }
        },
        {
            $project: {
                likeDetails: 0
            }
        }
    ];
    if(sortField) {
        rawVideosSubPipeline.push(
            {
                $sort: { [sortField]: sortOrder }
            }
        );
    }
    const pipeline =
        [
            {
                $match: { _id: new mongoose.Types.ObjectId(playlistId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
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
                    owner: { $first: "$owner" }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "rawVideoDetails",
                    pipeline: rawVideosSubPipeline
                }
            },
            {
                $addFields: {
                    totalLikes: { $sum: "$rawVideoDetails.likes" },
                    totalViews: { $sum: "$rawVideoDetails.views" },
                    totalVideos: { $size: "$rawVideoDetails" },
                    totalDuration: { $sum: "$rawVideoDetails.duration" },
                }
            }
        ]
    if(sortField) {
        pipeline.push(
            {
                $addFields: {
                    videoDetails: "$rawVideoDetails",
                    coverImage: { $ifNull: [
                        { $arrayElemAt: ["$rawVideoDetails.thumbnail", 0] }, null
                    ]},
                }
            },
            {
                $project: {
                    rawVideoDetails: 0,
                    videos: 0
                }
            }
        )
    } else{
        pipeline.push(
            {
                $addFields: {
                    videoDetails: {
                        $map: {
                            input: "$videos",
                            as: "videoId",
                            in: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$rawVideoDetails",
                                            as: "video",
                                            cond: { $eq: ["$$video._id", "$$videoId"] }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    },
                    coverImage: { $ifNull: [
                        { $arrayElemAt: ["$videoDetails.thumbnail", 0] }, null
                    ]},
                }
            },
            {
                $project: {
                    rawVideoDetails: 0,
                    videos: 0
                }
            }
        )
    }

    pipeline.push(
        {
            $addFields: {
                videoDetails: {
                    $slice: ["$videoDetails", skip, limitNumber]
                }
            }
        }
    )

    const aggregateQuery = await Playlist.aggregate(pipeline);

    if(!aggregateQuery || aggregateQuery.length === 0) {
        throw new ApiError(404, "Playlist not found");
    }
    const playlist = aggregateQuery[0];
    return res.status(200)
    .json(new ApiResponse(200, "Playlist fetched successfully", 
        {
            ...playlist,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalVideos: playlist.totalVideos,
                totalPages: Math.ceil(playlist.totalVideos / limitNumber)
            }
        }
    ));
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }
    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }
    const videoInPlaylist= playlist.videos.some(v => v.toString() === videoId.toString());
    if (videoInPlaylist) {
        throw new ApiError(400, "Video already exists in the playlist");
    }
    playlist.videos.push(videoId);
    await playlist.save();
    return res.status(200).json(new ApiResponse(200, "Video added to playlist successfully", playlist));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }
    const videoInPlaylist= playlist.videos.some(v => v.toString() === videoId.toString());
    if (!videoInPlaylist) {
        throw new ApiError(400, "Video not found in the playlist");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );
    return res.status(200).json(new ApiResponse(200, "Video removed from playlist successfully", updatedPlaylist));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { title, description } = req.body;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    if(!title?.trim() && !description?.trim()) {
        throw new ApiError(400, "Title or description is required");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist");
    }
    if(title?.trim()) {
        playlist.title = title.trim();
    }
    if(description?.trim()) {
        playlist.description = description.trim();
    }
    await playlist.save();
    return res.status(200).json(new ApiResponse(200, "Playlist updated successfully", playlist));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }
    await Playlist.findByIdAndDelete(playlistId);
    return res.status(200).json(new ApiResponse(200, "Playlist deleted successfully", playlist));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist
};