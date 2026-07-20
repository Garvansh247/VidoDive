import { Router } from "express";
import { verifyJWT, checkVerifiedMiddleware } from "../middlewares/index.js";
import { toggleSubscription,getChannelSubscribers,getChannelSubscriptions } from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/:channelId")
    .post(checkVerifiedMiddleware, toggleSubscription)
    .get(getChannelSubscribers);

router.route("/subscriptions/:userId")
    .get(getChannelSubscriptions);

export default router;