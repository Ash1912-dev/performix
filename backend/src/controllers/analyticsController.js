const mongoose = require('mongoose');
const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');
const User = require('../models/User');
const EscalationLog = require('../models/EscalationLog');
const {
  getCurrentCycleYear,
  getCurrentQuarter,
  isQuarterWindowOpen,
} = require('../utils/cycleUtils');

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const buildQuarterMap = (rows, keyField = 'quarter', valueField = 'avgScore') => {
  const map = new Map(rows.map((row) => [row[keyField], row[valueField]]));

  return QUARTERS.map((quarter) => ({
    quarter,
    avgScore: map.has(quarter) ? map.get(quarter) : null,
  }));
};

const ensureManagerCanAccessEmployee = async (managerId, employeeId) => {
  const employee = await User.findOne({
    _id: employeeId,
    managerId,
    role: 'employee',
  }).select('_id');

  return Boolean(employee);
};

const getEmployeeTrends = async (req, res) => {
  try {
    const cycleYear = Number(req.query.cycleYear) || getCurrentCycleYear();
    const employeeId = req.query.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'employeeId is required',
      });
    }

    if (
      req.user.role === 'manager' &&
      !(await ensureManagerCanAccessEmployee(req.user._id, employeeId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this employee',
      });
    }

    const trends = await CheckIn.aggregate([
      {
        $match: {
          employeeId: toObjectId(employeeId),
          cycleYear,
        },
      },
      {
        $group: {
          _id: '$quarter',
          avgScore: { $avg: '$progressScore' },
        },
      },
      {
        $project: {
          _id: 0,
          quarter: '$_id',
          avgScore: { $round: ['$avgScore', 2] },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        employeeId,
        cycleYear,
        trends: buildQuarterMap(trends),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee trends',
      error: error.message,
    });
  }
};

const getTeamTrends = async (req, res) => {
  try {
    const cycleYear = Number(req.query.cycleYear) || getCurrentCycleYear();
    const managerId =
      req.user.role === 'manager' ? req.user._id.toString() : req.query.managerId;

    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: 'managerId is required',
      });
    }

    const teamMembers = await User.find({
      managerId: toObjectId(managerId),
      role: 'employee',
      isActive: true,
    }).select('_id name');

    const employeeIds = teamMembers.map((member) => member._id);

    const [teamQoQ, employeeBreakdown] = await Promise.all([
      CheckIn.aggregate([
        {
          $match: {
            employeeId: { $in: employeeIds },
            cycleYear,
          },
        },
        {
          $group: {
            _id: '$quarter',
            avgScore: { $avg: '$progressScore' },
          },
        },
        {
          $project: {
            _id: 0,
            quarter: '$_id',
            avgScore: { $round: ['$avgScore', 2] },
          },
        },
      ]),
      CheckIn.aggregate([
        {
          $match: {
            employeeId: { $in: employeeIds },
            cycleYear,
          },
        },
        {
          $group: {
            _id: {
              employeeId: '$employeeId',
              quarter: '$quarter',
            },
            avgScore: { $avg: '$progressScore' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id.employeeId',
            foreignField: '_id',
            as: 'employee',
          },
        },
        {
          $unwind: '$employee',
        },
        {
          $group: {
            _id: '$_id.employeeId',
            employeeName: { $first: '$employee.name' },
            quarterScores: {
              $push: {
                quarter: '$_id.quarter',
                avgScore: { $round: ['$avgScore', 2] },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            employeeId: '$_id',
            employeeName: 1,
            quarterScores: 1,
          },
        },
      ]),
    ]);

    const employeeMap = new Map(
      employeeBreakdown.map((row) => [
        row.employeeId.toString(),
        {
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          Q1: null,
          Q2: null,
          Q3: null,
          Q4: null,
        },
      ])
    );

    teamMembers.forEach((member) => {
      if (!employeeMap.has(member._id.toString())) {
        employeeMap.set(member._id.toString(), {
          employeeId: member._id,
          employeeName: member.name,
          Q1: null,
          Q2: null,
          Q3: null,
          Q4: null,
        });
      }
    });

    employeeBreakdown.forEach((row) => {
      const item = employeeMap.get(row.employeeId.toString());
      row.quarterScores.forEach((score) => {
        item[score.quarter] = score.avgScore;
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        managerId,
        cycleYear,
        teamTrend: buildQuarterMap(teamQoQ),
        employees: Array.from(employeeMap.values()),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team trends',
      error: error.message,
    });
  }
};

const getDepartmentTrends = async (req, res) => {
  try {
    const cycleYear = Number(req.query.cycleYear) || getCurrentCycleYear();
    const matchDepartment = req.query.department
      ? { 'employee.department': req.query.department }
      : {};

    const rows = await CheckIn.aggregate([
      {
        $match: {
          cycleYear,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee',
      },
      {
        $match: {
          'employee.role': 'employee',
          ...matchDepartment,
        },
      },
      {
        $group: {
          _id: {
            department: '$employee.department',
            quarter: '$quarter',
          },
          avgScore: { $avg: '$progressScore' },
        },
      },
      {
        $group: {
          _id: '$_id.department',
          quarterScores: {
            $push: {
              quarter: '$_id.quarter',
              avgScore: { $round: ['$avgScore', 2] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: '$_id',
          quarterScores: 1,
        },
      },
    ]);

    const trends = rows.map((row) => {
      const item = {
        department: row.department,
        Q1: null,
        Q2: null,
        Q3: null,
        Q4: null,
      };

      row.quarterScores.forEach((score) => {
        item[score.quarter] = score.avgScore;
      });

      return item;
    });

    return res.status(200).json({
      success: true,
      data: {
        cycleYear,
        trends,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch department trends',
      error: error.message,
    });
  }
};

const getGoalDistribution = async (req, res) => {
  try {
    const cycleYear = Number(req.query.cycleYear) || getCurrentCycleYear();
    const employeeFilter = {
      role: 'employee',
      isActive: true,
    };

    if (req.query.department) {
      employeeFilter.department = req.query.department;
    }

    if (req.user.role === 'manager') {
      employeeFilter.managerId = req.user._id;
    }

    const employees = await User.find(employeeFilter).select('_id');
    const employeeIds = employees.map((employee) => employee._id);

    const basePipeline = [
      {
        $match: {
          employeeId: { $in: employeeIds },
        },
      },
      {
        $lookup: {
          from: 'goalsheets',
          let: { employeeId: '$employeeId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employeeId', '$$employeeId'] },
                    { $eq: ['$cycleYear', cycleYear] },
                  ],
                },
              },
            },
          ],
          as: 'sheet',
        },
      },
      {
        $match: {
          sheet: { $ne: [] },
        },
      },
    ];

    const [byThrustArea, byUomType, byStatus] = await Promise.all([
      Goal.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: '$thrustArea',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            thrustArea: '$_id',
            count: 1,
          },
        },
      ]),
      Goal.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: '$uomType',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            uomType: '$_id',
            count: 1,
          },
        },
      ]),
      Goal.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            count: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        cycleYear,
        byThrustArea,
        byUomType,
        byStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch goal distribution',
      error: error.message,
    });
  }
};

