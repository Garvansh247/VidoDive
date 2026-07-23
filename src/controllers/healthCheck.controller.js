import mongoose from "mongoose";
import { ApiResponse,asyncHandler } from "../utils/ApiResponse.js";

const healthCheck = asyncHandler(async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStateMap= {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    const dbStatus = dbStateMap[dbState] || "unknown";
    const healthStatus = {
        status: dbState==1? "healthy" : "unhealthy",
        uptime: `${Math.floor(process.uptime())} seconds`,
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        },
        server: {
            nodeVersion: process.version,
            memoryUsage: {
                rss: `${process.memoryUsage().rss/(1024 * 1024)} MB`,
                heapTotal: `${process.memoryUsage().heapTotal/(1024 * 1024)} MB`,
                heapUsed: `${process.memoryUsage().heapUsed/(1024 * 1024)} MB`,
                external: `${process.memoryUsage().external/(1024 * 1024)} MB`
            }
        }
    }

    const statusCode = dbState==1? 200 : 503;

    return res.status(statusCode)
    .json(new ApiResponse(statusCode, "Health check status generated", healthStatus));
});


export { healthCheck };