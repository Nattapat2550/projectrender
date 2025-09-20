const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Unified login function that handles both email/password and Google users
exports.unifiedLogin = async (req, res) => {
  try {
    const { email, password, googleToken } = req.body;

    // Google OAuth login
    if (googleToken) {
      // Verify Google token (you might want to use Google's token verification library)
      // For simplicity, we'll assume the frontend sends valid Google user data
      const googleUser = req.body.googleUser;
      
      if (!googleUser || !googleUser.email) {
        return res.status(400).json({ error: 'Invalid Google login data' });
      }

      let result = await pool.query('SELECT * FROM users WHERE email = $1 OR google_id = $2', 
        [googleUser.email, googleUser.googleId]);
      
      let user;
      if (result.rows.length > 0) {
        user = result.rows[0];
        // Update user if they previously registered with email/password
        if (!user.google_id) {
          await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', 
            [googleUser.googleId, user.id]);
        }
      } else {
        // Create new user from Google
        result = await pool.query(
          'INSERT INTO users (name, email, google_id, profile_pic) VALUES ($1, $2, $3, $4) RETURNING *',
          [googleUser.name, googleUser.email, googleUser.googleId, googleUser.photo]
        );
        user = result.rows[0];
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      return res.json({
        message: 'Google login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_pic: user.profile_pic
        },
        token
      });
    }

    // Traditional email/password login
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    if (user.google_id && !user.password) {
      return res.status(400).json({ error: 'Please login with Google' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

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
    res.status(500).json({ error: 'Server error' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, profile_pic',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      message: 'User created successfully', 
      user, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, name, email, profile_pic, theme FROM users WHERE id = $1', 
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};