const EscalationRule = require('../models/EscalationRule');
const EscalationLog = require('../models/EscalationLog');
const { runEscalationEngine } = require('../utils/escalationEngine');

const getRules = async (req, res) => {
  try {
    const rules = await EscalationRule.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Escalation rules fetched successfully',
      data: rules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch escalation rules',
      error: error.message,
    });
  }
};

const createRule = async (req, res) => {
  try {
    const { name, triggerType, daysThreshold, escalationChain, isActive } =
      req.body;

    if (!name || !triggerType || daysThreshold === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, trigger type, and days threshold are required',
      });
    }

    const rule = await EscalationRule.create({
      name,
      triggerType,
      daysThreshold,
      escalationChain,
      isActive,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Escalation rule created successfully',
      data: rule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create escalation rule',
      error: error.message,
    });
  }
};

const updateRule = async (req, res) => {
  try {
    const rule = await EscalationRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Escalation rule not found',
      });
    }

    const { daysThreshold, isActive, escalationChain } = req.body;

    if (daysThreshold !== undefined) {
      rule.daysThreshold = daysThreshold;
    }

    if (isActive !== undefined) {
      rule.isActive = isActive;
    }

    if (escalationChain !== undefined) {
      rule.escalationChain = escalationChain;
    }

    await rule.save();

    return res.status(200).json({
      success: true,
      message: 'Escalation rule updated successfully',
      data: rule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update escalation rule',
      error: error.message,
    });
  }
};

const deleteRule = async (req, res) => {
  try {
    const rule = await EscalationRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Escalation rule not found',
      });
    }

    await rule.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Escalation rule deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete escalation rule',
      error: error.message,
    });
  }
};

const getEscalationLogs = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.triggerType) {
      filter.triggerType = req.query.triggerType;
    }

    if (req.query.userId) {
      filter.affectedUserId = req.query.userId;
    }

    if (req.query.resolved !== undefined) {
      filter.resolved = req.query.resolved === 'true';
    }

    const [logs, total] = await Promise.all([
      EscalationLog.find(filter)
        .populate('ruleId', 'name triggerType')
        .populate('affectedUserId', 'name email role department')
        .populate('managerId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EscalationLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Escalation logs fetched successfully',
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch escalation logs',
      error: error.message,
    });
  }
};

const resolveEscalation = async (req, res) => {
  try {
    const log = await EscalationLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Escalation log not found',
      });
    }

    log.resolved = true;
    log.resolvedAt = new Date();
    await log.save();

    return res.status(200).json({
      success: true,
      message: 'Escalation resolved successfully',
      data: log,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve escalation',
      error: error.message,
    });
  }
};

const runManually = async (req, res) => {
  try {
    const summary = await runEscalationEngine();

    return res.status(200).json({
      success: summary.success,
      message: summary.success
        ? 'Escalation engine ran successfully'
        : 'Escalation engine run completed with errors',
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to run escalation engine manually',
      error: error.message,
    });
  }
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getEscalationLogs,
  resolveEscalation,
  runManually,
};
