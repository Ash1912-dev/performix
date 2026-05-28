/**
 * Format a numeric score as a percentage string.
 * Returns "N/A" for null/undefined values.
 */
export function formatScore(score) {
  if (score === null || score === undefined) return 'N/A';
  return `${Number(score).toFixed(1)}%`;
}

/**
 * Format a date into "15 Jan 2025" style.
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a number as Indian-style currency.
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return `₹ ${Number(value).toLocaleString('en-IN')}`;
}

/**
 * Map quarter code to descriptive label.
 */
export function getQuarterLabel(quarter) {
  const labels = {
    Q1: 'Q1 (July)',
    Q2: 'Q2 (October)',
    Q3: 'Q3 (January)',
    Q4: 'Q4 (March)',
  };
  return labels[quarter] || quarter;
}

/**
 * Return a Tailwind color class pair for a given status.
 */
export function getStatusColor(status) {
  const map = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    returned: 'bg-rose-100 text-rose-700',
    completed: 'bg-emerald-100 text-emerald-700',
    on_track: 'bg-blue-100 text-blue-700',
    not_started: 'bg-slate-100 text-slate-500',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

/**
 * Return a human-readable label for a UoM type.
 */
export function getUomLabel(uomType) {
  const map = {
    min: 'Higher is Better',
    max: 'Lower is Better',
    timeline: 'Date-based Completion',
    zero: 'Zero = Success',
  };
  return map[uomType] || uomType;
}

/**
 * Get the current quarter info based on today's date.
 * Performix cycle: Q1=July, Q2=October, Q3=January, Q4=March.
 */
export function getCurrentQuarter(date = new Date()) {
  const month = date.getMonth() + 1;

  if (month === 7) return { quarter: 'Q1', label: 'Q1 Check-in', isOpen: true };
  if (month === 10) return { quarter: 'Q2', label: 'Q2 Check-in', isOpen: true };
  if (month === 1) return { quarter: 'Q3', label: 'Q3 Check-in', isOpen: true };
  if (month === 3 || month === 4) return { quarter: 'Q4', label: 'Q4 Check-in', isOpen: true };
  if (month === 5 || month === 6) return { quarter: 'GOAL_SETTING', label: 'Goal Setting', isOpen: true };

  return { quarter: null, label: 'No active window', isOpen: false };
}
