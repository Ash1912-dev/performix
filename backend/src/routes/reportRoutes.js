const express = require('express');
const {
  getAchievementReport,
  exportAchievementReport,
  exportAchievementCSV,
  getManagerEffectiveness,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/achievement', authorize('admin', 'manager'), getAchievementReport);
router.get(
  '/achievement/export',
  authorize('admin', 'manager'),
  exportAchievementReport
);
router.get(
  '/achievement/export-csv',
  authorize('admin', 'manager'),
  exportAchievementCSV
);
router.get(
  '/manager-effectiveness',
  authorize('admin'),
  getManagerEffectiveness
);

module.exports = router;
