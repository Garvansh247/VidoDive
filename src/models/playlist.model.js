import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isPrivate: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);


export const Playlist = mongoose.model("Playlist", playlistSchema);