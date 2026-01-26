import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;        

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.error('Error during Cloudinary upload:', error);
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) throw new Error('No file provided for deletion');

    const response = await cloudinary.uploader.destroy(publicId.public_id, {
      resource_type: publicId.resource_type
    })

    //file has been deleted successfully
    console.log("file is deleted from cloudinary ", response.url);
    return response;

  } catch (error) {
    console.error(`Error deleting resource from Cloudinary: ${error.message}`);
    throw new Error('Some error occured while deleting resource:', error)
  }
}

export { uploadOnCloudinary, deleteFromCloudinary }
