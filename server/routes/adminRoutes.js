const express = require('express');
const { getChatGroups, getUsers, createChatGroup, assignUser, resetGame, uploadStudents } = require('../controllers/adminController');

const router = express.Router();

router.get('/chat-groups', getChatGroups);
router.get('/users', getUsers);
router.post('/chat-groups', createChatGroup);
router.post('/assign-user', assignUser);
router.post('/reset-game', resetGame);
router.post('/upload-students', uploadStudents);

module.exports = router;