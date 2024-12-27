const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login', userController.login);
router.get('/schools/:schoolId/students', userController.getStudentsBySchool);
router.put('/users/status', userController.updateUserStatus);

module.exports = router;
