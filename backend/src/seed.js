const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const GoalSheet = require('./models/GoalSheet');
const Goal = require('./models/Goal');
const CheckIn = require('./models/CheckIn');
const AuditLog = require('./models/AuditLog');
const EscalationLog = require('./models/EscalationLog');
const EscalationRule = require('./models/EscalationRule');

dotenv.config();

const DEFAULT_PASSWORD = 'Password@123';
const CYCLE_YEAR = new Date().getFullYear();

const calculateProgressScore = ({ uomType, target, actual }) => {
  if (uomType === 'min') {
    if (!target) return 0;
    return Math.min((actual / target) * 100, 100);
  }
  if (uomType === 'max') {
    if (!actual) return 0;
    return Math.min((target / actual) * 100, 100);
  }
  if (uomType === 'zero') {
    return actual === 0 ? 100 : 0;
  }
  return 0;
};

const buildGoalTemplates = (employeeName) => [
  {
    title: `${employeeName} Revenue Growth`,
    description: 'Drive strong business outcomes against annual revenue targets.',
    thrustArea: 'Revenue',
    uomType: 'min',
    target: 500000,
    weightage: 40,
  },
  {
    title: `${employeeName} Quality Improvement`,
    description: 'Improve service quality and reduce issue turnaround times.',
    thrustArea: 'Quality',
    uomType: 'max',
    target: 5,
    weightage: 40,
  },
  {
    title: `${employeeName} Operational Safety`,
    description: 'Maintain zero critical incidents through the performance cycle.',
    thrustArea: 'Efficiency',
    uomType: 'zero',
    target: 0,
    weightage: 20,
  },
];

const buildQuarterAchievements = (goal) => {
  if (goal.uomType === 'min') return { Q1: 450000, Q2: 520000 };
  if (goal.uomType === 'max') return { Q1: 6, Q2: 5 };
  return { Q1: 1, Q2: 0 };
};

/* ────── Clear everything ────── */
const clearCollections = async () => {
  await Promise.all([
    AuditLog.deleteMany({}),
    CheckIn.deleteMany({}),
    Goal.deleteMany({}),
    GoalSheet.deleteMany({}),
    EscalationLog.deleteMany({}),
    EscalationRule.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('✓ Cleared all collections');
};

/* ────── Escalation rules ────── */
const createEscalationRules = async () => {
  await EscalationRule.insertMany([
    {
      name: 'Goal Not Submitted',
      triggerType: 'goal_not_submitted',
      daysThreshold: 7,
      escalationChain: ['employee', 'manager'],
      isActive: true,
    },
    {
      name: 'Goal Not Approved',
      triggerType: 'goal_not_approved',
      daysThreshold: 3,
      escalationChain: ['manager', 'admin'],
      isActive: true,
    },
    {
      name: 'Check-in Not Completed',
      triggerType: 'checkin_not_completed',
      daysThreshold: 5,
      escalationChain: ['employee', 'manager'],
      isActive: true,
    },
  ]);
  console.log('✓ Created escalation rules');
};

/* ────── Users ────── */
const createUsers = async () => {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const [admin] = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@performix.com',
      password: hashedPassword,
      role: 'admin',
      department: 'HR',
    },
  ]);

  const [manager1, manager2] = await User.insertMany([
    {
      name: 'Rahul Sharma',
      email: 'rahul@performix.com',
      password: hashedPassword,
      role: 'manager',
      department: 'Engineering',
    },
    {
      name: 'Priya Mehta',
      email: 'priya@performix.com',
      password: hashedPassword,
      role: 'manager',
      department: 'Sales',
    },
  ]);

  const employees = await User.insertMany([
    {
      name: 'Amit Verma',
      email: 'amit@performix.com',
      password: hashedPassword,
      role: 'employee',
      department: 'Engineering',
      managerId: manager1._id,
    },
    {
      name: 'Sneha Patil',
      email: 'sneha@performix.com',
      password: hashedPassword,
      role: 'employee',
      department: 'Engineering',
      managerId: manager1._id,
    },
    {
      name: 'Rohan Das',
      email: 'rohan@performix.com',
      password: hashedPassword,
      role: 'employee',
      department: 'Sales',
      managerId: manager2._id,
    },
  ]);

  console.log('✓ Created users');
  return { admin, manager1, manager2, employees };
};

