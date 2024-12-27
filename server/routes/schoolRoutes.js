// routes/schoolRoutes.js
const express = require('express');
const { getSchools, getStudents } = require('../controllers/schoolController');

const router = express.Router();

router.get('/schools', getSchools);
router.get('/schools/:schoolId/students', getStudents);

module.exports = router;
