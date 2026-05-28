export const QUARTER_CONFIG = {
  Q1: { months: [7], label: 'July' },
  Q2: { months: [10], label: 'October' },
  Q3: { months: [1], label: 'January' },
  Q4: { months: [3, 4], label: 'March-April' },
};

export const getActivePeriodInfo = (date = new Date()) => {
  const month = date.getMonth() + 1;

  if (month === 5 || month === 6) {
    return {
      period: 'Goal Setting',
      quarter: null,
      isOpen: true,
      windowLabel: 'Goal setting window open',
      variant: 'blue',
    };
  }

  const quarter = Object.entries(QUARTER_CONFIG).find(([, value]) =>
    value.months.includes(month)
  );

  if (!quarter) {
    return {
      period: null,
      quarter: null,
      isOpen: false,
      windowLabel: 'No active check-in window',
      variant: 'gray',
    };
  }

  return {
    period: `${quarter[0]} Check-in`,
    quarter: quarter[0],
    isOpen: true,
    windowLabel: `${quarter[0]} window open (${quarter[1].label})`,
    variant: 'blue',
  };
};

export const getCurrentQuarterInfo = getActivePeriodInfo;

export const getStatusTone = (status) => {
  const tones = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    returned: 'bg-rose-100 text-rose-700',
    completed: 'bg-emerald-100 text-emerald-700',
    on_track: 'bg-blue-100 text-blue-700',
    not_started: 'bg-slate-100 text-slate-700',
  };

  return tones[status] || 'bg-slate-100 text-slate-700';
};

export const getUomLabel = (uomType) => {
  const labels = {
    min: 'Higher is Better',
    max: 'Lower is Better',
    timeline: 'Date-based Completion',
    zero: 'Zero = Success',
  };

  return labels[uomType] || uomType;
};

export const getUomTone = (uomType) => {
  const tones = {
    min: 'bg-blue-50 text-blue-700',
    max: 'bg-violet-50 text-violet-700',
    timeline: 'bg-amber-50 text-amber-700',
    zero: 'bg-emerald-50 text-emerald-700',
  };

  return tones[uomType] || 'bg-slate-100 text-slate-700';
};

export const calculateScore = ({
  uomType,
  target,
  actual,
  targetDate,
  achievementDate,
}) => {
  if (uomType === 'min') {
    if (!Number(target)) {
      return 0;
    }

    return Math.min((Number(actual || 0) / Number(target)) * 100, 100);
  }

  if (uomType === 'max') {
    if (!Number(actual)) {
      return 0;
    }

    return Math.min((Number(target || 0) / Number(actual)) * 100, 100);
  }

  if (uomType === 'timeline') {
    if (!targetDate || !achievementDate) {
      return 0;
    }

    return new Date(achievementDate) <= new Date(targetDate) ? 100 : 0;
  }

  if (uomType === 'zero') {
    return Number(actual || 0) === 0 ? 100 : 0;
  }

  return 0;
};

export const getLatestQuarterScore = (quarters = []) => {
  const latest = [...quarters]
    .filter((item) => item.progressScore !== null && item.progressScore !== undefined)
    .sort((a, b) => ['Q1', 'Q2', 'Q3', 'Q4'].indexOf(b.quarter) - ['Q1', 'Q2', 'Q3', 'Q4'].indexOf(a.quarter))[0];

  return latest?.progressScore ?? 0;
};
