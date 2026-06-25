import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
            select: false, // Exclude password from query results by default
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            }
        ],
        refreshToken: {
            type: String,
            select: false, // Exclude refreshToken from query results by default
        }

    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password, 10); // here 10 is the salt rounds, which determines the complexity of the hashing. A higher number means more security but also more processing time.
    next();
})

userSchema.methods.isPasswordCorrect=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.generateAccessToken=function(){
    const payload={_id:this._id, username:this.username, email:this.email, fullName:this.fullName};

    return jwt.sign(
        payload, 
        process.env.ACCESS_TOKEN_SECRET, 
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    );
}

userSchema.methods.generateRefreshToken=function(){
    const payload={_id:this._id};
    return jwt.sign(
        payload, 
        process.env.REFRESH_TOKEN_SECRET, 
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    );
}


export const User = mongoose.model("User", userSchema);