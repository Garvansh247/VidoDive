import e from "express";

const asyncHandler = (fn) => {
    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next))
        .catch((error)=>{
            next(error);
        });
    }
}

export default asyncHandler;


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         // next(error);
//         res.status(error.status || 500).json({
//             success: false,
//             message: error.message || "Internal Server Error",
//         });
//     }
// }