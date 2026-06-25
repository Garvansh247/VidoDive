import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema=new mongoose.Schema(
    {
        videoFile: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
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
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
)

videoSchema.plugin(mongooseAggregatePaginate); // Add the pagination plugin to the video schema


export const Video=mongoose.model("Video", videoSchema);