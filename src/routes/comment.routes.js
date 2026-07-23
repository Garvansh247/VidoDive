import { Router } from "express";
import { verifyJWT, checkVerifiedMiddleware } from "../middlewares/index.js";
import { getVideoComments, getTweetComments, addVideoComment, addTweetComment, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/video/:videoId")
    .get(getVideoComments)
    .post(checkVerifiedMiddleware, addVideoComment);

router.route("/tweet/:tweetId")
    .get(getTweetComments)
    .post(checkVerifiedMiddleware, addTweetComment);

router.route("/:commentId")
    .put(checkVerifiedMiddleware, updateComment)
    .delete(checkVerifiedMiddleware, deleteComment);

export default router;