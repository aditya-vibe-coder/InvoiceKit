export function getFinancialYear(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = date.getMonth(); // 0-indexed, so March = 2
  const year = date.getFullYear();
  if (month >= 3) { // April (3) to December (11)
    return `${year}-${String(year + 1).slice(-2)}`;
  } else { // January (0) to March (2)
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

export function formatINR(paise) {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
