const express = require('express');
const {getSolution} = require('../controllers/solutionController');
const router = express.Router();

router.get('/solution/:levelId', getSolution);

module.exports = router;