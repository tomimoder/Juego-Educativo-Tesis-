// routes/messageRoutes.js
const express = require('express');
const { saveMessage } = require('../controllers/messageController');
const router = express.Router();

router.post('/messages', saveMessage);

module.exports = router;