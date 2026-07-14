import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // polymorphic reference to either a video or a tweet
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweet",
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

export const Comment = mongoose.model("Comment", commentSchema);