// ============================================================================
// BILLING ADDRESS SECTION COMPONENT
// ============================================================================
// Billing address form with "Same as shipping" toggle
// Uses same pincode validation as shipping address
// Billing address is NOT saved as user preference - entered fresh each checkout
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import type { ShippingAddress } from '../../types/database.types';
import { validatePincode } from '../../services/address.service';
import type { PincodeValidationResult } from '../../types/address.types';

// ============================================================================
// TYPES
// ============================================================================

export interface BillingAddressFormData {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface BillingAddressSectionProps {
  shippingAddress: ShippingAddress | null;
  onBillingAddressChange: (address: ShippingAddress, isSameAsShipping: boolean) => void;
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BillingAddressSection = ({
  shippingAddress,
  onBillingAddressChange,
  disabled = false,
}: BillingAddressSectionProps) => {
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [formData, setFormData] = useState<BillingAddressFormData>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BillingAddressFormData, string>>>({});
  const [pincodeStatus, setPincodeStatus] = useState<PincodeValidationResult | null>(null);
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);

  // Track last sent address to prevent infinite loops
  const lastSentAddressRef = useRef<string | null>(null);

  // Validate pincode when it changes (same logic as AddressForm)
  useEffect(() => {
    const checkPincode = async () => {
      if (formData.postal_code.length === 6) {
        setIsValidatingPincode(true);
        const result = await validatePincode(formData.postal_code);
        setPincodeStatus(result);
        setIsValidatingPincode(false);

        if (result.valid && result.city && result.state) {
          setFormData((prev) => ({
            ...prev,
            city: result.city!,
            state: result.state!,
          }));
          setErrors((prev) => ({ ...prev, postal_code: undefined }));
        } else {
          setErrors((prev) => ({ ...prev, postal_code: result.message }));
          setFormData((prev) => ({
            ...prev,
            city: '',
            state: '',
          }));
        }
      } else {
        setPincodeStatus(null);
        setFormData((prev) => ({
          ...prev,
          city: '',
          state: '',
        }));
      }
    };

    if (!sameAsShipping) {
      checkPincode();
    }
  }, [formData.postal_code, sameAsShipping]);

