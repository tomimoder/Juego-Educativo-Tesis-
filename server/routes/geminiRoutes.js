const express = require('express');
const { getSimilarWords } = require('../controllers/geminiController');

const router = express.Router();

router.post('/similar-words', getSimilarWords);

module.exports = router;