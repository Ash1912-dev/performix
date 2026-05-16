const AuditLog = require('../models/AuditLog');
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');

const buildAuditFilters = (query) => {
  const filter = {};

  if (query.changeType) {
    filter.changeType = query.changeType;
  }

  if (query.employeeId) {
    filter.changedBy = query.employeeId;
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  return filter;
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue =
    typeof value === 'object' ? JSON.stringify(value) : String(value);

  return `"${stringValue.replace(/"/g, '""')}"`;
};

const getAuditLogs = async (req, res) => {
  try {
    const filter = buildAuditFilters(req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'name role email')
      .populate('goalId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await AuditLog.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message,
    });
  }
};

const exportAuditLog = async (req, res) => {
  try {
    const filter = await buildAuditFilters(req.query);
    const logs = await AuditLog.find(filter)
      .populate('changedBy', 'name role')
      .populate('goalId', 'title employeeId')
      .populate('goalSheetId', 'employeeId cycleYear status')
      .sort({ createdAt: -1 });

    const headers = [
      'id',
      'goalId',
      'goalSheetId',
      'changedByName',
      'changedByRole',
      'changeType',
      'description',
      'oldValue',
      'newValue',
      'createdAt',
    ];

    const rows = logs.map((log) =>
      [
        log._id,
        log.goalId?._id || '',
        log.goalSheetId?._id || '',
        log.changedBy?.name || '',
        log.changedBy?.role || '',
        log.changeType,
        log.description,
        log.oldValue,
        log.newValue,
        log.createdAt?.toISOString() || '',
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=audit-log.csv'
    );

    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message,
    });
  }
};

module.exports = {
  getAuditLogs,
  exportAuditLog,
};
