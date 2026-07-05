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
        pendingEmail: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            }
        ],

    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
)

userSchema.pre("save", async function(){
    if(!this.isModified("password")) return ;
    this.password=await bcrypt.hash(this.password, 10); // here 10 is the salt rounds, which determines the complexity of the hashing. A higher number means more security but also more processing time.
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

userSchema.methods.generateRefreshToken=function(sessionStartedAt){
    const payload={_id:this._id,sessionStartedAt}; // sessionStartedAt is used to invalidate refresh tokens when the user logs out or changes their password.
    return jwt.sign(
        payload, 
        process.env.REFRESH_TOKEN_SECRET, 
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    );
}

userSchema.methods.generateEmailVerificationToken=function(pendingEmail){
    const payload={_id:this._id, pendingEmail};
    return jwt.sign(
        payload,
        process.env.EMAIL_VERIFICATION_TOKEN_SECRET,
        {expiresIn: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY}
    );
}

export const User = mongoose.model("User", userSchema);