/* ────── Approved employee (Amit): goals + Q1/Q2 check-ins ────── */
const createApprovedEmployeeData = async (employee, manager) => {
  const goalTemplates = buildGoalTemplates(employee.name);

  const goals = await Goal.insertMany(
    goalTemplates.map((t) => ({
      employeeId: employee._id,
      managerId: manager._id,
      title: t.title,
      description: t.description,
      thrustArea: t.thrustArea,
      uomType: t.uomType,
      target: t.target,
      weightage: t.weightage,
      status: 'approved',
      isLocked: true,
    }))
  );

  const goalSheet = await GoalSheet.create({
    employeeId: employee._id,
    cycleYear: CYCLE_YEAR,
    goals: goals.map((g) => g._id),
    totalWeightage: 100,
    status: 'approved',
    submittedAt: new Date(`${CYCLE_YEAR}-05-10T09:00:00.000Z`),
    approvedAt: new Date(`${CYCLE_YEAR}-05-15T12:00:00.000Z`),
  });

  const checkIns = [];
  const auditLogs = [];

  goals.forEach((goal) => {
    const achievements = buildQuarterAchievements(goal);

    checkIns.push(
      {
        goalId: goal._id,
        employeeId: employee._id,
        quarter: 'Q1',
        cycleYear: CYCLE_YEAR,
        plannedTarget: goal.target,
        actualAchievement: achievements.Q1,
        status: 'on_track',
        progressScore: calculateProgressScore({ uomType: goal.uomType, target: goal.target, actual: achievements.Q1 }),
      },
      {
        goalId: goal._id,
        employeeId: employee._id,
        quarter: 'Q2',
        cycleYear: CYCLE_YEAR,
        plannedTarget: goal.target,
        actualAchievement: achievements.Q2,
        status: 'completed',
        progressScore: calculateProgressScore({ uomType: goal.uomType, target: goal.target, actual: achievements.Q2 }),
        managerComment: 'Good progress, keep it up.',
        commentedAt: new Date(`${CYCLE_YEAR}-10-20T10:30:00.000Z`),
        commentedBy: manager._id,
      }
    );

    auditLogs.push({
      goalId: goal._id,
      goalSheetId: goalSheet._id,
      changedBy: employee._id,
      changeType: 'goal_created',
      oldValue: null,
      newValue: goal.toObject(),
      description: `Seeded approved goal: ${goal.title}`,
    });
  });

  await CheckIn.insertMany(checkIns);

  const seededCheckIns = await CheckIn.find({ employeeId: employee._id, cycleYear: CYCLE_YEAR }).lean();
  seededCheckIns.forEach((ci) => {
    auditLogs.push({
      goalId: ci.goalId,
      goalSheetId: goalSheet._id,
      changedBy: employee._id,
      changeType: 'checkin_added',
      oldValue: null,
      newValue: ci,
      description: `Seeded ${ci.quarter} check-in`,
    });
  });

  auditLogs.push({
    goalSheetId: goalSheet._id,
    changedBy: manager._id,
    changeType: 'sheet_approved',
    oldValue: null,
    newValue: goalSheet.toObject(),
    description: `Seeded approved goal sheet for ${employee.name}`,
  });

  await AuditLog.insertMany(auditLogs);
};

/* ────── Submitted employee (Sneha): goals, no check-ins ────── */
const createSubmittedEmployeeData = async (employee, manager) => {
  const goalTemplates = buildGoalTemplates(employee.name);

  const goals = await Goal.insertMany(
    goalTemplates.map((t) => ({
      employeeId: employee._id,
      managerId: manager._id,
      title: t.title,
      description: t.description,
      thrustArea: t.thrustArea,
      uomType: t.uomType,
      target: t.target,
      weightage: t.weightage,
      status: 'submitted',
      isLocked: true,
    }))
  );

  await GoalSheet.create({
    employeeId: employee._id,
    cycleYear: CYCLE_YEAR,
    goals: goals.map((g) => g._id),
    totalWeightage: 100,
    status: 'submitted',
    submittedAt: new Date(`${CYCLE_YEAR}-05-12T11:00:00.000Z`),
  });
};

/* ────── Draft employee (Rohan): partial goals, no submit ────── */
const createDraftEmployeeData = async (employee, manager) => {
  const partialGoals = buildGoalTemplates(employee.name).slice(0, 2);

  const goals = await Goal.insertMany(
    partialGoals.map((t) => ({
      employeeId: employee._id,
      managerId: manager._id,
      title: t.title,
      description: t.description,
      thrustArea: t.thrustArea,
      uomType: t.uomType,
      target: t.target,
      weightage: t.weightage,
      status: 'draft',
      isLocked: false,
    }))
  );

  await GoalSheet.create({
    employeeId: employee._id,
    cycleYear: CYCLE_YEAR,
    goals: goals.map((g) => g._id),
    totalWeightage: partialGoals.reduce((sum, g) => sum + g.weightage, 0),
    status: 'draft',
  });
};

/* ────── Main seed ────── */
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding\n');

    await clearCollections();
    await createEscalationRules();

    const { admin, manager1, manager2, employees } = await createUsers();

    // Amit — approved with check-ins
    await createApprovedEmployeeData(employees[0], manager1);
    // Sneha — submitted, awaiting approval
    await createSubmittedEmployeeData(employees[1], manager1);
    // Rohan — still in draft
    await createDraftEmployeeData(employees[2], manager2);

    console.log('\n================================');
    console.log('  PERFORMIX SEED COMPLETE');
    console.log('================================');
    console.log(`  Admin:    admin@performix.com / ${DEFAULT_PASSWORD}`);
    console.log(`  Manager:  rahul@performix.com / ${DEFAULT_PASSWORD}`);
    console.log(`  Manager:  priya@performix.com / ${DEFAULT_PASSWORD}`);
    console.log(`  Employee: amit@performix.com  / ${DEFAULT_PASSWORD} (Approved)`);
    console.log(`  Employee: sneha@performix.com / ${DEFAULT_PASSWORD} (Submitted)`);
    console.log(`  Employee: rohan@performix.com / ${DEFAULT_PASSWORD} (Draft)`);
    console.log('================================\n');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
