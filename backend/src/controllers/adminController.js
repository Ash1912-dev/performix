const User = require('../models/User');
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');
const CheckIn = require('../models/CheckIn');
const AuditLog = require('../models/AuditLog');
const { getCurrentCycleYear, getActiveQuarter, isQuarterWindowOpen } = require('../utils/cycleUtils');



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

const getAllUsers = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.department) {
      filter.department = new RegExp(req.query.department, 'i');
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('managerId', 'name email department')
      .sort({ createdAt: -1 });

    const currentYear = getCurrentCycleYear();
    const usersWithGoals = await Promise.all(users.map(async (user) => {
      const goalSheet = await GoalSheet.findOne({ employeeId: user._id, cycleYear: currentYear })
        .populate('goals');
      return {
        ...user.toObject(),
        goalSheet
      };
    }));

    return res.status(200).json({
      success: true,
      data: usersWithGoals,
      total: users.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, managerId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department,
      managerId,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        managerId: user.managerId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, department, managerId, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (department !== undefined) {
      user.department = department;
    }

    if (managerId !== undefined) {
      user.managerId = managerId;
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        managerId: user.managerId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message,
    });
  }
};

const unlockGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    const oldValue = goal.toObject();
    goal.isLocked = false;
    await goal.save();

    await createAuditLog({
      goalId: goal._id,
      changedBy: req.user._id,
      changeType: 'goal_unlocked',
      oldValue,
      newValue: goal.toObject(),
      description: `Goal unlocked by admin: ${goal.title}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Goal unlocked successfully',
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to unlock goal',
      error: error.message,
    });
  }
};

const getCycleStatus = async (req, res) => {
  try {
    const currentYear = getCurrentCycleYear();
    const currentQuarter = getActiveQuarter();
    const quarterWindowOpen = isQuarterWindowOpen();

    const [totalEmployees, totalSheets, submittedSheets, approvedSheets] = await Promise.all([
      User.countDocuments({ role: 'employee', isActive: true }),
      GoalSheet.countDocuments({ cycleYear: currentYear }),
      GoalSheet.countDocuments({ cycleYear: currentYear, status: 'submitted' }),
      GoalSheet.countDocuments({ cycleYear: currentYear, status: 'approved' }),
    ]);

    const pendingSheets = Math.max(totalEmployees - submittedSheets - approvedSheets, 0);

    return res.status(200).json({
      success: true,
      data: {
        currentQuarter,
        quarterWindowOpen,
        cycleYear: currentYear,
        totalEmployees,
        totalSheets,
        submittedSheets,
        approvedSheets,
        pendingSheets,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cycle status',
      error: error.message,
    });
  }
};

const getCompletionDashboard = async (req, res) => {
  try {
    const currentYear = getCurrentCycleYear();
    const currentQuarter = getActiveQuarter();

    const employees = await User.find({ role: 'employee', isActive: true })
      .populate('managerId', 'name department');

    const checkins = await CheckIn.find({ 
      quarter: currentQuarter, 
      cycleYear: currentYear 
    });
    
    const checkinEmployeeIds = checkins.map(c => c.employeeId.toString());

    const result = employees.map(emp => ({
      employeeId: emp._id,
      employeeName: emp.name,
      department: emp.department,
      managerName: emp.managerId?.name ?? 'No Manager',
      checkInStatus: checkinEmployeeIds.includes(emp._id.toString()) ? 'done' : 'pending'
    }));

    const grouped = {};
    result.forEach(r => {
      const key = r.managerName;
      if (!grouped[key]) grouped[key] = { managerName: key, total: 0, done: 0, pending: 0, employees: [] };
      grouped[key].total++;
      if (r.checkInStatus === 'done') {
        grouped[key].done++;
      } else {
        grouped[key].pending++;
      }
      grouped[key].employees.push(r);
    });

    return res.status(200).json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch completion dashboard',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  unlockGoal,
  getCycleStatus,
  getCompletionDashboard,
};
