import asyncHandler from "../utils/asyncHandler.js";

const userRegisterController = asyncHandler(async (req, res) => {
    res.status(200).json(
        { message: "Router and controller pipeline are successfully linked!" }
    )
});

export { userRegisterController };