const getCompletionHeatmap = async (req, res) => {
  try {
    const cycleYear = Number(req.query.cycleYear) || getCurrentCycleYear();
    const employees = await User.find({ role: 'employee', isActive: true });

    const heatmap = await Promise.all(
      employees.map(async (emp) => {
        const checkins = await CheckIn.find({
          employeeId: emp._id,
          cycleYear,
        });

        return {
          employeeId: emp._id,
          employeeName: emp.name,
          department: emp.department,
          Q1: checkins.some((c) => c.quarter === 'Q1'),
          Q2: checkins.some((c) => c.quarter === 'Q2'),
          Q3: checkins.some((c) => c.quarter === 'Q3'),
          Q4: checkins.some((c) => c.quarter === 'Q4'),
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch completion heatmap',
      error: error.message,
    });
  }
};

const getManagerEffectivenessDashboard = async (req, res) => {
  try {
    const cycleYear = Number(req.query.cycleYear) || getCurrentCycleYear();

    const managers = await User.aggregate([
      {
        $match: {
          role: 'manager',
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'managerId',
          as: 'teamMembers',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          department: 1,
          teamMemberIds: {
            $map: {
              input: {
                $filter: {
                  input: '$teamMembers',
                  as: 'member',
                  cond: {
                    $and: [
                      { $eq: ['$$member.role', 'employee'] },
                      { $eq: ['$$member.isActive', true] },
                    ],
                  },
                },
              },
              as: 'member',
              in: '$$member._id',
            },
          },
        },
      },
    ]);

    const results = [];

    for (const manager of managers) {
      const teamSize = manager.teamMemberIds.length;
      const employeeIds = manager.teamMemberIds;
      const approvedGoals = await Goal.aggregate([
        {
          $match: {
            employeeId: { $in: employeeIds },
            status: 'approved',
          },
        },
        {
          $lookup: {
            from: 'goalsheets',
            let: { employeeId: '$employeeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employeeId', '$$employeeId'] },
                      { $eq: ['$cycleYear', cycleYear] },
                    ],
                  },
                },
              },
            ],
            as: 'sheet',
          },
        },
        {
          $match: {
            sheet: { $ne: [] },
          },
        },
        {
          $group: {
            _id: '$employeeId',
            approvedGoalCount: { $sum: 1 },
          },
        },
      ]);
      const approvalMap = new Map(
        approvedGoals.map((row) => [row._id.toString(), row.approvedGoalCount])
      );

      const checkInStats = await CheckIn.aggregate([
        {
          $match: {
            employeeId: { $in: employeeIds },
            cycleYear,
          },
        },
        {
          $group: {
            _id: {
              quarter: '$quarter',
              employeeId: '$employeeId',
            },
            goalCount: { $sum: 1 },
            avgScore: { $avg: '$progressScore' },
          },
        },
      ]);

      const quarterCompletion = {
        Q1: 0,
        Q2: 0,
        Q3: 0,
        Q4: 0,
      };
      const quarterProgress = {
        Q1: [],
        Q2: [],
        Q3: [],
        Q4: [],
      };

      checkInStats.forEach((row) => {
        const expected = approvalMap.get(row._id.employeeId.toString()) || 0;

        if (expected > 0 && row.goalCount >= expected) {
          quarterCompletion[row._id.quarter] += 1;
        }

        quarterProgress[row._id.quarter].push(row.avgScore);
      });

      const sheets = await GoalSheet.aggregate([
        {
          $match: {
            employeeId: { $in: employeeIds },
            cycleYear,
            submittedAt: { $ne: null },
            approvedAt: { $ne: null },
          },
        },
        {
          $project: {
            turnaroundDays: {
              $dateDiff: {
                startDate: '$submittedAt',
                endDate: '$approvedAt',
                unit: 'day',
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTurnaround: { $avg: '$turnaroundDays' },
          },
        },
      ]);

      const completionRatePerQuarter = {};
      const avgTeamProgressScorePerQuarter = {};
      const overallRates = [];

      QUARTERS.forEach((quarter) => {
        const rate = teamSize
          ? Number(((quarterCompletion[quarter] / teamSize) * 100).toFixed(2))
          : 0;
        completionRatePerQuarter[quarter] = rate;
        avgTeamProgressScorePerQuarter[quarter] = quarterProgress[quarter].length
          ? Number(
              (
                quarterProgress[quarter].reduce((sum, score) => sum + score, 0) /
                quarterProgress[quarter].length
              ).toFixed(2)
            )
          : null;
        overallRates.push(rate);
      });

      results.push({
        name: manager.name,
        department: manager.department,
        teamSize,
        checkInCompletionRate: completionRatePerQuarter,
        avgTeamProgressScore: avgTeamProgressScorePerQuarter,
        goalApprovalTurnaround: sheets[0]
          ? Number(sheets[0].avgTurnaround.toFixed(2))
          : null,
        overallCheckInCompletionRate: Number(
          (
            overallRates.reduce((sum, rate) => sum + rate, 0) / overallRates.length
          ).toFixed(2)
        ),
      });
    }

    results.sort(
      (a, b) => b.overallCheckInCompletionRate - a.overallCheckInCompletionRate
    );

    return res.status(200).json({
      success: true,
      data: {
        cycleYear,
        managers: results,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch manager effectiveness dashboard',
      error: error.message,
    });
  }
};

