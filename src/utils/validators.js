/**
 * Validates Indian GSTIN (Goods and Services Tax Identification Number)
 * Format: 2 digits (State Code) + 10 chars (PAN) + 1 char (Entity Code) + 1 char (Z) + 1 char (Checksum)
 * Total: 15 characters
 * 
 * @param {string} gstin 
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateGSTIN(gstin) {
  if (!gstin) return { isValid: true, error: null }; // Optional field

  const cleanGstin = gstin.trim().toUpperCase();
  
  if (cleanGstin.length !== 15) {
    return { isValid: false, error: 'GSTIN must be exactly 15 characters' };
  }

  // Regex for GSTIN:
  // ^[0-9]{2} : State code (2 digits)
  // [A-Z]{5}[0-9]{4}[A-Z]{1} : PAN (5 letters, 4 digits, 1 letter)
  // [1-9A-Z]{1} : Entity code (1 digit/letter, not 0)
  // Z : Default character
  // [0-9A-Z]{1}$ : Checksum (1 digit/letter)
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!GSTIN_REGEX.test(cleanGstin)) {
    return { isValid: false, error: 'Invalid GSTIN format' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates Indian PAN (Permanent Account Number)
 * Format: 5 letters + 4 digits + 1 letter
 * 
 * @param {string} pan 
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validatePAN(pan) {
  if (!pan) return { isValid: true, error: null };
  const cleanPan = pan.trim().toUpperCase();
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!PAN_REGEX.test(cleanPan)) {
    return { isValid: false, error: 'Invalid PAN format' };
  }
  return { isValid: true, error: null };
}
