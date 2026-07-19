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
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

likeSchema.index({ video: 1, user: 1 }, { unique: true, sparse: true });
likeSchema.index({ tweet: 1, user: 1 }, { unique: true, sparse: true });
likeSchema.index({ comment: 1, user: 1 }, { unique: true, sparse: true });

export const Like = mongoose.model("Like", likeSchema);