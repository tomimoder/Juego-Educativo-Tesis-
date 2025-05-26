const express = require('express');
const { voteAlternative } = require('../controllers/alternativeVoteController');

const router = express.Router();

router.post('/vote', voteAlternative);

module.exports = router;
