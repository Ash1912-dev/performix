const EscalationRule = require('../models/EscalationRule');
const EscalationLog = require('../models/EscalationLog');
const GoalSheet = require('../models/GoalSheet');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const Goal = require('../models/Goal');
const {
  getCurrentQuarter,
  getCurrentCycleYear,
  getCycleOpenDateForQuarter,
  daysBetween,
} = require('./cycleUtils');
const { sendEscalationEmail } = require('./emailService');

const getRecipientsForRole = async (role, employee, managers, admins) => {
  if (role === 'employee') {
    return employee ? [employee] : [];
  }

  if (role === 'manager') {
    return managers;
  }

  if (role === 'admin') {
    return admins;
  }

  return [];
};

const hasOpenEscalation = async ({
  ruleId,
  affectedUserId,
  escalatedTo,
  periodKey,
}) =>
  EscalationLog.exists({
    ruleId,
    affectedUserId,
    escalatedTo,
    resolved: false,
    message: { $regex: periodKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') },
  });

const createEscalationLog = async ({
  ruleId,
  triggerType,
  affectedUserId,
  managerId,
  escalatedTo,
  message,
}) =>
  EscalationLog.create({
    ruleId,
    triggerType,
    affectedUserId,
    managerId,
    escalatedTo,
    message,
  });

const processGoalNotSubmitted = async (rule, summary) => {
  const cycleYear = getCurrentCycleYear();
  const openDate = getCycleOpenDateForQuarter('goal-setting', cycleYear);
  const daysOverdue = daysBetween(openDate);

  if (daysOverdue < rule.daysThreshold) {
    return;
  }

  const employees = await User.find({ role: 'employee', isActive: true })
    .populate('managerId', 'name email role')
    .select('name email role managerId');
  const goalSheets = await GoalSheet.find({ cycleYear }).select('employeeId status');
  const sheetMap = new Map(
    goalSheets.map((sheet) => [sheet.employeeId.toString(), sheet.status])
  );
  const admins = await User.find({ role: 'admin', isActive: true }).select(
    'name email role'
  );

  for (const employee of employees) {
    const sheetStatus = sheetMap.get(employee._id.toString());

    if (sheetStatus && sheetStatus !== 'draft' && sheetStatus !== 'returned') {
      continue;
    }

    const managers = employee.managerId ? [employee.managerId] : [];

    for (const role of rule.escalationChain) {
      const periodKey = `goal-setting-${cycleYear}-${role}`;
      const duplicate = await hasOpenEscalation({
        ruleId: rule._id,
        affectedUserId: employee._id,
        escalatedTo: role,
        periodKey,
      });

      if (duplicate) {
        continue;
      }

      const recipients = await getRecipientsForRole(
        role,
        employee,
        managers,
        admins
      );

      for (const recipient of recipients) {
        await sendEscalationEmail({
          to: recipient.email,
          role: recipient.role,
          triggerType: rule.triggerType,
          employeeName: employee.name,
          daysOverdue,
        });

        await createEscalationLog({
          ruleId: rule._id,
          triggerType: rule.triggerType,
          affectedUserId: employee._id,
          managerId: employee.managerId?._id || null,
          escalatedTo: role,
          message: `Period ${periodKey}: Goal sheet not submitted after ${daysOverdue} days`,
        });

        summary.logsCreated += 1;
      }
    }
  }
};

const processGoalNotApproved = async (rule, summary) => {
  const cycleYear = getCurrentCycleYear();
  const admins = await User.find({ role: 'admin', isActive: true }).select(
    'name email role'
  );
  const submittedSheets = await GoalSheet.find({
    cycleYear,
    status: 'submitted',
  }).populate('employeeId', 'name email managerId');

  for (const sheet of submittedSheets) {
    const daysOverdue = daysBetween(sheet.submittedAt || sheet.updatedAt);

    if (daysOverdue < rule.daysThreshold) {
      continue;
    }

    const employee = await User.findById(sheet.employeeId._id)
      .populate('managerId', 'name email role')
      .select('name email managerId');

    const managers = employee?.managerId ? [employee.managerId] : [];

    for (const role of rule.escalationChain) {
      const periodKey = `goal-approval-${cycleYear}-${sheet._id}-${role}`;
      const duplicate = await hasOpenEscalation({
        ruleId: rule._id,
        affectedUserId: sheet.employeeId._id,
        escalatedTo: role,
        periodKey,
      });

      if (duplicate) {
        continue;
      }

      const recipients = await getRecipientsForRole(
        role,
        employee,
        managers,
        admins
      );

      for (const recipient of recipients) {
        await sendEscalationEmail({
          to: recipient.email,
          role: recipient.role,
          triggerType: rule.triggerType,
          employeeName: employee?.name || sheet.employeeId.name,
          daysOverdue,
        });

        await createEscalationLog({
          ruleId: rule._id,
          triggerType: rule.triggerType,
          affectedUserId: sheet.employeeId._id,
          managerId: employee?.managerId?._id || null,
          escalatedTo: role,
          message: `Period ${periodKey}: Goal sheet awaiting approval for ${daysOverdue} days`,
        });

        summary.logsCreated += 1;
      }
    }
  }
};

const processCheckinNotCompleted = async (rule, summary) => {
  const cycleYear = getCurrentCycleYear();
  const currentQuarter = getCurrentQuarter();

  if (currentQuarter === 'goal-setting') {
    return;
  }

  const openDate = getCycleOpenDateForQuarter(currentQuarter, cycleYear);
  const daysOverdue = daysBetween(openDate);

  if (daysOverdue < rule.daysThreshold) {
    return;
  }

  const admins = await User.find({ role: 'admin', isActive: true }).select(
    'name email role'
  );
  const approvedSheets = await GoalSheet.find({
    cycleYear,
    status: 'approved',
  }).select('employeeId goals');

  for (const sheet of approvedSheets) {
    const employee = await User.findById(sheet.employeeId)
      .populate('managerId', 'name email role')
      .select('name email managerId');

    if (!employee) {
      continue;
    }

    const approvedGoals = await Goal.find({
      _id: { $in: sheet.goals },
      status: 'approved',
    }).select('_id');
    const goalIds = approvedGoals.map((goal) => goal._id);
    const checkInCount = await CheckIn.countDocuments({
      employeeId: employee._id,
      goalId: { $in: goalIds },
      quarter: currentQuarter,
      cycleYear,
    });

    if (goalIds.length === 0 || checkInCount >= goalIds.length) {
      continue;
    }

    const managers = employee.managerId ? [employee.managerId] : [];

    for (const role of rule.escalationChain) {
      const periodKey = `checkin-${currentQuarter}-${cycleYear}-${role}`;
      const duplicate = await hasOpenEscalation({
        ruleId: rule._id,
        affectedUserId: employee._id,
        escalatedTo: role,
        periodKey,
      });

      if (duplicate) {
        continue;
      }

      const recipients = await getRecipientsForRole(
        role,
        employee,
        managers,
        admins
      );

      for (const recipient of recipients) {
        await sendEscalationEmail({
          to: recipient.email,
          role: recipient.role,
          triggerType: rule.triggerType,
          employeeName: employee.name,
          daysOverdue,
        });

        await createEscalationLog({
          ruleId: rule._id,
          triggerType: rule.triggerType,
          affectedUserId: employee._id,
          managerId: employee.managerId?._id || null,
          escalatedTo: role,
          message: `Period ${periodKey}: Check-in not completed after ${daysOverdue} days`,
        });

        summary.logsCreated += 1;
      }
    }
  }
};

const runEscalationEngine = async () => {
  const summary = {
    processedRules: 0,
    logsCreated: 0,
  };

  try {
    const rules = await EscalationRule.find({ isActive: true }).sort({
      createdAt: 1,
    });

    for (const rule of rules) {
      summary.processedRules += 1;

      if (rule.triggerType === 'goal_not_submitted') {
        await processGoalNotSubmitted(rule, summary);
      }

      if (rule.triggerType === 'goal_not_approved') {
        await processGoalNotApproved(rule, summary);
      }

      if (rule.triggerType === 'checkin_not_completed') {
        await processCheckinNotCompleted(rule, summary);
      }
    }

    return {
      success: true,
      ...summary,
    };
  } catch (error) {
    console.error('Escalation engine failed:', error.message);
    return {
      success: false,
      ...summary,
      error: error.message,
    };
  }
};

module.exports = {
  runEscalationEngine,
};
