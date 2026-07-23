import { Router } from "express";
import { verifyJWT, checkVerifiedMiddleware } from "../middlewares/index.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(checkVerifiedMiddleware, createPlaylist)
    .get(getUserPlaylists);

router.route("/:playlistId")
    .get(getPlaylistById)
    .put(checkVerifiedMiddleware, updatePlaylist)
    .delete(checkVerifiedMiddleware, deletePlaylist);

router.route("/:playlistId/videos/:videoId")
    .post(checkVerifiedMiddleware, addVideoToPlaylist)
    .delete(checkVerifiedMiddleware, removeVideoFromPlaylist);

export default router;