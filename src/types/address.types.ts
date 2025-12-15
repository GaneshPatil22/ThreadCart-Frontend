// ============================================================================
// ADDRESS TYPES
// ============================================================================
// Types for address management and pincode validation
// ============================================================================

// ============================================================================
// SUPPORTED PINCODE
// ============================================================================

export interface SupportedPincode {
  pincode: string;
  city: string;
  state: string;
  delivery_days: number;
  shipping_charge: number; // Shipping charge in INR, 0 = free
  is_active: boolean;
}

// ============================================================================
// USER ADDRESS
// ============================================================================

export interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddressInsert {
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  is_default?: boolean;
}

export interface UserAddressUpdate {
  full_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  is_default?: boolean;
}

// ============================================================================
// ADDRESS FORM DATA
// ============================================================================

export interface AddressFormData {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  pincode: string;
  city: string;
  state: string;
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface PincodeValidationResult {
  valid: boolean;
  city?: string;
  state?: string;
  delivery_days?: number;
  shipping_charge?: number; // Shipping charge in INR, 0 = free
  message: string;
}

export interface AddressSaveResult {
  success: boolean;
  address?: UserAddress;
  message: string;
}
