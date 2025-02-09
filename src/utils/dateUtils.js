export const formatDate = (year, month) => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const getPreviousMonth = (year, month) => {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
};