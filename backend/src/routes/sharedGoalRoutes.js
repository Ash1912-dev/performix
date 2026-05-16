const express = require('express');
const {
  pushSharedGoal,
  getSharedGoals,
  updateSharedGoalAchievement,
} = require('../controllers/sharedGoalController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/push', authorize('manager', 'admin'), pushSharedGoal);
router.get('/', authorize('manager', 'admin'), getSharedGoals);
router.put('/:goalId/achievement', authorize('employee'), updateSharedGoalAchievement);

module.exports = router;
