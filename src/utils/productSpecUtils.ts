/**
 * Checks if a value represents "STANDARD" (0 or -1).
 */
export const isStandardValue = (value: string | number | null | undefined): boolean => {
  if (typeof value === "number") {
    return value === 0 || value === -1;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "0" || trimmed === "-1";
  }
  return false;
};

/**
 * Checks if a specification value should be displayed.
 * - Show if value is 0 or -1 (will display as "STANDARD")
 * - Show if value is a valid non-empty string
 * - Hide if null, undefined, NaN, or empty
 */
export const shouldShowSpec = (value: string | number | null | undefined): boolean => {
  if (isStandardValue(value)) {
    return true;
  }

  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "number" && isNaN(value)) {
    return false;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "" || trimmed === "null" || trimmed === "nan" || trimmed === "undefined") {
      return false;
    }
  }

  return true;
};

/**
 * Formats a product specification value.
 * Returns "STANDARD" for 0 or -1, otherwise returns the original value.
 */
export const formatSpecValue = (value: string | number | null | undefined): string => {
  if (isStandardValue(value)) {
    return "STANDARD";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value ?? "";
};
