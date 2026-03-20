const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fs = require('fs');

const uploadImage = async (filePath) => {
    try {
        if (!filePath) throw new Error("File path missing");

        console.log('Starting Cloudinary upload from path:', filePath);

        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'mini-insta',
            resource_type: 'auto'
        });

        console.log('Cloudinary Upload Success:', result.secure_url);

        // Clean up the temporary file
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error('Failed to clean up temp file:', err);
        }

        return result;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
};

module.exports = { cloudinary, uploadImage };
