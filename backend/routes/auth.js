const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get("/me", auth, getCurrentUser);

module.exports = router;
