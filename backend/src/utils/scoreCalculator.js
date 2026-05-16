const calculateProgressScore = ({
  uomType,
  target,
  actual,
  targetDate,
  achievementDate,
}) => {
  if (uomType === 'min') {
    if (!target) {
      return 0;
    }

    return Math.min((Number(actual || 0) / Number(target)) * 100, 100);
  }

  if (uomType === 'max') {
    if (!actual) {
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

module.exports = {
  calculateProgressScore,
};
