// routes/schoolRoutes.js
const express = require('express');
const { getSchools, getStudents, getAvailableCourses } = require('../controllers/schoolController');

const router = express.Router();

router.get('/schools', getSchools);
router.get('/schools/:schoolId/students', getStudents);
router.get('/schools/:schoolId/courses', getAvailableCourses);

module.exports = router;
