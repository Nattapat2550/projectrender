const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db/db');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Verify user exists
    const result = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, profile_pic, theme FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user name
router.put('/name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2',
      [name.trim(), req.userId]
    );
    
    res.json({ message: 'Name updated successfully' });
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile picture
router.post('/profile-picture', authenticateToken, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const profilePicPath = `/uploads/${req.file.filename}`;
    
    // Update database
    await pool.query(
      'UPDATE users SET profile_pic = $1 WHERE id = $2',
      [profilePicPath, req.userId]
    );
    
    res.json({ 
      message: 'Profile picture updated successfully',
      profile_pic: profilePicPath 
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update theme preference
router.put('/theme', authenticateToken, async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme value' });
    }
    
    await pool.query(
      'UPDATE users SET theme = $1 WHERE id = $2',
      [theme, req.userId]
    );
    
    res.json({ message: 'Theme updated successfully' });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;