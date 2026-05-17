const CycleConfig = require('../models/CycleConfig');

const getCurrentCycleYear = () => new Date().getFullYear();

const getCurrentCycle = async () => {
  const currentYear = getCurrentCycleYear();
  const config = await CycleConfig.findOne({ cycleYear: currentYear, isActive: true });
  const now = new Date();

  if (config) {
    if (now >= config.q4Start) return { quarter: 'Q4', label: 'Q4 Final', isOpen: true };
    if (now >= config.q3Start) return { quarter: 'Q3', label: 'Q3 Check-in', isOpen: true };
    if (now >= config.q2Start) return { quarter: 'Q2', label: 'Q2 Check-in', isOpen: true };
    if (now >= config.q1Start) return { quarter: 'Q1', label: 'Q1 Check-in', isOpen: true };
    if (now >= config.goalSettingStart) return { quarter: 'GOAL_SETTING', label: 'Goal Setting', isOpen: true };
    return { quarter: null, label: 'No Active Window', isOpen: false };
  }

  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  if ((month === 5 && day >= 1) || month === 6) 
    return { quarter: 'GOAL_SETTING', label: 'Goal Setting', isOpen: true };
  if (month === 7) 
    return { quarter: 'Q1', label: 'Q1 Check-in', isOpen: true };
  if (month === 10) 
    return { quarter: 'Q2', label: 'Q2 Check-in', isOpen: true };
  if (month === 1) 
    return { quarter: 'Q3', label: 'Q3 Check-in', isOpen: true };
  if (month === 3 || month === 4) 
    return { quarter: 'Q4', label: 'Q4 Final', isOpen: true };
  
  return { quarter: null, label: 'No Active Window', isOpen: false };
};

const getCurrentQuarter = () => {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();

  if ((month === 5 && day >= 1) || month === 6) return 'goal-setting';
  if (month === 7) return 'Q1';
  if (month === 10) return 'Q2';
  if (month === 1) return 'Q3';
  if (month === 3 || month === 4) return 'Q4';

  return 'goal-setting';
};

const getQuarterWindowMonths = () => ({
  Q1: [7],
  Q2: [10],
  Q3: [1],
  Q4: [3, 4],
});

const getCycleOpenDateForQuarter = (quarter, cycleYear = getCurrentCycleYear()) => {
  if (quarter === 'goal-setting') {
    return new Date(cycleYear, 4, 1);
  }

  if (quarter === 'Q1') {
    return new Date(cycleYear, 6, 1);
  }

  if (quarter === 'Q2') {
    return new Date(cycleYear, 9, 1);
  }

  if (quarter === 'Q3') {
    return new Date(cycleYear, 0, 1);
  }

  if (quarter === 'Q4') {
    return new Date(cycleYear, 2, 1);
  }

  return null;
};

const getQuarterWindowCloseDate = (quarter, cycleYear = getCurrentCycleYear()) => {
  if (quarter === 'Q1') {
    return new Date(cycleYear, 6, 31, 23, 59, 59, 999);
  }

  if (quarter === 'Q2') {
    return new Date(cycleYear, 9, 31, 23, 59, 59, 999);
  }

  if (quarter === 'Q3') {
    return new Date(cycleYear, 0, 31, 23, 59, 59, 999);
  }

  if (quarter === 'Q4') {
    return new Date(cycleYear, 3, 30, 23, 59, 59, 999);
  }

  return null;
};

const isQuarterWindowOpen = (quarter) => {
  const currentMonth = new Date().getMonth() + 1;
  return getQuarterWindowMonths()[quarter]?.includes(currentMonth) || false;
};

const daysBetween = (fromDate, toDate = new Date()) => {
  const diff = toDate.getTime() - fromDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

module.exports = {
  getCurrentCycleYear,
  getCurrentCycle,
  getCurrentQuarter,
  getActiveQuarter: getCurrentQuarter, // Alias for compatibility
  getQuarterWindowMonths,
  getCycleOpenDateForQuarter,
  getQuarterWindowCloseDate,
  isQuarterWindowOpen,
  daysBetween,
};
