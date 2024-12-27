const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');

router.get('/progress/:userId', levelController.getLevelProgress);
router.post('/unlock', levelController.unlockNextLevel);
router.post('/updateProgress', levelController.updateLevelProgress);

module.exports = router;