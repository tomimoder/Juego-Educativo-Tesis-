const express = require('express');
const { getWaitingUsers } = require('../controllers/NewAdminController');

const router = express.Router();

// Add the waiting users endpoint
router.get('/waiting-users', getWaitingUsers);

module.exports = router;