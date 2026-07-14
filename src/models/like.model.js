import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweet",
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
        User: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

export const Like = mongoose.model("Like", likeSchema);