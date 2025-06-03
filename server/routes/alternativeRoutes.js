const express = require('express');
const { voteAlternative, saveLevel3Response } = require('../controllers/alternativeVoteController');

const router = express.Router();

router.post('/vote', voteAlternative);
router.post('/save-level3-response', saveLevel3Response);

module.exports = router;
