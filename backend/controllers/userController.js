const { pool } = require('../db/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

exports.getProfile = async (req, res) => {
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
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateName = async (req, res) => {
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
    res.status(500).json({ error: 'Server error' });
  }
};

exports.uploadProfilePic = (req, res) => {
  upload.single('profilePic')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const profilePicPath = `/uploads/${req.file.filename}`;
      await pool.query(
        'UPDATE users SET profile_pic = $1 WHERE id = $2', 
        [profilePicPath, req.userId]
      );
      
      res.json({ 
        message: 'Profile picture updated successfully', 
        profile_pic: profilePicPath 
      });
    } catch (error) {
      console.error('Upload profile pic error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
};

exports.updateTheme = async (req, res) => {
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
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};