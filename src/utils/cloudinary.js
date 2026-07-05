import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
    

const uploadToCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath || !fs.existsSync(localFilePath)){
            throw new Error('File does not exist at the specified path');
        }

        const result=await cloudinary.uploader.upload(localFilePath,{
            folder: 'uploads', // Optional: specify a folder in Cloudinary
            unique_filename: false, // Do not append a unique suffix to the filename
            resource_type: 'auto', // Automatically detect the file type (image, video, etc.)
        });
        if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath); // Delete the local file after successful upload
        }
        return result; // Return the upload result if successful

    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath); // Delete the local file if it exists 
        }
    }
    return null; // Return null if the upload fails
}

const deleteFromCloudinary=async (publicId)=>{
    try{
        if(!publicId){
            throw new Error('Public ID is required for deletion');
        }
        const result = await cloudinary.uploader.destroy(publicId,{
            resource_type: 'auto', // Automatically detect the file type (image, video, etc.)
        });
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
}

export { uploadToCloudinary, deleteFromCloudinary };