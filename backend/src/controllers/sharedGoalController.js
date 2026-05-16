const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { calculateProgressScore } = require('../utils/scoreCalculator');

const DEFAULT_WEIGHTAGE = 10;
const MAX_GOALS = 8;

const createAuditLog = async ({
  goalId = null,
  goalSheetId = null,
  changedBy,
  changeType,
  oldValue = null,
  newValue = null,
  description,
}) =>
  AuditLog.create({
    goalId,
    goalSheetId,
    changedBy,
    changeType,
    oldValue,
    newValue,
    description,
  });

const calculateTotalWeightage = async (goalIds) => {
  const goals = await Goal.find({ _id: { $in: goalIds } }).select('weightage');
  return goals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
};

const findOrCreateGoalSheet = async (employeeId, cycleYear) => {
  let goalSheet = await GoalSheet.findOne({ employeeId, cycleYear });

  if (!goalSheet) {
    goalSheet = await GoalSheet.create({
      employeeId,
      cycleYear,
      goals: [],
      totalWeightage: 0,
    });
  }

  return goalSheet;
};

const pushSharedGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      thrustArea,
      uomType,
      target,
      targetDate,
      cycleYear,
      employeeIds,
    } = req.body;

    if (
      !title ||
      !thrustArea ||
      !uomType ||
      !cycleYear ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Title, thrust area, UoM type, cycle year, and employeeIds are required',
      });
    }

    const uniqueEmployeeIds = [...new Set(employeeIds.map(String))];
    const employees = await User.find({
      _id: { $in: uniqueEmployeeIds },
      role: 'employee',
      isActive: true,
    }).select('_id managerId name');

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid active employees found for this shared goal',
      });
    }

    if (req.user.role === 'manager') {
      const invalidEmployee = employees.find(
        (employee) => employee.managerId?.toString() !== req.user._id.toString()
      );

      if (invalidEmployee) {
        return res.status(403).json({
          success: false,
          message: 'Managers can push shared goals only to their team members',
        });
      }
    }

    const masterGoal = await Goal.create({
      employeeId: req.user._id,
      managerId: req.user.role === 'manager' ? req.user._id : null,
      title,
      description,
      thrustArea,
      uomType,
      target,
      targetDate,
      weightage: DEFAULT_WEIGHTAGE,
      status: 'approved',
      isShared: true,
      isSharedLocked: true,
      isLocked: true,
    });

    const createdGoals = [];
    const skippedEmployees = [];

    for (const employee of employees) {
      const goalSheet = await findOrCreateGoalSheet(employee._id, Number(cycleYear));

      if (goalSheet.goals.length >= MAX_GOALS) {
        skippedEmployees.push({
          employeeId: employee._id,
          reason: 'Maximum 8 goals already reached',
        });
        continue;
      }

      const sharedGoal = await Goal.create({
        employeeId: employee._id,
        managerId: employee.managerId || null,
        title,
        description,
        thrustArea,
        uomType,
        target,
        targetDate,
        weightage: DEFAULT_WEIGHTAGE,
        status: goalSheet.status === 'approved' ? 'approved' : 'draft',
        isShared: true,
        sharedFrom: masterGoal._id,
        isSharedLocked: true,
        isLocked: false,
      });

      goalSheet.goals.push(sharedGoal._id);
      goalSheet.totalWeightage = await calculateTotalWeightage(goalSheet.goals);

      if (goalSheet.status === 'approved') {
        goalSheet.status = 'draft';
        goalSheet.submittedAt = null;
        goalSheet.approvedAt = null;
      }

      await goalSheet.save();

      await createAuditLog({
        goalId: sharedGoal._id,
        goalSheetId: goalSheet._id,
        changedBy: req.user._id,
        changeType: 'goal_created',
        oldValue: null,
        newValue: {
          goal: sharedGoal.toObject(),
          goalSheet: goalSheet.toObject(),
          sharedFrom: masterGoal._id,
        },
        description: `Shared goal pushed to employee ${employee._id}`,
      });

      createdGoals.push({
        employeeId: employee._id,
        employeeName: employee.name,
        goalId: sharedGoal._id,
        goalSheetId: goalSheet._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Shared goal pushed successfully',
      masterGoal,
      totalEmployeesRequested: uniqueEmployeeIds.length,
      totalEmployeesReceived: createdGoals.length,
      skippedEmployees,
      distributedGoals: createdGoals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to push shared goal',
      error: error.message,
    });
  }
};