const getOrgOverview = async (req, res) => {
  try {
    const cycleYear = Number(req.query.cycleYear) || getCurrentCycleYear();
    
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    const totalGoals = await Goal.countDocuments();
    const approvedGoals = await Goal.countDocuments({ status: 'approved' });
    const sheetsSubmitted = await GoalSheet.countDocuments({ cycleYear, status: { $in: ['submitted', 'approved'] } });
    const sheetsApproved = await GoalSheet.countDocuments({ cycleYear, status: 'approved' });
    const sheetsPending = totalEmployees - sheetsSubmitted;
    const escalationsFired = await EscalationLog.countDocuments({ 
      sentAt: { $gte: new Date(cycleYear, 0, 1) } 
    });

    const topPerformers = await CheckIn.aggregate([
      { $match: { cycleYear } },
      { $group: { _id: '$employeeId', avgScore: { $avg: '$progressScore' } } },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $project: { employeeName: '$employee.name', department: '$employee.department', avgScore: 1 } }
    ]);

    const bottomPerformers = await CheckIn.aggregate([
      { $match: { cycleYear } },
      { $group: { _id: '$employeeId', avgScore: { $avg: '$progressScore' } } },
      { $sort: { avgScore: 1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $project: { employeeName: '$employee.name', department: '$employee.department', avgScore: 1 } }
    ]);

    const overall = await CheckIn.aggregate([
      { $match: { cycleYear } },
      { $group: { _id: null, avgScore: { $avg: '$progressScore' } } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        cycleYear,
        totalEmployees,
        totalGoals,
        approvedGoals,
        sheetsSubmitted,
        sheetsApproved,
        sheetsPending,
        escalationsFired,
        topPerformers,
        bottomPerformers,
        overallAvgProgressScore: overall[0] ? Number(overall[0].avgScore.toFixed(2)) : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch org overview',
      error: error.message,
    });
  }
};

module.exports = {
  getEmployeeTrends,
  getTeamTrends,
  getDepartmentTrends,
  getGoalDistribution,
  getCompletionHeatmap,
  getManagerEffectivenessDashboard,
  getOrgOverview,
};
