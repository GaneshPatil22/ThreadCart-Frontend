// ============================================================================
// GST NUMBER VALIDATION
// ============================================================================
// Validates Indian GST Number format (GSTIN)
// Format: 22AAAAA0000A1Z5 (15 characters)
// ============================================================================

/**
 * GST Number format:
 * - First 2 digits: State code (01-37)
 * - Next 10 characters: PAN number
 * - 13th character: Entity number (1-9 or A-Z)
 * - 14th character: Z by default
 * - 15th character: Checksum digit
 */

// Valid state codes (01 to 37)
const VALID_STATE_CODES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37',
];

// GST Regex pattern
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Validate GST number format
 * @param gstNumber - GST number to validate
 * @returns Object with valid status and error message
 */
export const validateGSTNumber = (gstNumber: string): { valid: boolean; message: string } => {
  // Empty is valid (optional field)
  if (!gstNumber || gstNumber.trim() === '') {
    return { valid: true, message: '' };
  }

  // Remove spaces and convert to uppercase
  const cleanGST = gstNumber.trim().toUpperCase();

  // Check length
  if (cleanGST.length !== 15) {
    return {
      valid: false,
      message: 'GST number must be exactly 15 characters',
    };
  }

  // Check format with regex
  if (!GST_REGEX.test(cleanGST)) {
    return {
      valid: false,
      message: 'Invalid GST number format. Example: 22AAAAA0000A1Z5',
    };
  }

  // Validate state code
  const stateCode = cleanGST.substring(0, 2);
  if (!VALID_STATE_CODES.includes(stateCode)) {
    return {
      valid: false,
      message: 'Invalid state code in GST number',
    };
  }

  return { valid: true, message: '' };
};

/**
 * Format GST number (uppercase, trim)
 */
export const formatGSTNumber = (gstNumber: string): string => {
  return gstNumber.trim().toUpperCase();
};

/**
 * Get state name from GST state code
 */
export const getStateFromGSTCode = (gstNumber: string): string | null => {
  if (!gstNumber || gstNumber.length < 2) return null;

  const stateCode = gstNumber.substring(0, 2);
  const stateMap: Record<string, string> = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '25': 'Daman & Diu',
    '26': 'Dadra & Nagar Haveli',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh (Old)',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
  };

  return stateMap[stateCode] || null;
};
