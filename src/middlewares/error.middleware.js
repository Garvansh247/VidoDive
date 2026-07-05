import ApiError from "../utils/ApiError.js";

const errorMiddleware=(err,_,res,next)=>{
    let error=err;
    if(!(error instanceof ApiError)){
        error=new ApiError(
            error.statusCode || 500,
            error.message || "Internal Server Error",
            error.errors || [],
            error.stack || ""
        );
    }
    res.status(error.statusCode).json({
        success:false,
        message:error.message,
        errors:error.errors,
        data:error.data,
        stack:process.env.NODE_ENV==="development"?error.stack:undefined,
    });
};

export default errorMiddleware;