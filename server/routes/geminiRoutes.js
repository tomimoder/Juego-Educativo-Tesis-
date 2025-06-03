const express = require('express');
const { getSimilarWords, getWordAttributes } = require('../controllers/geminiController');

const router = express.Router();

router.post('/similar-words', getSimilarWords);
router.post('/word-attributes', getWordAttributes);

module.exports = router;