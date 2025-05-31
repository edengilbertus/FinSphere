const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const sharp = require('sharp'); // Import sharp
const { bucket } = require('../utils/gcs');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for security
const fileFilter = (req, file, cb) => {
  // Define allowed file types for different upload types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocumentTypes = /pdf|doc|docx/;
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png, gif, webp) and documents (pdf, doc, docx) are allowed!'));
  }
};

// Configure multer with file size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per request
  }
});

// Middleware to upload file to Google Cloud Storage
const uploadToGCS = (folder = 'uploads', makePublic = false) => async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    const files = req.files || [req.file];
    const uploadPromises = files.map(async (file) => {
      if (!file) return null;

      let processedBuffer = file.buffer;
      let newMimetype = file.mimetype;
      let newFileExtension = path.extname(file.originalname);

      // Check if it's an image and process with sharp
      const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (imageMimeTypes.includes(file.mimetype)) {
        try {
          processedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          newMimetype = 'image/webp';
          newFileExtension = '.webp';
        } catch (sharpError) {
          console.warn('Sharp processing error, uploading original:', sharpError.message);
          // If sharp fails, upload the original file
        }
      }

      // Generate unique filename with potentially new extension
      const originalBaseName = path.basename(file.originalname, path.extname(file.originalname));
      const filename = `${folder}/${uuidv4()}-${Date.now()}-${originalBaseName}${newFileExtension}`;
      
      const blob = bucket.file(filename);
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: newMimetype, // Use new mimetype
        metadata: {
          metadata: {
            originalName: file.originalname,
            uploadedBy: req.user?._id?.toString() || 'anonymous',
            uploadedAt: new Date().toISOString(),
            processedWithSharp: newMimetype === 'image/webp' && imageMimeTypes.includes(file.mimetype) // Add a flag if processed
          }
        }
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
          console.error('GCS Upload Error:', error);
          reject(error);
        });

        blobStream.on('finish', async () => {
          try {
            // Make file public if requested
            if (makePublic) {
              await blob.makePublic();
              file.cloudStoragePublicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
            } else {
              // For private files, we'll generate signed URLs when needed
              file.cloudStorageObject = filename;
            }
            
            file.cloudStorageFilename = filename;
            file.processedMimeType = newMimetype; // Store the processed mime type
            file.processedSize = processedBuffer.length; // Store the processed size
            resolve(file);
          } catch (error) {
            reject(error);
          }
        });

        blobStream.end(processedBuffer); // Upload processed buffer
      });
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    
    // Update req object with uploaded file info
    if (req.files) {
      req.files = uploadedFiles.filter(file => file !== null);
    } else {
      req.file = uploadedFiles[0];
    }

    next();
  } catch (error) {
    console.error('Upload middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed',
      error: error.message 
    });
  }
};

// Specific upload configurations for different use cases
const uploadConfigs = {
  // Profile pictures - public, single file
  avatar: {
    upload: upload.single('avatar'),
    gcs: uploadToGCS('avatars', true)
  },
  
  // Post images - public, multiple files
  postImages: {
    upload: upload.array('images', 5),
    gcs: uploadToGCS('posts', true)
  },
  
  // KYC documents - private, single file
  kycDocument: {
    upload: upload.single('document'),
    gcs: uploadToGCS('kyc', false)
  },
  
  // Message attachments - private, single file
  messageAttachment: {
    upload: upload.single('attachment'),
    gcs: uploadToGCS('messages', false)
  }
};

module.exports = { 
  upload, 
  uploadToGCS, 
  uploadConfigs 
};
