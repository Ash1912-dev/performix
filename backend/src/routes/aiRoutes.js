const express = require('express');
const { suggestGoalHandler } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('employee', 'manager'));

router.post('/suggest-goal', suggestGoalHandler);

module.exports = router;
