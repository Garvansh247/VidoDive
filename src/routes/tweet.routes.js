import { Router } from "express";

import { getAllTweets, createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";
import {verifyJWT, checkVerifiedMiddleware} from "../middlewares/index.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .get(getAllTweets)
    .post(checkVerifiedMiddleware, createTweet);

router.route("/user/:userId")
    .get(getUserTweets);

router.route("/:tweetId")
    .patch(checkVerifiedMiddleware, updateTweet)
    .delete(checkVerifiedMiddleware, deleteTweet);

export default router;