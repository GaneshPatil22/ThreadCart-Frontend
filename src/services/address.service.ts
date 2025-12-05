// ============================================================================
// ADDRESS SERVICE
// ============================================================================
// Service for address management and pincode validation
// ============================================================================

import { supabase } from '../utils/supabase';
import type {
  UserAddress,
  UserAddressInsert,
  UserAddressUpdate,
  PincodeValidationResult,
  AddressSaveResult,
  SupportedPincode,
} from '../types/address.types';

// ============================================================================
// PINCODE VALIDATION
// ============================================================================

/**
 * Validate if a pincode is serviceable
 * Returns city and state if valid
 */
export const validatePincode = async (
  pincode: string
): Promise<PincodeValidationResult> => {
  // Basic format validation
  if (!/^\d{6}$/.test(pincode)) {
    return {
      valid: false,
      message: 'Pincode must be 6 digits',
    };
  }

  try {
    const { data, error } = await supabase
      .from('supported_pincodes')
      .select('*')
      .eq('pincode', pincode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return {
        valid: false,
        message: 'Sorry, we do not deliver to this pincode yet',
      };
    }

    const pincodeData = data as SupportedPincode;

    return {
      valid: true,
      city: pincodeData.city,
      state: pincodeData.state,
      delivery_days: pincodeData.delivery_days,
      message: `Delivery available in ${pincodeData.delivery_days} days`,
    };
  } catch (err) {
    console.error('Error validating pincode:', err);
    return {
      valid: false,
      message: 'Error validating pincode. Please try again.',
    };
  }
};

/**
 * Get delivery estimate for a pincode
 */
export const getDeliveryEstimate = async (
  pincode: string
): Promise<{ days: number; date: string } | null> => {
  const validation = await validatePincode(pincode);

  if (!validation.valid || !validation.delivery_days) {
    return null;
  }

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + validation.delivery_days);

  return {
    days: validation.delivery_days,
    date: deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  };
};

// ============================================================================
// USER ADDRESS MANAGEMENT
// ============================================================================

/**
 * Get user's saved address
 * Returns the default address or the first address
 */
export const getUserAddress = async (
  userId: string
): Promise<UserAddress | null> => {
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      // If no default address, try to get any address
      if (error.code === 'PGRST116') {
        const { data: anyAddress } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .single();

        return anyAddress as UserAddress | null;
      }
      return null;
    }

    return data as UserAddress;
  } catch (err) {
    console.error('Error getting user address:', err);
    return null;
  }
};

/**
 * Get all addresses for a user
 */
export const getUserAddresses = async (
  userId: string
): Promise<UserAddress[]> => {
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user addresses:', error);
      return [];
    }

    return data as UserAddress[];
  } catch (err) {
    console.error('Error getting user addresses:', err);
    return [];
  }
};

/**
 * Save or update user address
 * If user has no address, creates new one
 * If user has address, updates it
 */
export const saveUserAddress = async (
  userId: string,
  addressData: Omit<UserAddressInsert, 'user_id'>
): Promise<AddressSaveResult> => {
  try {
    // Validate pincode first
    const pincodeValidation = await validatePincode(addressData.pincode);
    if (!pincodeValidation.valid) {
      return {
        success: false,
        message: pincodeValidation.message,
      };
    }

    // Check if user already has an address
    const existingAddress = await getUserAddress(userId);

    if (existingAddress) {
      // Update existing address
      const { data, error } = await supabase
        .from('user_addresses')
        .update({
          ...addressData,
          city: pincodeValidation.city,
          state: pincodeValidation.state,
        } as UserAddressUpdate)
        .eq('id', existingAddress.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating address:', error);
        return {
          success: false,
          message: 'Failed to update address. Please try again.',
        };
      }

      return {
        success: true,
        address: data as UserAddress,
        message: 'Address updated successfully',
      };
    } else {
      // Create new address
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: userId,
          ...addressData,
          city: pincodeValidation.city,
          state: pincodeValidation.state,
          is_default: true,
        } as UserAddressInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating address:', error);
        return {
          success: false,
          message: 'Failed to save address. Please try again.',
        };
      }

      return {
        success: true,
        address: data as UserAddress,
        message: 'Address saved successfully',
      };
    }
  } catch (err) {
    console.error('Error saving address:', err);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
};

/**
 * Delete user address
 */
export const deleteUserAddress = async (
  userId: string,
  addressId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting address:', error);
      return {
        success: false,
        message: 'Failed to delete address',
      };
    }

    return {
      success: true,
      message: 'Address deleted successfully',
    };
  } catch (err) {
    console.error('Error deleting address:', err);
    return {
      success: false,
      message: 'An error occurred',
    };
  }
};

/**
 * Check if address is complete for checkout
 */
export const isAddressComplete = (address: UserAddress | null): boolean => {
  if (!address) return false;

  return Boolean(
    address.full_name &&
      address.phone &&
      address.address_line1 &&
      address.city &&
      address.state &&
      address.pincode
  );
};
