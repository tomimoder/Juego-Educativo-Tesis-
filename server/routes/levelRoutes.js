const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');

router.get('/progress/:userId', levelController.getLevelProgress);
router.post('/unlock', levelController.unlockNextLevel);
router.post('/updateProgress', levelController.updateLevelProgress);
router.get('/:levelId', levelController.getLevelInfo);
router.post('/complete', levelController.markLevelCompleted);
router.post('/try-unlock', levelController.tryUnlockNextLevel);
router.get("/statistics/:levelId/:userId", levelController.getLevelStatistics);
router.post('/logs/move', levelController.logPieceMovement);
router.get('/assigned-solutions-level3/:levelId/:userId', levelController.getAssignedSolutionsLevel3); // Nueva ruta para nivel 3




module.exports = router;