const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/name', authMiddleware, userController.updateName);
router.post('/profile-picture', authMiddleware, userController.uploadProfilePic);
router.put('/theme', authMiddleware, userController.updateTheme);
router.delete('/account', authMiddleware, userController.deleteAccount);

module.exports = router;