  // When toggle changes or shipping address changes, update parent
  useEffect(() => {
    if (sameAsShipping && shippingAddress) {
      // Create a key to check if we've already sent this address
      const addressKey = `same:${shippingAddress.postal_code}:${shippingAddress.address_line1}`;
      if (lastSentAddressRef.current !== addressKey) {
        lastSentAddressRef.current = addressKey;
        onBillingAddressChange(shippingAddress, true);
      }
    } else if (!sameAsShipping && validateForm(false)) {
      // Create a key for custom billing address
      const addressKey = `custom:${formData.postal_code}:${formData.address_line1}:${formData.full_name}`;
      if (lastSentAddressRef.current !== addressKey) {
        lastSentAddressRef.current = addressKey;
        onBillingAddressChange({
          full_name: formData.full_name,
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2 || undefined,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
        }, false);
      }
    }
  }, [sameAsShipping, shippingAddress, formData.postal_code, formData.address_line1, formData.full_name, formData.phone, formData.city, formData.state, formData.address_line2, formData.country, onBillingAddressChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Phone validation - only digits
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return;
    }

    // Postal code validation - only digits
    if (name === 'postal_code' && value && !/^\d*$/.test(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (showErrors = true): boolean => {
    const newErrors: Partial<Record<keyof BillingAddressFormData, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address is required';
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Pincode is required';
    } else if (!pincodeStatus?.valid) {
      newErrors.postal_code = pincodeStatus?.message || 'Invalid pincode';
    }

    if (showErrors) {
      setErrors(newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleToggle = () => {
    if (!disabled) {
      setSameAsShipping(!sameAsShipping);
    }
  };

  // Validate on blur to provide feedback
  const handleBlur = () => {
    if (!sameAsShipping) {
      validateForm(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Billing Address
      </h2>

      {/* Same as Shipping Toggle */}
      <label className="flex items-center gap-3 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={sameAsShipping}
          onChange={handleToggle}
          disabled={disabled || !shippingAddress}
          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
        />
        <span className={`text-sm ${disabled ? 'text-text-secondary' : 'text-text-primary'}`}>
          Same as shipping address
        </span>
      </label>

      {/* Show shipping address preview when same as shipping */}
      {sameAsShipping && shippingAddress && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-text-secondary">
          <p className="font-medium text-text-primary">{shippingAddress.full_name}</p>
          <p>{shippingAddress.address_line1}</p>
          {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
          <p>
            {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postal_code}
          </p>
        </div>
      )}

      {/* Billing Address Form (when different from shipping) */}
      {!sameAsShipping && (
        <div className="space-y-4 mt-4 pt-4 border-t border-border">
          <p className="text-sm text-text-secondary mb-4">
            Enter your billing address details below. Only supported pincodes are allowed.
          </p>

          {/* Full Name */}
          <div>
            <label htmlFor="billing_full_name" className="block text-sm font-medium text-text-primary mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="billing_full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter full name"
              disabled={disabled}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100 ${
                errors.full_name ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="billing_phone" className="block text-sm font-medium text-text-primary mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-border rounded-l-lg text-text-secondary text-sm">
                +91
              </span>
              <input
                type="tel"
                id="billing_phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="10 digit mobile number"
                maxLength={10}
                disabled={disabled}
                className={`flex-1 px-4 py-2.5 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100 ${
                  errors.phone ? 'border-red-500' : 'border-border'
                }`}
              />
            </div>
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>

          {/* Pincode */}
          <div>
            <label htmlFor="billing_postal_code" className="block text-sm font-medium text-text-primary mb-1">
              Pincode <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="billing_postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="6 digit pincode"
                maxLength={6}
                disabled={disabled}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100 ${
                  errors.postal_code
                    ? 'border-red-500'
                    : pincodeStatus?.valid
                    ? 'border-green-500'
                    : 'border-border'
                }`}
              />
              {isValidatingPincode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
              {!isValidatingPincode && pincodeStatus?.valid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
            {errors.postal_code && (
              <p className="mt-1 text-sm text-red-500">{errors.postal_code}</p>
            )}
            {pincodeStatus?.valid && (
              <p className="mt-1 text-sm text-green-600">{pincodeStatus.message}</p>
            )}
          </div>

          {/* City & State (Auto-filled from pincode) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="billing_city" className="block text-sm font-medium text-text-primary mb-1">
                City
              </label>
              <input
                type="text"
                id="billing_city"
                name="city"
                value={formData.city}
                readOnly
                placeholder="Auto-filled from pincode"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-gray-50 text-text-secondary cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="billing_state" className="block text-sm font-medium text-text-primary mb-1">
                State
              </label>
              <input
                type="text"
                id="billing_state"
                name="state"
                value={formData.state}
                readOnly
                placeholder="Auto-filled from pincode"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-gray-50 text-text-secondary cursor-not-allowed"
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label htmlFor="billing_address_line1" className="block text-sm font-medium text-text-primary mb-1">
              Address (House No, Building, Street) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="billing_address_line1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="House/Flat No, Building Name, Street"
              disabled={disabled}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100 ${
                errors.address_line1 ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.address_line1 && <p className="mt-1 text-sm text-red-500">{errors.address_line1}</p>}
          </div>

          {/* Address Line 2 */}
          <div>
            <label htmlFor="billing_address_line2" className="block text-sm font-medium text-text-primary mb-1">
              Locality / Area (Optional)
            </label>
            <input
              type="text"
              id="billing_address_line2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Locality, Landmark, Area"
              disabled={disabled}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-100"
            />
          </div>

          {/* Note about billing address not being saved */}
          <p className="text-xs text-text-secondary mt-2">
            Note: Billing address is not saved and must be entered for each order.
          </p>
        </div>
      )}
    </div>
  );
};
