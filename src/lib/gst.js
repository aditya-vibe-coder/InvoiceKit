/**
 * All 37 Indian state/UT GST state codes
 */
export const STATE_CODES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '25', name: 'Daman & Diu' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

/**
 * Get state name from state code
 * @param {string} code
 * @returns {string}
 */
export function getStateName(code) {
  const state = STATE_CODES.find(s => s.code === code);
  return state ? state.name : 'Unknown State';
}

/**
 * Convert amount in paise to INR string (e.g., 100000 → "₹1,000.00")
 * @param {number} paise
 * @returns {string}
 */
export function formatINR(paise) {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert amount in paise to words for invoice footer (Indian Numbering System)
 * @param {number} paise
 * @returns {string}
 */
export function amountInWords(paise) {
  if (paise === 0) return 'Rupees Zero Only';
  
  const rupees = Math.floor(paise / 100);
  const remainderPaise = paise % 100;

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', ' Seventy', 'Eighty', 'Ninety'];

  function convertToWords(n) {
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertToWords(n % 100) : '');
    if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000) : '');
    if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWords(n % 100000) : '');
    return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertToWords(n % 10000000) : '');
  }

  let result = '';
  if (rupees > 0) {
    result = 'Rupees ' + convertToWords(rupees);
  }
  if (remainderPaise > 0) {
    const paiseWords = convertToWords(remainderPaise);
    result += (result ? ' and ' : '') + paiseWords + ' Paise';
  }
  
  if (rupees === 0 && remainderPaise === 0) return 'Rupees Zero Only';
  
  return result + ' Only';
}

/**
 * @typedef {{ taxableValue: number, cgst: number, sgst: number, igst: number, total: number }} GSTLineCalc
 */

/**
 * Calculate GST for a single line item
 * @param {{ qty: number, rate: number, gstRate: number }} lineItem - amounts in paise
 * @param {{ supplierStateCode: string, recipientStateCode: string }} parties
 * @returns {GSTLineCalc} all values in paise
 */
export function calculateLineItem(lineItem, parties) {
  const taxableValue = lineItem.qty * lineItem.rate;
  const gstRate = lineItem.gstRate || 0;
  
  let cgst = 0, sgst = 0, igst = 0;

  if (parties.supplierStateCode !== parties.recipientStateCode) {
    // Interstate: IGST only
    igst = Math.round((taxableValue * gstRate) / 100);
  } else {
    // Intrastate: CGST + SGST
    const halfRate = gstRate / 2;
    cgst = Math.round((taxableValue * halfRate) / 100);
    sgst = Math.round((taxableValue * halfRate) / 100);
    
    // Edge case: if gstRate is odd (e.g. 5%), one might be 1 paise higher to make total correct.
    // For standard Indian GST rates (0, 5, 12, 18, 28), they are all even except 5.
    // Most software just does Math.round on both, but the total must be consistent.
    // We ensure CGST + SGST = Total GST.
    const totalGst = Math.round((taxableValue * gstRate) / 100);
    sgst = totalGst - cgst;
  }

  return {
    taxableValue,
    cgst,
    sgst,
    igst,
    total: taxableValue + cgst + sgst + igst
  };
}

/**
 * Calculate totals for an array of line items
 * @param {Array} lineItems
 * @param {{ supplierStateCode: string, recipientStateCode: string }} parties
 * @returns {{ subtotal: number, totalCGST: number, totalSGST: number, totalIGST: number, grandTotal: number, isInterstate: boolean }}
 */
export function calculateInvoiceTotals(lineItems, parties) {
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  lineItems.forEach(item => {
    const calc = calculateLineItem(item, parties);
    subtotal += calc.taxableValue;
    totalCGST += calc.cgst;
    totalSGST += calc.sgst;
    totalIGST += calc.igst;
  });

  return {
    subtotal,
    totalCGST,
    totalSGST,
    totalIGST,
    grandTotal: subtotal + totalCGST + totalSGST + totalIGST,
    isInterstate: parties.supplierStateCode !== parties.recipientStateCode
  };
}
