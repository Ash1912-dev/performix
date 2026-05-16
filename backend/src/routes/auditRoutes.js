const express = require('express');
const {
  getAuditLogs,
  exportAuditLog,
} = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getAuditLogs);
router.get('/export', exportAuditLog);

module.exports = router;
