const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const User = require('../models/User');
const GoalSheet = require('../models/GoalSheet');
const AuditLog = require('../models/AuditLog');
const { calculateProgressScore } = require('../utils/scoreCalculator');
const { sendCheckInReminderEmail } = require('../utils/emailService');
const {
  getCurrentCycleYear,
  isQuarterWindowOpen,
  getQuarterWindowCloseDate,
} = require('../utils/cycleUtils');

const CURRENT_CYCLE_YEAR = getCurrentCycleYear();

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

const submitCheckIn = async (req, res) => {
  try {
    const {
      goalId,
      quarter,
      plannedTarget,
      actualAchievement,
      achievementDate,
      status,
      cycleYear,
    } = req.body;

    if (!goalId || !quarter || !status) {
      return res.status(400).json({
        success: false,
        message: 'Goal, quarter, and status are required',
      });
    }

    if (!isQuarterWindowOpen(quarter)) {
      return res.status(400).json({
        success: false,
        message: 'Check-in window is not open for this quarter',
      });
    }

    const quarterCloseDate = getQuarterWindowCloseDate(
      quarter,
      Number(cycleYear) || CURRENT_CYCLE_YEAR
    );

    if (quarterCloseDate) {
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const timeRemaining = quarterCloseDate.getTime() - Date.now();

      if (timeRemaining >= 0 && timeRemaining <= threeDaysInMs) {
        await sendCheckInReminderEmail({
          to: req.user.email,
          employeeName: req.user.name,
          quarter,
        });
      }
    }

    const goal = await Goal.findOne({
      _id: goalId,
      employeeId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    if (!goal.isLocked || goal.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Check-ins are allowed only for approved and locked goals',
      });
    }

    const effectiveCycleYear = cycleYear || CURRENT_CYCLE_YEAR;

    const existingCheckIn = await CheckIn.findOne({
      goalId,
      quarter,
      cycleYear: effectiveCycleYear,
    });

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-in already exists for this goal and quarter',
      });
    }

    const progressScore = calculateProgressScore({
      uomType: goal.uomType,
      target: plannedTarget ?? goal.target,
      actual: actualAchievement,
      targetDate: goal.targetDate,
      achievementDate,
    });

    const checkIn = await CheckIn.create({
      goalId,
      employeeId: req.user._id,
      quarter,
      cycleYear: effectiveCycleYear,
      plannedTarget: plannedTarget ?? goal.target,
      actualAchievement,
      achievementDate,
      status,
      progressScore,
    });

    await createAuditLog({
      goalId: goal._id,
      changedBy: req.user._id,
      changeType: 'checkin_added',
      oldValue: null,
      newValue: checkIn.toObject(),
      description: `Check-in submitted for ${quarter}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Check-in submitted successfully',
      checkIn,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit check-in',
      error: error.message,
    });
  }
};

const getMyCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ employeeId: req.user._id })
      .populate('goalId', 'title thrustArea uomType target targetDate weightage')
      .populate('commentedBy', 'name role')
      .sort({ cycleYear: -1, quarter: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Check-ins fetched successfully',
      data: checkIns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch check-ins',
      error: error.message,
    });
  }
};

const getTeamCheckIns = async (req, res) => {
  try {
    const teamMembers = await User.find({ managerId: req.user._id, isActive: { $ne: false } }).select(
      '_id name email department'
    );
    const teamMemberIds = teamMembers.map((member) => member._id);

    const result = await Promise.all(
      teamMemberIds.map(async (empId) => {
        const sheet = await GoalSheet.findOne({
          employeeId: empId,
          cycleYear: CURRENT_CYCLE_YEAR,
        }).populate('goals');

        const checkins = await CheckIn.find({ employeeId: empId })
          .populate('goalId', 'title thrustArea uomType target targetDate weightage')
          .populate('commentedBy', 'name role')
          .sort({ cycleYear: -1, quarter: 1 });

        const employee = teamMembers.find(
          (m) => m._id.toString() === empId.toString()
        );

        const goalsWithCheckins = (sheet?.goals || []).map((goal) => ({
          goal: {
            _id: goal._id,
            title: goal.title,
            uomType: goal.uomType,
            target: goal.target,
            targetDate: goal.targetDate,
            weightage: goal.weightage,
            thrustArea: goal.thrustArea,
          },
          checkins: checkins
            .filter(
              (c) =>
                (c.goalId?._id || c.goalId)?.toString() === goal._id.toString()
            )
            .map((c) => ({
              _id: c._id,
              quarter: c.quarter,
              actualAchievement: c.actualAchievement,
              progressScore: c.progressScore,
              status: c.status,
              managerComment: c.managerComment || '',
              commentedAt: c.commentedAt,
              commentedBy: c.commentedBy,
            })),
        }));

        return {
          employee: {
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            department: employee.department,
          },
          goals: goalsWithCheckins,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Team check-ins fetched successfully',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team check-ins',
      error: error.message,
    });
  }
};

const addManagerComment = async (req, res) => {
  try {
    const { managerComment } = req.body;

    if (!managerComment) {
      return res.status(400).json({
        success: false,
        message: 'Manager comment is required',
      });
    }

    const checkIn = await CheckIn.findById(req.params.id).populate(
      'employeeId',
      'managerId name'
    );

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: 'Check-in not found',
      });
    }

    if (
      !checkIn.employeeId.managerId ||
      checkIn.employeeId.managerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to comment on this check-in',
      });
    }

    const oldValue = checkIn.toObject();

    checkIn.managerComment = managerComment;
    checkIn.commentedAt = new Date();
    checkIn.commentedBy = req.user._id;
    await checkIn.save();

    await createAuditLog({
      goalId: checkIn.goalId,
      changedBy: req.user._id,
      changeType: 'manager_comment_added',
      oldValue,
      newValue: checkIn.toObject(),
      description: `Manager comment updated for ${checkIn.quarter} check-in`,
    });

    return res.status(200).json({
      success: true,
      message: 'Manager comment saved successfully',
      data: checkIn,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save manager comment',
      error: error.message,
    });
  }
};

const getCheckInSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own summary',
      });
    }

    if (req.user.role === 'manager') {
      const employee = await User.findById(employeeId).select('managerId');

      if (!employee || employee.managerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this summary',
        });
      }
    }

    const goals = await Goal.find({ employeeId })
      .select(
        'title thrustArea uomType target targetDate weightage status isLocked managerId'
      )
      .sort({ createdAt: -1 });

    const goalIds = goals.map((goal) => goal._id);
    const checkIns = await CheckIn.find({ goalId: { $in: goalIds } })
      .populate('commentedBy', 'name role')
      .sort({ cycleYear: -1, updatedAt: -1 });

    const latestCheckInMap = new Map();

    checkIns.forEach((checkIn) => {
      const key = `${checkIn.goalId.toString()}-${checkIn.quarter}-${checkIn.cycleYear}`;

      if (!latestCheckInMap.has(key)) {
        latestCheckInMap.set(key, checkIn);
      }
    });

    const summary = goals.map((goal) => {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => {
        const key = `${goal._id.toString()}-${quarter}-${CURRENT_CYCLE_YEAR}`;
        const latestCheckIn = latestCheckInMap.get(key);

        return {
          quarter,
          plannedTarget: latestCheckIn?.plannedTarget ?? null,
          actualAchievement: latestCheckIn?.actualAchievement ?? null,
          progressScore: latestCheckIn?.progressScore ?? null,
          status: latestCheckIn?.status ?? null,
          managerComment: latestCheckIn?.managerComment ?? '',
          commentedAt: latestCheckIn?.commentedAt ?? null,
          commentedBy: latestCheckIn?.commentedBy ?? null,
        };
      });

      return {
        goal,
        quarters,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Check-in summary fetched successfully',
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch check-in summary',
      error: error.message,
    });
  }
};

module.exports = {
  submitCheckIn,
  getMyCheckIns,
  getTeamCheckIns,
  addManagerComment,
  getCheckInSummary,
};
