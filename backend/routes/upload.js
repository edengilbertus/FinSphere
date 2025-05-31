const express = require('express');
const { uploadConfigs } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { generateSignedUrl, deleteFile } = require('../utils/gcs');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');

const router = express.Router();

// Upload profile avatar
router.post('/avatar', 
  authenticateToken,
  uploadConfigs.avatar.upload,
  uploadConfigs.avatar.gcs,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Update user's avatar URL in database
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          'profile.profilePictureUrl': req.file.cloudStoragePublicUrl, // Corrected field
          $push: {
            'profile.uploads': {
              type: 'avatar',
              url: req.file.cloudStoragePublicUrl,
              filename: req.file.cloudStorageFilename,
              uploadedAt: new Date()
            }
          }
        },
        { new: true, select: '-password -__v' } // Added -__v
      );

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: req.file.cloudStoragePublicUrl,
          filename: req.file.cloudStorageFilename,
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: error.message
      });
    }
  }
);

// Upload cover photo
router.post('/cover',
  authenticateToken,
  uploadConfigs.avatar.upload,
  uploadConfigs.avatar.gcs,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No cover photo uploaded'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user's cover photo URL
      user.profile.coverPhotoUrl = req.file.cloudStoragePublicUrl;
      
      // Add to uploads array
      user.profile.uploads.push({
        type: 'cover',
        url: req.file.cloudStoragePublicUrl,
        filename: req.file.cloudStorageFilename, // Corrected to use cloudStorageFilename
        uploadedAt: new Date() // Added uploadedAt
      });

      await user.save();

      res.json({
        success: true,
        message: 'Cover photo uploaded successfully',
        data: {
          coverPhotoUrl: req.file.cloudStoragePublicUrl,
          filename: req.file.cloudStorageFilename // Corrected to use cloudStorageFilename
        }
      });
    } catch (error) {
      console.error('Cover photo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload cover photo',
        error: error.message
      });
    }
  }
);

// Upload post images
router.post('/post-images',
  authenticateToken,
  uploadConfigs.postImages.upload,
  uploadConfigs.postImages.gcs,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedImages = req.files.map(file => ({
        url: file.cloudStoragePublicUrl,
        filename: file.cloudStorageFilename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      }));

      res.json({
        success: true,
        message: `${uploadedImages.length} image(s) uploaded successfully`,
        data: {
          images: uploadedImages,
          count: uploadedImages.length
        }
      });
    } catch (error) {
      console.error('Post images upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload post images',
        error: error.message
      });
    }
  }
);

// Upload KYC documents
router.post('/kyc-document',
  authenticateToken,
  uploadConfigs.kycDocument.upload,
  uploadConfigs.kycDocument.gcs,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No document uploaded'
        });
      }

      const { documentType } = req.body;
      
      if (!documentType || !['identity', 'address', 'income'].includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: 'Valid document type required (identity, address, income)'
        });
      }

      // Update user's KYC documents
      const kycUpdate = {
        [`kyc.documents.${documentType}`]: {
          filename: req.file.cloudStorageFilename,
          originalName: req.file.originalname,
          uploadedAt: new Date(),
          url: req.file.cloudStorageFilename, // Storing filename, signed URL will be generated on access
          status: 'pending',
          size: req.file.size,
          mimeType: req.file.mimetype
        },
        'kyc.lastUpdated': new Date()
      };

      // If this is the first document, initialize KYC status
      if (!req.user.kyc || !req.user.kyc.status) {
        kycUpdate['kyc.status'] = 'pending';
        kycUpdate['kyc.submittedAt'] = new Date();
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: kycUpdate },
        { new: true, select: '-password -__v' } // Added -__v
      );

      // Also add to the general profile.uploads array
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          'profile.uploads': {
            type: 'kyc',
            url: req.file.cloudStorageFilename, // Store filename, as it's private
            filename: req.file.cloudStorageFilename,
            originalName: req.file.originalname, // Optional: store original name here too
            documentType: documentType, // Optional: store specific KYC doc type
            uploadedAt: new Date()
          }
        }
      });
      
      // Fetch the user again to ensure all updates are present if not using the returned 'updatedUser' from the first call.
      // However, the updatedUser from the first call should be sufficient if the $set was comprehensive.

      res.json({
        success: true,
        message: 'KYC document uploaded successfully',
        data: {
          documentType,
          filename: req.file.cloudStorageFilename,
          status: 'pending',
          kycStatus: updatedUser.kyc?.status || 'pending'
        }
      });
    } catch (error) {
      console.error('KYC document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload KYC document',
        error: error.message
      });
    }
  }
);