const getSharedGoals = async (req, res) => {
  try {
    const masterGoals = await Goal.find({
      employeeId: req.user._id,
      isShared: true,
      sharedFrom: null,
    }).sort({ createdAt: -1 });

    const masterGoalIds = masterGoals.map((goal) => goal._id);
    const distributedGoals = await Goal.find({
      sharedFrom: { $in: masterGoalIds },
    }).populate('employeeId', 'name email department');

    const distributedMap = new Map();

    distributedGoals.forEach((goal) => {
      const key = goal.sharedFrom.toString();

      if (!distributedMap.has(key)) {
        distributedMap.set(key, []);
      }

      distributedMap.get(key).push({
        goalId: goal._id,
        employee: goal.employeeId,
        weightage: goal.weightage,
        status: goal.status,
        isLocked: goal.isLocked,
      });
    });

    const sharedGoals = masterGoals.map((goal) => ({
      ...goal.toObject(),
      recipients: distributedMap.get(goal._id.toString()) || [],
    }));

    return res.status(200).json({
      success: true,
      message: 'Shared goals fetched successfully',
      sharedGoals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch shared goals',
      error: error.message,
    });
  }
};

const updateSharedGoalAchievement = async (req, res) => {
  try {
    const { quarter, cycleYear, actualAchievement, achievementDate, status } =
      req.body;

    if (!quarter) {
      return res.status(400).json({
        success: false,
        message: 'Quarter is required',
      });
    }

    const sourceGoal = await Goal.findOne({
      _id: req.params.goalId,
      employeeId: req.user._id,
      isShared: true,
      sharedFrom: { $ne: null },
    });

    if (!sourceGoal) {
      return res.status(404).json({
        success: false,
        message: 'Shared goal not found',
      });
    }

    const effectiveCycleYear = Number(cycleYear) || new Date().getFullYear();
    const linkedGoals = await Goal.find({
      $or: [
        { _id: sourceGoal._id },
        { sharedFrom: sourceGoal.sharedFrom },
      ],
    });

    const linkedGoalIds = linkedGoals.map((goal) => goal._id);
    const checkIns = await CheckIn.find({
      goalId: { $in: linkedGoalIds },
      quarter,
      cycleYear: effectiveCycleYear,
    });

    const checkInMap = new Map(
      checkIns.map((checkIn) => [checkIn.goalId.toString(), checkIn])
    );

    const updatedCheckIns = [];

    for (const goal of linkedGoals) {
      const existingCheckIn = checkInMap.get(goal._id.toString());

      if (!existingCheckIn) {
        continue;
      }

      const oldValue = existingCheckIn.toObject();

      existingCheckIn.actualAchievement = actualAchievement;

      if (achievementDate !== undefined) {
        existingCheckIn.achievementDate = achievementDate;
      }

      if (status) {
        existingCheckIn.status = status;
      }

      existingCheckIn.progressScore = calculateProgressScore({
        uomType: goal.uomType,
        target: existingCheckIn.plannedTarget ?? goal.target,
        actual: actualAchievement,
        targetDate: goal.targetDate,
        achievementDate: achievementDate ?? existingCheckIn.achievementDate,
      });

      await existingCheckIn.save();

      await createAuditLog({
        goalId: goal._id,
        changedBy: req.user._id,
        changeType: 'checkin_added',
        oldValue,
        newValue: existingCheckIn.toObject(),
        description: `Shared goal achievement synced for ${quarter}`,
      });

      updatedCheckIns.push(existingCheckIn);
    }

    return res.status(200).json({
      success: true,
      message: 'Shared goal achievement synced successfully',
      updatedCount: updatedCheckIns.length,
      checkIns: updatedCheckIns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to sync shared goal achievement',
      error: error.message,
    });
  }
};

module.exports = {
  pushSharedGoal,
  getSharedGoals,
  updateSharedGoalAchievement,
};
