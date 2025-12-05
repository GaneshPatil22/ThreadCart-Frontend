// ============================================================================
// ADDRESS FORM COMPONENT
// ============================================================================
// Form for entering/editing delivery address with pincode validation
// ============================================================================

import { useState, useEffect } from 'react';
import { validatePincode } from '../../services/address.service';
import type { AddressFormData, PincodeValidationResult } from '../../types/address.types';

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export const AddressForm = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Address',
  isLoading = false,
}: AddressFormProps) => {
  const [formData, setFormData] = useState<AddressFormData>({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    address_line1: initialData?.address_line1 || '',
    address_line2: initialData?.address_line2 || '',
    pincode: initialData?.pincode || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
  });

  const [pincodeStatus, setPincodeStatus] = useState<PincodeValidationResult | null>(null);
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  // Validate pincode when it changes
  useEffect(() => {
    const checkPincode = async () => {
      if (formData.pincode.length === 6) {
        setIsValidatingPincode(true);
        const result = await validatePincode(formData.pincode);
        setPincodeStatus(result);
        setIsValidatingPincode(false);

        if (result.valid && result.city && result.state) {
          setFormData((prev) => ({
            ...prev,
            city: result.city!,
            state: result.state!,
          }));
          setErrors((prev) => ({ ...prev, pincode: undefined }));
        } else {
          setErrors((prev) => ({ ...prev, pincode: result.message }));
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

    checkPincode();
  }, [formData.pincode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Phone validation - only digits
    if (name === 'phone' && value && !/^\d*$/.test(value)) {
      return;
    }

    // Pincode validation - only digits
    if (name === 'pincode' && value && !/^\d*$/.test(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {};

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

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!pincodeStatus?.valid) {
      newErrors.pincode = pincodeStatus?.message || 'Invalid pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Enter your full name"
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
            errors.full_name ? 'border-red-500' : 'border-border'
          }`}
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-border rounded-l-lg text-text-secondary text-sm">
            +91
          </span>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10 digit mobile number"
            maxLength={10}
            className={`flex-1 px-4 py-2.5 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
              errors.phone ? 'border-red-500' : 'border-border'
            }`}
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* Pincode */}
      <div>
        <label
          htmlFor="pincode"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Pincode <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6 digit pincode"
            maxLength={6}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
              errors.pincode
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
        {errors.pincode && (
          <p className="mt-1 text-sm text-red-500">{errors.pincode}</p>
        )}
        {pincodeStatus?.valid && (
          <p className="mt-1 text-sm text-green-600">{pincodeStatus.message}</p>
        )}
      </div>

      {/* City & State (Auto-filled) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            readOnly
            placeholder="Auto-filled from pincode"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-gray-50 text-text-secondary cursor-not-allowed"
          />
        </div>
        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            State
          </label>
          <input
            type="text"
            id="state"
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
        <label
          htmlFor="address_line1"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Address (House No, Building, Street) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="address_line1"
          name="address_line1"
          value={formData.address_line1}
          onChange={handleChange}
          placeholder="House/Flat No, Building Name, Street"
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
            errors.address_line1 ? 'border-red-500' : 'border-border'
          }`}
        />
        {errors.address_line1 && (
          <p className="mt-1 text-sm text-red-500">{errors.address_line1}</p>
        )}
      </div>

      {/* Address Line 2 */}
      <div>
        <label
          htmlFor="address_line2"
          className="block text-sm font-medium text-text-primary mb-1"
        >
          Locality / Area (Optional)
        </label>
        <input
          type="text"
          id="address_line2"
          name="address_line2"
          value={formData.address_line2}
          onChange={handleChange}
          placeholder="Locality, Landmark, Area"
          className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || isValidatingPincode}
          className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Saving...</span>
            </>
          ) : (
            submitLabel
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-border rounded-lg font-medium text-text-primary hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
