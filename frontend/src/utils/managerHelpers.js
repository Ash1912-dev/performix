import { getActivePeriodInfo, getStatusTone, getUomLabel } from './employeeHelpers';

export const MANAGER_COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export const formatDisplayDate = (value, fallback = 'N/A') => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getManagerCurrentDate = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const getQuarterBadgeTone = (quarter) =>
  quarter
    ? 'border-blue-200 bg-blue-50 text-blue-700'
    : 'border-slate-200 bg-slate-100 text-slate-600';

export const getScoreTone = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return 'bg-slate-100 text-slate-500';
  }

  if (Number(score) >= 80) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (Number(score) >= 50) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
};

export const getScoreColor = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return '#94a3b8';
  }

  if (Number(score) >= 80) {
    return MANAGER_COLORS.success;
  }

  if (Number(score) >= 50) {
    return MANAGER_COLORS.warning;
  }

  return MANAGER_COLORS.danger;
};

export const formatScore = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return 'No data';
  }

  return `${Math.round(Number(score))}%`;
};

export const formatGoalTarget = (goal) => {
  if (!goal) {
    return 'N/A';
  }

  if (goal.uomType === 'timeline') {
    return formatDisplayDate(goal.targetDate);
  }

  if (goal.uomType === 'zero') {
    return '0';
  }

  return goal.target ?? 'N/A';
};

export const getEmployeeSheetMap = (goalSheets = []) =>
  goalSheets.reduce((acc, sheet) => {
    const employeeId = sheet.employeeId?._id;

    if (employeeId) {
      acc[employeeId] = sheet;
    }

    return acc;
  }, {});

export const buildCheckInSummaryRows = (summary = []) =>
  summary.map((entry) => {
    const quarterScores = entry.quarters.reduce((acc, quarter) => {
      acc[quarter.quarter] = quarter;
      return acc;
    }, {});

    const validScores = entry.quarters
      .map((quarter) => quarter.progressScore)
      .filter((score) => score !== null && score !== undefined);

    return {
      goalId: entry.goal._id,
      goalTitle: entry.goal.title,
      Q1: quarterScores.Q1,
      Q2: quarterScores.Q2,
      Q3: quarterScores.Q3,
      Q4: quarterScores.Q4,
      avg: validScores.length
        ? validScores.reduce((sum, score) => sum + Number(score), 0) / validScores.length
        : null,
    };
  });

export const getGoalSheetQuarterScores = (summary = []) => {
  const scores = QUARTERS.reduce((acc, quarter) => {
    acc[quarter] = [];
    return acc;
  }, {});

  summary.forEach((entry) => {
    entry.quarters.forEach((quarterItem) => {
      if (quarterItem.progressScore !== null && quarterItem.progressScore !== undefined) {
        scores[quarterItem.quarter].push(Number(quarterItem.progressScore));
      }
    });
  });

  return QUARTERS.reduce((acc, quarter) => {
    acc[quarter] = scores[quarter].length
      ? scores[quarter].reduce((sum, value) => sum + value, 0) / scores[quarter].length
      : null;
    return acc;
  }, {});
};

export const getCompletedCheckInsForQuarter = (checkIns = [], quarter) =>
  checkIns.filter(
    (item) => item.quarter === quarter && item.status === 'completed'
  ).length;

export const getManagerActivePeriod = () => getActivePeriodInfo();

export const getManagerStatusTone = getStatusTone;
export const getManagerUomLabel = getUomLabel;
