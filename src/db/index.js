import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDatabase = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to database:", connectionInstance.connection.name);
        console.log("Database connection state:", connectionInstance.connection.readyState);
        console.log("Database connection host:", connectionInstance.connection.host);
    } catch(error) {
        console.error("Error connecting to database:", error);
        process.exit(1); // Exit the process with an error code
    }
}

export default connectToDatabase;