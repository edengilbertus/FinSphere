const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID
  }
});

// Get the uploads bucket
const bucket = storage.bucket('finsphere-uploads');

// Helper function to generate signed URL for secure access
const generateSignedUrl = async (fileName, action = 'read', expires = Date.now() + 15 * 60 * 1000) => {
  try {
    const options = {
      version: 'v4',
      action,
      expires,
    };

    const [url] = await bucket.file(fileName).getSignedUrl(options);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Helper function to delete file from bucket
const deleteFile = async (fileName) => {
  try {
    await bucket.file(fileName).delete();
    console.log(`✅ File ${fileName} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to check if file exists
const fileExists = async (fileName) => {
  try {
    const [exists] = await bucket.file(fileName).exists();
    return exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

module.exports = { 
  bucket, 
  storage,
  generateSignedUrl,
  deleteFile,
  fileExists
};
