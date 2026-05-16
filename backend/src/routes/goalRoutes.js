const express = require('express');
const {
  createGoal,
  getMyGoals,
  updateGoal,
  deleteGoal,
  submitGoalSheet,
  getTeamGoals,
  approveGoalSheet,
  returnGoalSheet,
  updateGoalByManager,
} = require('../controllers/goalController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('employee'), createGoal);
router.get('/my', authorize('employee'), getMyGoals);
router.put('/:id', authorize('employee'), updateGoal);
router.delete('/:id', authorize('employee'), deleteGoal);
router.post('/submit', authorize('employee'), submitGoalSheet);
router.get('/team', authorize('manager'), getTeamGoals);
router.put('/approve/:sheetId', authorize('manager'), approveGoalSheet);
router.put('/return/:sheetId', authorize('manager'), returnGoalSheet);
router.put('/manager-edit/:goalId', authorize('manager'), updateGoalByManager);

module.exports = router;
