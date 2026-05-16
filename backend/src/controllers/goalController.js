const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const {
  sendGoalSubmissionEmail,
  sendGoalApprovalEmail,
  sendGoalRejectionEmail,
} = require('../utils/emailService');

const CURRENT_CYCLE_YEAR = new Date().getFullYear();
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

const populateGoalSheet = (query) =>
  query
    .populate('employeeId', 'name email role department managerId')
    .populate({
      path: 'goals',
      populate: [
        { path: 'employeeId', select: 'name email department' },
        { path: 'managerId', select: 'name email department role' },
        { path: 'sharedFrom', select: 'title thrustArea weightage' },
      ],
    });

const findOrCreateGoalSheet = async (employeeId) => {
  let goalSheet = await GoalSheet.findOne({
    employeeId,
    cycleYear: CURRENT_CYCLE_YEAR,
  });

  if (!goalSheet) {
    goalSheet = await GoalSheet.create({
      employeeId,
      cycleYear: CURRENT_CYCLE_YEAR,
      goals: [],
      totalWeightage: 0,
    });
  }

  return goalSheet;
};

const createGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      thrustArea,
      uomType,
      target,
      targetDate,
      weightage,
      isShared,
      sharedFrom,
    } = req.body;

    if (!title || !thrustArea || !uomType || weightage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, thrust area, UoM type, and weightage are required',
      });
    }

    if (Number(weightage) < 10) {
      return res.status(400).json({
        success: false,
        message: 'Weightage must be at least 10',
      });
    }

    const goalSheet = await findOrCreateGoalSheet(req.user._id);

    if (goalSheet.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved goal sheet cannot be modified',
      });
    }

    if (goalSheet.goals.length >= MAX_GOALS) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 8 goals allowed in a goal sheet',
      });
    }

    const goal = await Goal.create({
      employeeId: req.user._id,
      managerId: req.user.managerId || null,
      title,
      description,
      thrustArea,
      uomType,
      target,
      targetDate,
      weightage,
      status: goalSheet.status === 'returned' ? 'returned' : 'draft',
      isShared,
      sharedFrom,
      isLocked: false,
    });

    goalSheet.goals.push(goal._id);
    goalSheet.totalWeightage = await calculateTotalWeightage(goalSheet.goals);
    goalSheet.status = 'draft';
    goalSheet.submittedAt = null;
    goalSheet.approvedAt = null;
    await goalSheet.save();

    await createAuditLog({
      goalId: goal._id,
      goalSheetId: goalSheet._id,
      changedBy: req.user._id,
      changeType: 'goal_created',
      oldValue: null,
      newValue: {
        goal: goal.toObject(),
        goalSheet: goalSheet.toObject(),
      },
      description: `Goal created: ${goal.title}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      goal,
      totalWeightage: goalSheet.totalWeightage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message,
    });
  }
};

const getMyGoals = async (req, res) => {
  try {
    const goalSheet = await GoalSheet.findOne({
      employeeId: req.user._id,
      cycleYear: CURRENT_CYCLE_YEAR,
    });

    if (!goalSheet) {
      return res.status(200).json({
        success: true,
        message: 'No goal sheet found',
        data: null,
      });
    }

    const populatedGoalSheet = await populateGoalSheet(
      GoalSheet.findById(goalSheet._id)
    );

    return res.status(200).json({
      success: true,
      message: 'Goal sheet fetched successfully',
      data: populatedGoalSheet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch goal sheet',
      error: error.message,
    });
  }
};

const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      employeeId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    if (goal.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Locked goals cannot be updated',
      });
    }

    const goalSheet = await GoalSheet.findOne({
      employeeId: req.user._id,
      cycleYear: CURRENT_CYCLE_YEAR,
    });

    if (!goalSheet || goalSheet.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved goal sheet cannot be modified',
      });
    }

    const allowedFields = [
      'title',
      'description',
      'thrustArea',
      'uomType',
      'target',
      'targetDate',
      'weightage',
      'isShared',
      'sharedFrom',
    ];

    const oldGoal = goal.toObject();
    const oldGoalSheet = goalSheet.toObject();

    if (goal.isSharedLocked) {
      const restrictedFields = ['title', 'description', 'target', 'targetDate'];
      const hasRestrictedUpdate = restrictedFields.some(
        (field) => req.body[field] !== undefined
      );

      if (hasRestrictedUpdate) {
        return res.status(400).json({
          success: false,
          message:
            'Shared locked goals allow employees to update weightage only',
        });
      }
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        goal[field] = req.body[field];
      }
    });

    if (goal.weightage < 10) {
      return res.status(400).json({
        success: false,
        message: 'Weightage must be at least 10',
      });
    }

    goal.status = goalSheet.status === 'returned' ? 'returned' : 'draft';
    await goal.save();

    goalSheet.totalWeightage = await calculateTotalWeightage(goalSheet.goals);
    goalSheet.status = 'draft';
    goalSheet.submittedAt = null;
    goalSheet.approvedAt = null;
    await goalSheet.save();

    await createAuditLog({
      goalId: goal._id,
      goalSheetId: goalSheet._id,
      changedBy: req.user._id,
      changeType: 'goal_updated',
      oldValue: {
        goal: oldGoal,
        goalSheet: oldGoalSheet,
      },
      newValue: {
        goal: goal.toObject(),
        goalSheet: goalSheet.toObject(),
      },
      description: `Goal updated: ${goal.title}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      goal,
      totalWeightage: goalSheet.totalWeightage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message,
    });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      employeeId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    if (goal.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Locked goals cannot be deleted',
      });
    }

    const goalSheet = await GoalSheet.findOne({
      employeeId: req.user._id,
      cycleYear: CURRENT_CYCLE_YEAR,
    });

    if (!goalSheet || goalSheet.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved goal sheet cannot be modified',
      });
    }

    const oldGoal = goal.toObject();
    const oldGoalSheet = goalSheet.toObject();

    goalSheet.goals = goalSheet.goals.filter(
      (goalId) => goalId.toString() !== goal._id.toString()
    );
    goalSheet.totalWeightage = await calculateTotalWeightage(goalSheet.goals);
    goalSheet.status = 'draft';
    goalSheet.submittedAt = null;
    goalSheet.approvedAt = null;
    await goalSheet.save();

    await goal.deleteOne();

    await createAuditLog({
      goalId: oldGoal._id,
      goalSheetId: goalSheet._id,
      changedBy: req.user._id,
      changeType: 'goal_deleted',
      oldValue: {
        goal: oldGoal,
        goalSheet: oldGoalSheet,
      },
      newValue: {
        goal: null,
        goalSheet: goalSheet.toObject(),
      },
      description: `Goal deleted: ${oldGoal.title}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
      totalWeightage: goalSheet.totalWeightage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message,
    });
  }
};

const submitGoalSheet = async (req, res) => {
  try {
    const goalSheet = await GoalSheet.findOne({
      employeeId: req.user._id,
      cycleYear: CURRENT_CYCLE_YEAR,
    });

    if (!goalSheet) {
      return res.status(404).json({
        success: false,
        message: 'Goal sheet not found',
      });
    }

    if (goalSheet.goals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add at least one goal before submission',
      });
    }

    const oldGoalSheet = goalSheet.toObject();
    goalSheet.totalWeightage = await calculateTotalWeightage(goalSheet.goals);

    if (goalSheet.totalWeightage !== 100) {
      return res.status(400).json({
        success: false,
        message: 'Total weightage must equal 100 before submission',
      });
    }

    goalSheet.status = 'submitted';
    goalSheet.submittedAt = new Date();
    goalSheet.approvedAt = null;
    await goalSheet.save();

    await Goal.updateMany(
      { _id: { $in: goalSheet.goals } },
      { $set: { status: 'submitted' } }
    );

    const populatedGoalSheet = await populateGoalSheet(
      GoalSheet.findById(goalSheet._id)
    );

    await createAuditLog({
      goalSheetId: goalSheet._id,
      changedBy: req.user._id,
      changeType: 'sheet_submitted',
      oldValue: oldGoalSheet,
      newValue: goalSheet.toObject(),
      description: `Goal sheet submitted for cycle ${goalSheet.cycleYear}`,
    });

    const manager = req.user.managerId
      ? await User.findById(req.user.managerId).select('name email role')
      : null;

    if (manager?.email) {
      await sendGoalSubmissionEmail({
        to: manager.email,
        employeeName: req.user.name,
        managerName: manager.name,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Goal sheet submitted successfully',
      goalSheet: populatedGoalSheet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit goal sheet',
      error: error.message,
    });
  }
};

const getTeamGoals = async (req, res) => {
  try {
    const teamMembers = await User.find({ managerId: req.user._id, isActive: { $ne: false } }).select(
      '_id name email department'
    );
    const teamMemberIds = teamMembers.map((member) => member._id);

    const goalSheets = await GoalSheet.find({
      employeeId: { $in: teamMemberIds },
      cycleYear: CURRENT_CYCLE_YEAR,
    })
      .populate({
        path: 'goals',
        populate: [
          { path: 'employeeId', select: 'name email department' },
          { path: 'managerId', select: 'name email department role' },
          { path: 'sharedFrom', select: 'title thrustArea weightage' },
        ],
      })
      .sort({ updatedAt: -1 });

    // Build result for members who have goal sheets
    const result = goalSheets.map((sheet) => {
      const employee = teamMembers.find(
        (m) => m._id.toString() === sheet.employeeId.toString()
      );
      return {
        _id: sheet._id,
        status: sheet.status,
        totalWeightage: sheet.totalWeightage,
        cycleYear: sheet.cycleYear,
        submittedAt: sheet.submittedAt,
        approvedAt: sheet.approvedAt,
        employee: employee
          ? {
              _id: employee._id,
              name: employee.name,
              email: employee.email,
              department: employee.department,
            }
          : null,
        goals: sheet.goals,
      };
    });

    // Include team members who have no goal sheet yet (so the SharedGoal modal can target them)
    const membersWithSheets = new Set(goalSheets.map((s) => s.employeeId.toString()));
    teamMembers.forEach((member) => {
      if (!membersWithSheets.has(member._id.toString())) {
        result.push({
          _id: null,
          status: 'no-sheet',
          totalWeightage: 0,
          cycleYear: CURRENT_CYCLE_YEAR,
          submittedAt: null,
          approvedAt: null,
          employee: {
            _id: member._id,
            name: member.name,
            email: member.email,
            department: member.department,
          },
          goals: [],
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Team goal sheets fetched successfully',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team goals',
      error: error.message,
    });
  }
};

const approveGoalSheet = async (req, res) => {
  try {
    const goalSheet = await GoalSheet.findById(req.params.sheetId);

    if (!goalSheet) {
      return res.status(404).json({
        success: false,
        message: 'Goal sheet not found',
      });
    }

    const employee = await User.findById(goalSheet.employeeId).select(
      'managerId name email'
    );

    if (!employee || employee.managerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this goal sheet',
      });
    }

    if (goalSheet.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted goal sheets can be approved',
      });
    }

    goalSheet.totalWeightage = await calculateTotalWeightage(goalSheet.goals);

    if (goalSheet.totalWeightage !== 100) {
      return res.status(400).json({
        success: false,
        message: 'Goal sheet total weightage must be 100 before approval',
      });
    }

    const oldGoalSheet = goalSheet.toObject();
    goalSheet.status = 'approved';
    goalSheet.approvedAt = new Date();
    await goalSheet.save();

    await Goal.updateMany(
      { _id: { $in: goalSheet.goals } },
      { $set: { status: 'approved', isLocked: true } }
    );

    const populatedGoalSheet = await populateGoalSheet(
      GoalSheet.findById(goalSheet._id)
    );

    await createAuditLog({
      goalSheetId: goalSheet._id,
      changedBy: req.user._id,
      changeType: 'sheet_approved',
      oldValue: oldGoalSheet,
      newValue: goalSheet.toObject(),
      description: `Goal sheet approved for cycle ${goalSheet.cycleYear}`,
    });

    const employeeUser = await User.findById(goalSheet.employeeId).select(
      'name email'
    );

    if (employeeUser?.email) {
      await sendGoalApprovalEmail({
        to: employeeUser.email,
        employeeName: employeeUser.name,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Goal sheet approved successfully',
      data: populatedGoalSheet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve goal sheet',
      error: error.message,
    });
  }
};

const returnGoalSheet = async (req, res) => {
  try {
    const goalSheet = await GoalSheet.findById(req.params.sheetId);
    const { reason } = req.body;

    if (!goalSheet) {
      return res.status(404).json({
        success: false,
        message: 'Goal sheet not found',
      });
    }

    const employee = await User.findById(goalSheet.employeeId).select(
      'managerId name'
    );

    if (!employee || employee.managerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to return this goal sheet',
      });
    }

    if (goalSheet.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submitted goal sheets can be returned',
      });
    }

    const oldGoalSheet = goalSheet.toObject();
    goalSheet.status = 'returned';
    goalSheet.approvedAt = null;
    await goalSheet.save();

    await Goal.updateMany(
      { _id: { $in: goalSheet.goals } },
      { $set: { status: 'returned', isLocked: false } }
    );

    const populatedGoalSheet = await populateGoalSheet(
      GoalSheet.findById(goalSheet._id)
    );

    await createAuditLog({
      goalSheetId: goalSheet._id,
      changedBy: req.user._id,
      changeType: 'sheet_returned',
      oldValue: oldGoalSheet,
      newValue: goalSheet.toObject(),
      description: `Goal sheet returned for cycle ${goalSheet.cycleYear}`,
    });

    await createAuditLog({
      goalSheetId: goalSheet._id,
      changedBy: req.user._id,
      changeType: 'goal_unlocked',
      oldValue: { isLocked: true, status: 'submitted' },
      newValue: { isLocked: false, status: 'returned' },
      description: 'Goals unlocked after sheet was returned',
    });

    if (employee?.email) {
      await sendGoalRejectionEmail({
        to: employee.email,
        employeeName: employee.name,
        managerName: req.user.name,
        reason,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Goal sheet returned for rework',
      data: populatedGoalSheet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to return goal sheet',
      error: error.message,
    });
  }
};

const updateGoalByManager = async (req, res) => {
  try {
    const { target, weightage, targetDate } = req.body;
    const goal = await Goal.findById(req.params.goalId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    const employee = await User.findById(goal.employeeId).select('managerId');

    if (!employee || employee.managerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this goal',
      });
    }

    const goalSheet = await GoalSheet.findOne({
      employeeId: goal.employeeId,
      cycleYear: CURRENT_CYCLE_YEAR,
      goals: goal._id,
    });

    if (!goalSheet) {
      return res.status(404).json({
        success: false,
        message: 'Goal sheet not found for this goal',
      });
    }

    if (goalSheet.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Manager can edit goals only while sheet is submitted',
      });
    }

    if (goalSheet.status === 'approved' || goal.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Approved or locked goals cannot be edited',
      });
    }

    if (target !== undefined) {
      goal.target = target;
    }

    if (targetDate !== undefined) {
      goal.targetDate = targetDate;
    }

    if (weightage !== undefined) {
      if (Number(weightage) < 10) {
        return res.status(400).json({
          success: false,
          message: 'Weightage must be at least 10',
        });
      }

      goal.weightage = weightage;
    }

    await goal.save();

    goalSheet.totalWeightage = await calculateTotalWeightage(goalSheet.goals);
    await goalSheet.save();

    return res.status(200).json({
      success: true,
      message: 'Goal updated successfully by manager',
      data: goal,
      totalWeightage: goalSheet.totalWeightage,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message,
    });
  }
};

module.exports = {
  createGoal,
  getMyGoals,
  updateGoal,
  deleteGoal,
  submitGoalSheet,
  getTeamGoals,
  approveGoalSheet,
  returnGoalSheet,
  updateGoalByManager,
};
