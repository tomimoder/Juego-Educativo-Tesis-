const express = require('express');
const {getSolution, saveUserSolution, getLatestSolutions, getRandomSolutionFromAll} = require('../controllers/solutionController');
const router = express.Router();

router.get('/solution/:levelId', getSolution);
router.post('/user-solution', saveUserSolution);
router.get('/solutions/:levelId', getLatestSolutions);
router.get('/random-solution-from-all', getRandomSolutionFromAll);


module.exports = router;