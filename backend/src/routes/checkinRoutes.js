const express = require('express');
const {
  submitCheckIn,
  getMyCheckIns,
  getTeamCheckIns,
  addManagerComment,
  getCheckInSummary,
} = require('../controllers/checkinController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('employee'), submitCheckIn);
router.get('/my', authorize('employee'), getMyCheckIns);
router.get('/team', authorize('manager'), getTeamCheckIns);
router.get('/summary/:employeeId', authorize('employee', 'manager', 'admin'), getCheckInSummary);
router.put('/:id/comment', authorize('manager'), addManagerComment);

module.exports = router;
