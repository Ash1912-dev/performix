const express = require('express');
const {
  getEmployeeTrends,
  getTeamTrends,
  getDepartmentTrends,
  getGoalDistribution,
  getCompletionHeatmap,
  getManagerEffectivenessDashboard,
  getOrgOverview,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/employee-trends', authorize('manager', 'admin'), getEmployeeTrends);
router.get('/team-trends', authorize('manager', 'admin'), getTeamTrends);
router.get('/department-trends', authorize('admin'), getDepartmentTrends);
router.get('/goal-distribution', authorize('manager', 'admin'), getGoalDistribution);
router.get('/completion-heatmap', authorize('admin'), getCompletionHeatmap);
router.get(
  '/manager-effectiveness',
  authorize('admin'),
  getManagerEffectivenessDashboard
);
router.get('/org-overview', authorize('admin'), getOrgOverview);

module.exports = router;
