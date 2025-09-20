const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { pool } = require('../db/db');

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, profile_pic',
      [name, email, hashedPassword]
    );
    
    const user = result.rows[0];
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'User created successfully', 
      user, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    if (user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
    } else {
      // User registered with Google, no password
      return res.status(400).json({ 
        error: 'Please login with Google or reset your password' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' 
    });
    
    res.json({ 
      message: 'Login successful', 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_pic: user.profile_pic
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login.html',
    session: false
  }),
  async (req, res) => {
    try {
      // Create JWT token for the authenticated user
      const token = jwt.sign(
        { userId: req.user.id }, 
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      
      // Redirect to home page with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/home.html?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/login.html?error=auth_failed');
    }
  }
);

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Get user data
    const result = await pool.query(
      'SELECT id, name, email, profile_pic, theme FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;