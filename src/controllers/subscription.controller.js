import mongoose,{isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import {ApiError, ApiResponse, asyncHandler} from "../utils/index.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }
    if (channel._id.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }
    const existingSubscription = await Subscription.findOne({ subscriber: req.user._id, channel: channelId });
    if(existingSubscription){
        await existingSubscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200)
        .json(new ApiResponse(200, "Unsubscribed successfully",{ isSubscribed: false }));
    }
    const newSubscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });
    return res.status(200)
        .json(new ApiResponse(200, "Subscribed successfully",{ isSubscribed: true ,subscription: newSubscription}));
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }
    const subscribers= await Subscription.aggregate([
        { $match: { channel: mongoose.Types.ObjectId(channelId) } },
        { $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "subscriberDetails",
            pipeline: [
                { $project: { username: 1, fullName: 1, avatar: 1 } }
            ]
        }},
        { $addFields: { subscriber: { $first: "$subscriberDetails" } } },
        { $project: { subscriberDetails: 0 } }
    ]);
    return res.status(200)
    .json(new ApiResponse(200, "Channel subscribers fetched successfully", subscribers));
});

const getChannelSubscriptions = asyncHandler(async (req, res) => {
    const {userId} = req.user._id;
    const subscriptions = await Subscription.aggregate([
        { $match: { subscriber: mongoose.Types.ObjectId(userId) } },
        { $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channelDetails",
            pipeline: [
                { $project: { username: 1, fullName: 1, avatar: 1 } }
            ]
        }},
        { $addFields: { channel: { $first: "$channelDetails" } } },
        { $project: { channelDetails: 0 } }
    ]);
    return res.status(200)
    .json(new ApiResponse(200, "User subscriptions fetched successfully", subscriptions));
});

export { toggleSubscription, getChannelSubscribers, getChannelSubscriptions };