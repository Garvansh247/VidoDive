import { Router } from "express";
import { userRegisterController,userLoginController,userLogoutAllSessionsController,userLogoutController,refreshAccessTokenController
,updateUserAccountTextFieldsController,updateUserAccountAvatarController, updateUserAccountCoverImageController, verifyEmailController, resendVerificationEmailController,
 changeUserPasswordController, getCurrentUserController, getChannelProfileController, getWatchHistoryController
 } from "../controllers/user.controller.js";
import { verifyJWT,checkVerifiedMiddleware,upload } from "../middlewares/index.js";


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

router.route("/resend-verification-email").post(verifyJWT, resendVerificationEmailController);
router.route("/verify-email").get(verifyEmailController);

router.route("/update-account-text-fields").patch(verifyJWT, updateUserAccountTextFieldsController);
router.route("/update-account-avatar").patch(verifyJWT, checkVerifiedMiddleware, upload.single("avatar"), updateUserAccountAvatarController);
router.route("/update-account-cover-image").patch(verifyJWT, checkVerifiedMiddleware, upload.single("coverImage"), updateUserAccountCoverImageController);

router.route("/change-password").patch(verifyJWT, checkVerifiedMiddleware, changeUserPasswordController);
router.route("/current-user").get(verifyJWT, getCurrentUserController);

router.route("/channel/:username").get(getChannelProfileController);
router.route("/watch-history").get(verifyJWT, getWatchHistoryController);



export default router;