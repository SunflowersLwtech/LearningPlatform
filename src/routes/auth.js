const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);

module.exports = router;