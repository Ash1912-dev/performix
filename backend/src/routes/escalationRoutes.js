const express = require('express');
const {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getEscalationLogs,
  resolveEscalation,
  runManually,
} = require('../controllers/escalationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/rules', getRules);
router.post('/rules', createRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);
router.get('/logs', getEscalationLogs);
router.put('/logs/:id/resolve', resolveEscalation);
router.post('/run', runManually);

module.exports = router;
