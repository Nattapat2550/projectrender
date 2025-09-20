const express = require('express');
const passport = require('../config/passport');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.unifiedLogin); // Changed to unified login
router.get('/verify', authController.verifyToken);

// Google OAuth routes (for redirect flow)
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.redirect(`${process.env.FRONTEND_URL}/home.html?token=${token}`);
  }
);

module.exports = router;