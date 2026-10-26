const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Uploads an in-memory image buffer (from multer) to Cloudinary.
// Resolves with { url, public_id }.
const uploadBuffer = (buffer, folder = 'inkwell') =>
  new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      const err = new Error('Image uploads are not configured on the server (missing Cloudinary keys).');
      err.statusCode = 500;
      return reject(err);
    }
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
    stream.end(buffer);
  });

// Deletes an image by public id. Never throws – a failed cleanup should not break the request.
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}: ${error.message}`);
  }
};

module.exports = { cloudinary, uploadBuffer, deleteImage };
