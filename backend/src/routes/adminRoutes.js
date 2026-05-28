const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  unlockGoal,
  getAllGoals,
  getCycleStatus,
  getCompletionDashboard,
  getCycleConfig,
  updateCycleConfig,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/goals', getAllGoals);
router.put('/goals/:id/unlock', unlockGoal);
router.get('/cycle-status', getCycleStatus);
router.get('/completion-dashboard', getCompletionDashboard);
router.get('/cycle-config', getCycleConfig);
router.put('/cycle-config', updateCycleConfig);

module.exports = router;
