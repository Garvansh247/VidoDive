import sendEmail from "./email.js";
import ApiError from "./ApiError.js";

const sendEmailForVerification = async (to, token) => {
    try {
        const verificationLink = `http://localhost:8000/api/v1/users/verify-email?token=${token}`;
        const subject = "Verify Your Email Address";
        const html = `
            <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>If you did not request this, please ignore this email.</p>
        `;
        await sendEmail({ to, subject, html });
    } catch (error) {
        throw new ApiError(500, "Failed to send verification email", error.message);
    }
};



export default sendEmailForVerification;



// sendEmailForVerification