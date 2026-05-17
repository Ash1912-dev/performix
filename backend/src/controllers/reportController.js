const ExcelJS = require('exceljs');
const User = require('../models/User');
const GoalSheet = require('../models/GoalSheet');
const CheckIn = require('../models/CheckIn');

const getActiveQuarter = () => {
  const month = new Date().getMonth() + 1;

  if (month === 7) {
    return 'Q1';
  }

  if (month === 10) {
    return 'Q2';
  }

  if (month === 1) {
    return 'Q3';
  }

  if (month === 3 || month === 4) {
    return 'Q4';
  }

  return 'goal-setting';
};

const buildAchievementRows = async (req) => {
  const cycleYear = Number(req.query.cycleYear) || new Date().getFullYear();
  const quarter = req.query.quarter && req.query.quarter !== 'goal-setting' ? req.query.quarter : null;
  const { department, employeeId } = req.query;

  let empFilter = { role: 'employee', isActive: true };
  if (department) empFilter.department = new RegExp(department, 'i');
  if (employeeId) empFilter._id = employeeId;
  if (req.user && req.user.role === 'manager') empFilter.managerId = req.user._id;

  const employees = await User.find(empFilter);

  const result = await Promise.all(
    employees.map(async (emp) => {
      const sheet = await GoalSheet.findOne({
        employeeId: emp._id,
        cycleYear,
      }).populate('goals');
      
      if (!sheet) return [];

      const rows = await Promise.all(
        sheet.goals.map(async (goal) => {
          const checkinFilter = { goalId: goal._id, employeeId: emp._id };
          if (quarter) checkinFilter.quarter = quarter;
          const checkins = await CheckIn.find(checkinFilter);

          return checkins.map((ci) => ({
            employeeName: emp.name,
            department: emp.department,
            goalTitle: goal.title,
            thrustArea: goal.thrustArea,
            uomType: goal.uomType,
            plannedTarget: goal.target,
            actualAchievement: ci.actualAchievement,
            progressScore: ci.progressScore,
            status: ci.status,
            quarter: ci.quarter,
            cycleYear: ci.cycleYear,
          }));
        })
      );
      return rows.flat();
    })
  );

  return result.flat();
};

const getAchievementReport = async (req, res) => {
  try {
    const data = await buildAchievementRows(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch achievement report',
      error: error.message,
    });
  }
};

const exportAchievementReport = async (req, res) => {
  try {
    const data = await buildAchievementRows(req);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Achievement Report');

    sheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 20 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Goal Title', key: 'goalTitle', width: 30 },
      { header: 'Thrust Area', key: 'thrustArea', width: 15 },
      { header: 'UoM Type', key: 'uomType', width: 12 },
      { header: 'Planned Target', key: 'plannedTarget', width: 15 },
      { header: 'Actual Achievement', key: 'actualAchievement', width: 18 },
      { header: 'Progress Score %', key: 'progressScore', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Quarter', key: 'quarter', width: 10 },
      { header: 'Cycle Year', key: 'cycleYear', width: 12 },
    ];

    data.forEach((row) => sheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=achievement-report.xlsx'
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to export achievement report',
      error: error.message,
    });
  }
};

const exportAchievementCSV = async (req, res) => {
  try {
    const data = await buildAchievementRows(req);
    const headers = [
      'Employee Name', 'Department', 'Goal Title', 'Thrust Area', 'UoM Type',
      'Planned Target', 'Actual Achievement', 'Progress Score %', 'Status',
      'Quarter', 'Cycle Year'
    ];
    
    const rows = data.map(r => [
      r.employeeName, r.department, r.goalTitle, r.thrustArea,
      r.uomType, r.plannedTarget, r.actualAchievement,
      r.progressScore, r.status, r.quarter, r.cycleYear
    ]);
    
    const csv = [headers, ...rows].map(row => 
      row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=achievement-report.csv');
    res.send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to export CSV report',
      error: error.message,
    });
  }
};

const getManagerEffectiveness = async (req, res) => {
  try {
    const cycleYear = new Date().getFullYear();
    const activeQuarter = getActiveQuarter();
    const managers = await User.find({ role: 'manager', isActive: true }).select(
      '_id name'
    );
    const managerIds = managers.map((manager) => manager._id);
    const teamMembers = await User.find({
      role: 'employee',
      isActive: true,
      managerId: { $in: managerIds },
    }).select('_id managerId');
    const teamMemberIds = teamMembers.map((member) => member._id);
    const checkIns = activeQuarter === 'goal-setting'
      ? []
      : await CheckIn.find({
          employeeId: { $in: teamMemberIds },
          cycleYear,
          quarter: activeQuarter,
        }).select('employeeId');

    const completedEmployeeIds = new Set(
      checkIns.map((checkIn) => checkIn.employeeId.toString())
    );
    const teamMap = new Map();

    teamMembers.forEach((member) => {
      const key = member.managerId?.toString();

      if (!teamMap.has(key)) {
        teamMap.set(key, []);
      }

      teamMap.get(key).push(member._id.toString());
    });

    const rows = managers
      .map((manager) => {
        const memberIds = teamMap.get(manager._id.toString()) || [];
        const completed = memberIds.filter((id) => completedEmployeeIds.has(id))
          .length;
        const pending = Math.max(memberIds.length - completed, 0);
        const completionRate = memberIds.length
          ? Number(((completed / memberIds.length) * 100).toFixed(2))
          : 0;

        return {
          managerId: manager._id,
          name: manager.name,
          totalTeamMembers: memberIds.length,
          checkInsCompleted: completed,
          checkInsPending: pending,
          completionRate,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);

    return res.status(200).json({
      success: true,
      message: 'Manager effectiveness fetched successfully',
      activeQuarter,
      cycleYear,
      managers: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch manager effectiveness',
      error: error.message,
    });
  }
};

module.exports = {
  getAchievementReport,
  exportAchievementReport,
  exportAchievementCSV,
  getManagerEffectiveness,
};
