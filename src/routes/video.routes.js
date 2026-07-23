import { Router } from "express";
import { getAllVideos, getVideoById, publishVideo, updateVideo, deleteVideo, togglePublishStatus } from "../controllers/video.controller.js";

import { checkVerifiedMiddleware, verifyJWT, upload } from "../middlewares/index.js";

const router = Router();

router.use(verifyJWT);
router.route("/")
        .get(getAllVideos)
        .post(
            checkVerifiedMiddleware, 
            upload.fields([{ name: "videoFile", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]),
            publishVideo
        );
router.route("/:videoId")
        .get(getVideoById)
        .put(
            checkVerifiedMiddleware, 
            upload.single("thumbnail"),
            updateVideo
        )
        .delete(checkVerifiedMiddleware, deleteVideo);

router.route("/:videoId/toggle-publish")
        .patch(
            checkVerifiedMiddleware, 
            togglePublishStatus
        );

export default router;