// Upload message attachment
router.post('/message-attachment',
  authenticateToken,
  uploadConfigs.messageAttachment.upload,
  uploadConfigs.messageAttachment.gcs,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No attachment uploaded'
        });
      }

      // Generate signed URL for private access
      const signedUrl = await generateSignedUrl(req.file.cloudStorageFilename, 'read', Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      res.json({
        success: true,
        message: 'Message attachment uploaded successfully',
        data: {
          filename: req.file.cloudStorageFilename,
          originalName: req.file.originalname,
          signedUrl: signedUrl,
          size: req.file.size,
          mimeType: req.file.mimetype,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    } catch (error) {
      console.error('Message attachment upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload message attachment',
        error: error.message
      });
    }
  }
);

// Get signed URL for private file access
router.get('/signed-url/:filename',
  authenticateToken,
  async (req, res) => {
    try {
      const { filename } = req.params;
      const { expires } = req.query;
      
      // Security check - ensure user has access to this file
      // Check if file belongs to user (for KYC docs) or if user is part of conversation (for message attachments)
      let hasAccess = false;
      
      if (filename.startsWith('kyc/')) {
        // For KYC documents, only the owner can access
        const user = await User.findById(req.user._id);
        if (user.kyc && user.kyc.documents) {
          const userDocs = Object.values(user.kyc.documents);
          hasAccess = userDocs.some(doc => doc.filename === filename);
        }
      } else if (filename.startsWith('messages/')) {
        // For message attachments, check if user is part of any conversation with this attachment
        const message = await Message.findOne({
          'attachments.filename': filename,
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        });
        hasAccess = !!message;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this file'
        });
      }

      const expiresTime = expires ? parseInt(expires) : Date.now() + 15 * 60 * 1000; // Default 15 minutes
      const signedUrl = await generateSignedUrl(filename, 'read', expiresTime);

      res.json({
        success: true,
        data: {
          signedUrl,
          filename,
          expiresAt: new Date(expiresTime)
        }
      });
    } catch (error) {
      console.error('Signed URL generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate signed URL',
        error: error.message
      });
    }
  }
);

// Delete uploaded file
router.delete('/:filename',
  authenticateToken,
  async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Security check - ensure user owns this file or has permission to delete it
      let canDelete = false;
      
      if (filename.startsWith('avatars/')) {
        // For avatars, check if it's the user's current avatar
        const user = await User.findById(req.user._id);
        canDelete = user.profilePicture && user.profilePicture.includes(filename);
      } else if (filename.startsWith('posts/')) {
        // For post images, check if user owns a post with this image
        const post = await Post.findOne({
          author: req.user._id,
          images: { $elemMatch: { filename: filename } }
        });
        canDelete = !!post;
      } else if (filename.startsWith('kyc/')) {
        // For KYC documents, only the owner can delete
        const user = await User.findById(req.user._id);
        if (user.kyc && user.kyc.documents) {
          const userDocs = Object.values(user.kyc.documents);
          canDelete = userDocs.some(doc => doc.filename === filename);
        }
      } else if (filename.startsWith('messages/')) {
        // For message attachments, check if user sent the message
        const message = await Message.findOne({
          sender: req.user._id,
          'attachments.filename': filename
        });
        canDelete = !!message;
      }

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied to delete this file'
        });
      }

      // Delete file from Google Cloud Storage
      await deleteFile(filename);

      // Update relevant database records
      if (filename.startsWith('avatars/')) {
        await User.findByIdAndUpdate(req.user._id, {
          $unset: { profilePicture: "" }
        });
      } else if (filename.startsWith('posts/')) {
        await Post.updateMany(
          { author: req.user._id },
          { $pull: { images: { filename: filename } } }
        );
      } else if (filename.startsWith('kyc/')) {
        // Remove the specific KYC document
        const user = await User.findById(req.user._id);
        if (user.kyc && user.kyc.documents) {
          const docType = Object.keys(user.kyc.documents).find(
            key => user.kyc.documents[key].filename === filename
          );
          if (docType) {
            await User.findByIdAndUpdate(req.user._id, {
              $unset: { [`kyc.documents.${docType}`]: "" }
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'File deleted successfully',
        data: { filename }
      });
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: error.message
      });
    }
  }
);

// Get user's upload history
router.get('/history',
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('profile.uploads kyc profilePicture');
      const posts = await Post.find({ author: req.user._id }).select('images createdAt');
      
      const uploadHistory = {
        avatar: {
          current: user.profilePicture || null,
          history: user.profile?.uploads?.filter(upload => upload.type === 'avatar') || []
        },
        postImages: posts.reduce((acc, post) => {
          if (post.images && post.images.length > 0) {
            acc.push(...post.images.map(img => ({
              ...img,
              postId: post._id,
              uploadedAt: post.createdAt
            })));
          }
          return acc;
        }, []),
        kycDocuments: user.kyc?.documents || {},
        kycStatus: user.kyc?.status || 'not_started'
      };

      res.json({
        success: true,
        data: uploadHistory
      });
    } catch (error) {
      console.error('Upload history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upload history',
        error: error.message
      });
    }
  }
);

module.exports = router;
