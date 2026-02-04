// ============================================================================
// FEATURE FLAGS
// ============================================================================
// Centralized feature flag management for enabling/disabling features
// Set flags to true/false to toggle functionality across the application
// ============================================================================

/**
 * Feature flags for the application
 * Set to true to enable, false to disable
 */
export const FeatureFlags = {
  /**
   * Order-based shipping charge feature
   * When enabled: Uses the greater of pincode-based OR order-based shipping charge
   * When disabled: Uses only pincode-based shipping charge
   */
  ORDER_BASED_SHIPPING: true,
} as const;

// ============================================================================
// SHIPPING CONFIGURATION
// ============================================================================

export const SHIPPING = {
  /**
   * Minimum order amount to apply order-based shipping charge
   * Orders above this amount will have shipping charge applied
   */
  ORDER_THRESHOLD: 2000,

  /**
   * Shipping charge for orders above the threshold
   */
  ORDER_BASED_CHARGE: 600,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a feature is enabled
 * @param flag - Feature flag key
 * @returns boolean indicating if feature is enabled
 */
export const isFeatureEnabled = (flag: keyof typeof FeatureFlags): boolean => {
  return FeatureFlags[flag];
};

/**
 * Calculate order-based shipping charge
 * Returns shipping charge based on order subtotal
 * @param subtotal - Order subtotal (before tax)
 * @returns Shipping charge (0 if below threshold, SHIPPING.ORDER_BASED_CHARGE if above)
 */
export const calculateOrderBasedShipping = (subtotal: number): number => {
  if (subtotal > SHIPPING.ORDER_THRESHOLD) {
    return SHIPPING.ORDER_BASED_CHARGE;
  }
  return 0;
};

/**
 * Calculate final shipping charge based on feature flag
 * When ORDER_BASED_SHIPPING is enabled: returns the greater of pincode-based or order-based charge
 * When disabled: returns only pincode-based charge
 * @param pincodeCharge - Shipping charge from pincode lookup
 * @param subtotal - Order subtotal (before tax)
 * @returns Final shipping charge to apply
 */
export const calculateShippingCharge = (
  pincodeCharge: number,
  subtotal: number
): number => {
  if (!FeatureFlags.ORDER_BASED_SHIPPING) {
    // Feature disabled - use only pincode-based shipping
    return pincodeCharge;
  }

  // Feature enabled - use the greater of the two charges
  const orderBasedCharge = calculateOrderBasedShipping(subtotal);
  return Math.max(pincodeCharge, orderBasedCharge);
};
