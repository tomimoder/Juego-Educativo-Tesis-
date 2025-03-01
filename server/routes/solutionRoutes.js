const express = require('express');
const {getSolution, saveUserSolution, getLatestSolutions, getRandomSolutionFromAll, rateSolution, checkUserRating, getAverageRatings} = require('../controllers/solutionController');
const router = express.Router();

router.get('/solution/:levelId', getSolution);
router.post('/user-solution', saveUserSolution);
router.get('/solutions/:levelId', getLatestSolutions);
router.get('/random-solution-from-all', getRandomSolutionFromAll);
router.post('/rate-solution', rateSolution);
router.get('/check-rating/:solutionId/:userId', checkUserRating);
router.get("/average-ratings", getAverageRatings);


module.exports = router;