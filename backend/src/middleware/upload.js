import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

// Setup local uploads directory for fallback storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage for direct processing / cloudinary streaming
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, and PDF files are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});

// Helper to upload buffer to Cloudinary or save locally if offline
export const uploadFileBuffer = async (fileBuffer, fileName, folder = 'apartment_management') => {
  try {
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'auto', public_id: `${Date.now()}_${path.parse(fileName).name}` },
          (error, result) => {
            if (error) {
              // Fallback to base64 data URI if cloudinary fails
              const base64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
              resolve(base64);
            } else {
              resolve(result.secure_url);
            }
          }
        );
        stream.end(fileBuffer);
      });
    } else {
      // Local or base64 fallback
      const base64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      return base64;
    }
  } catch (err) {
    const base64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    return base64;
  }
};
