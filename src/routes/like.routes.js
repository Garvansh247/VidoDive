import { Router } from "express"
import { verifyJWT, checkVerifiedMiddleware } from "../middlewares/index.js";
import { toggleCommentLike,toggleTweetLike,toggleVideoLike,getLikedComments,getLikedTweets,getLikedVideos } from "../controllers/like.controller.js";

const router= Router();


router.use(verifyJWT);

router.route("/video/:videoId")
    .patch(checkVerifiedMiddleware, toggleVideoLike);

router.route("/tweet/:tweetId")
    .patch(checkVerifiedMiddleware, toggleTweetLike);

router.route("/comment/:commentId")
    .patch(checkVerifiedMiddleware, toggleCommentLike);

router.route("/liked-videos")
    .get(getLikedVideos);

router.route("/liked-tweets")
    .get(getLikedTweets);

router.route("/liked-comments")
    .get(getLikedComments);

export default router;