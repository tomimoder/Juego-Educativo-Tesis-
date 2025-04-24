// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login', userController.login);
router.post('/update-status', userController.updateUserStatus);
router.post('/update-user-level', userController.updateUserLevel);
router.get('/solutions', userController.getSolutionsByLevel); // Ajustado para coincidir con el uso típico
router.get('/level-progress/:userId', userController.getLevelProgress); // Agregado si se usa
router.get('/current-user', userController.getCurrentUser); // Agregado si se usa

module.exports = router;