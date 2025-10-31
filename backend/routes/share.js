// backend/routes/share.js
const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

// Create share link (POST /api/share)
router.post('/', shareController.createShare);

// Revoke share link (DELETE /api/share/:token) - secure this if required
router.delete('/:token', shareController.revokeShare);

module.exports = router;
