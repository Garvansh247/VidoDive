import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        oldRefreshToken: {
            type: String,
        },
        activeRefreshToken: {
            type: String,
            required: true,
        },
        sessionStartedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: "30d", // Automatically delete the session document after 30 days
        },
    }
);

sessionSchema.index({ oldRefreshToken: 1, activeRefreshToken: 1 }); // Create a compound index on oldRefreshToken and activeRefreshToken for efficient querying

export const Session = mongoose.model("Session", sessionSchema);