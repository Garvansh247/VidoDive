import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true
    }
);

tweetSchema.plugin(mongooseAggregatePaginate); // Add the pagination plugin to the tweet schema

export const Tweet = mongoose.model("Tweet", tweetSchema);