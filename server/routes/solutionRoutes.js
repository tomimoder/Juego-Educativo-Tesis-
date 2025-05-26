const express = require('express');
const {
    getSolution,
    saveUserSolution,
    getLatestSolutions,
    getRandomSolutionFromAll,
    rateSolution,
    checkUserRating,
    getAverageRatings,
    getBestSolutions,
    getAssignmentsForSolution,
    getAssignedSolutions,
    logPieceMovement,
    logLevelStart,
    getMoveCount,
    saveAlternativeSelection,
  } = require('../controllers/solutionController');
const router = express.Router();

router.get('/solution/:levelId', getSolution);
router.post('/user-solution', saveUserSolution);
router.get('/solutions/:levelId', getLatestSolutions);
router.get('/random-solution-from-all', getRandomSolutionFromAll);
router.post('/rate-solution', rateSolution);
router.get('/check-rating/:solutionId/:userId', checkUserRating);
router.get("/average-ratings", getAverageRatings);
router.get('/solutions/best/:levelId', getBestSolutions);
router.get('/solution-assignments/:solutionId', getAssignmentsForSolution);
router.get('/assigned-solutions/:levelId/:userId', getAssignedSolutions);
router.post('/move-piece', logPieceMovement);
router.post('/start-level', logLevelStart);
router.get('/move-count', getMoveCount);
router.post('/solutions/alternative', saveAlternativeSelection);




module.exports = router;