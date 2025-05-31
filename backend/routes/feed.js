const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();

// @desc    Create a new post
// @route   POST /api/v1/feed
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, imageUrl, visibility = 'public' } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 2000 characters'
      });
    }

    const post = new Post({
      author: req.user._id,
      content: content.trim(),
      imageUrl: imageUrl || undefined,
      visibility
    });

    await post.save();
    
    // Populate author details
    await post.populate('author', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });

  } catch (error) {
    console.error('Create post error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating post'
    });
  }
});

// @desc    Get feed (public posts)
// @route   GET /api/v1/feed
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const posts = await Post.getPublicPosts(limit, skip);
    
    // Get total count for pagination
    const totalPosts = await Post.countDocuments({ 
      visibility: 'public', 
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: skip + posts.length < totalPosts,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed'
    });
  }
});

// @desc    Get user's own posts
// @route   GET /api/v1/feed/my-posts
// @access  Private
router.get('/my-posts', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.user._id, 
      isActive: true 
    })
      .populate('author', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
      .populate('comments.user', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalPosts = await Post.countDocuments({ 
      author: req.user._id, 
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: skip + posts.length < totalPosts,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your posts'
    });
  }
});

// @desc    Like/Unlike a post
// @route   POST /api/v1/feed/:id/like
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.toggleLike(req.user._id);
    const isLiked = post.isLikedBy(req.user._id);

    res.json({
      success: true,
      message: isLiked ? 'Post liked' : 'Post unliked',
      data: {
        isLiked,
        likeCount: post.likeCount
      }
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating like status'
    });
  }
});

// @desc    Add comment to a post
// @route   POST /api/v1/feed/:id/comment
// @access  Private
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment
    await post.populate('comments.user', 'profile.firstName profile.lastName profile.username profile.profilePictureUrl');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: newComment,
        commentCount: post.commentCount
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
});

// @desc    Delete a post
// @route   DELETE /api/v1/feed/:id
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post'
    });
  }
});

module.exports = router;
