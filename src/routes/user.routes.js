import { Router } from "express";
import { userRegisterController,userLoginController,userLogoutAllSessionsController,userLogoutController,refreshAccessTokenController } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/verifyJWT.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
]),
userRegisterController);

router.route("/login").post(userLoginController);
router.route("/logout").post(verifyJWT, userLogoutController);
router.route("/logout-all-sessions").post(verifyJWT, userLogoutAllSessionsController);
router.route("/refresh-access-token").post(refreshAccessTokenController);


export default router;