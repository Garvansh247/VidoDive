import express from "express";
import connectToDatabase from "./db/index.js";
import { app } from "./app.js";




const PORT=process.env.PORT || 8000;

connectToDatabase()
.then(()=>{
    app.on("error",(error)=>{
        console.error("Express server error:", error);
        process.exit(1); // Exit the process with an error code
    });

    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error)=>{
    console.error("Error connecting to database:", error);
    process.exit(1); // Exit the process with an error code
});

app.get("/",(req,res)=>{
    res.send("Hello World");
});