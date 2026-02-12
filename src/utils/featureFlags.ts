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

  /**
   * Pincode-based shipping charge feature
   * When enabled: Considers pincode-specific shipping charges from DB
   * When disabled: Uses only order-based tiered shipping (ignores pincode charges)
   */
  PINCODE_BASED_SHIPPING: false,
} as const;

// ============================================================================
// SHIPPING CONFIGURATION
// ============================================================================

export const SHIPPING = {
  /**
   * Tiered shipping charges based on order subtotal
   * 1 - 1000: 80rs
   * 1001 - 4000: 180rs
   * 4001+: 600rs
   */
  TIERS: [
    { min: 0, max: 1000, charge: 80 },
    { min: 1000, max: 4000, charge: 180 },
    { min: 4000, max: Infinity, charge: 600 },
  ],
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
 * Calculate order-based shipping charge using tiered pricing
 * @param subtotal - Order subtotal (before tax)
 * @returns Shipping charge based on tier
 */
export const calculateOrderBasedShipping = (subtotal: number): number => {
  const tier = SHIPPING.TIERS.find(
    (t) => subtotal > t.min && subtotal <= t.max
  );
  return tier ? tier.charge : SHIPPING.TIERS[SHIPPING.TIERS.length - 1].charge;
};

/**
 * Calculate final shipping charge based on feature flags
 *
 * Priority logic:
 * - If PINCODE_BASED_SHIPPING is disabled: uses only order-based tiered shipping
 * - If both enabled: returns the greater of pincode-based or order-based charge
 * - If ORDER_BASED_SHIPPING is disabled: uses only pincode-based shipping
 *
 * @param pincodeCharge - Shipping charge from pincode lookup
 * @param subtotal - Order subtotal (before tax)
 * @returns Final shipping charge to apply
 */
export const calculateShippingCharge = (
  pincodeCharge: number,
  subtotal: number
): number => {
  // Pincode-based shipping disabled - use only order-based tiered shipping
  if (!FeatureFlags.PINCODE_BASED_SHIPPING) {
    return calculateOrderBasedShipping(subtotal);
  }

  // Order-based shipping disabled - use only pincode-based shipping
  if (!FeatureFlags.ORDER_BASED_SHIPPING) {
    return pincodeCharge;
  }

  // Both enabled - use the greater of the two charges
  const orderBasedCharge = calculateOrderBasedShipping(subtotal);
  return Math.max(pincodeCharge, orderBasedCharge);
};
