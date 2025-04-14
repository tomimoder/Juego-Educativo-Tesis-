const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login', userController.login);
router.get('/schools/:schoolId/students', userController.getSolutionsByLevel);
router.put('/users/status', userController.updateUserStatus);
router.post('/update-status', userController.updateUserStatus);
router.post('/update-user-level', userController.updateUserLevel);



module.exports = router;
