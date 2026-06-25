import multer from "multer";
import path from "path";

const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./public/temp');
    },
    filename: function(req,file,cb){
        const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1e9);
        cb(null,file.originalname.split('.')[0]+'-'+uniqueSuffix+path.extname(file.originalname));
    }
})

export const upload=multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    }
});