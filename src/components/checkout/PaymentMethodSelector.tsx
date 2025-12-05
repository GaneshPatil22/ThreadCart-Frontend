// ============================================================================
// PAYMENT METHOD SELECTOR
// ============================================================================
// Component to select payment method (Razorpay or COD)
// ============================================================================

import type { ReactNode } from 'react';
import { isRazorpayConfigured } from '../../services/checkout.service';
import type { PaymentMethod } from '../../types/database.types';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export const PaymentMethodSelector = ({
  selected,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) => {
  const razorpayAvailable = isRazorpayConfigured();

  const methods: { value: PaymentMethod; label: string; description: string; icon: ReactNode }[] = [
    {
      value: 'razorpay',
      label: 'Pay Online',
      description: razorpayAvailable
        ? 'Credit/Debit Card, UPI, Net Banking, Wallets'
        : 'Not configured - Contact admin',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      value: 'cod',
      label: 'Cash on Delivery',
      description: 'Pay when your order arrives',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const isDisabled = disabled || (method.value === 'razorpay' && !razorpayAvailable);
        const isSelected = selected === method.value;

        return (
          <label
            key={method.value}
            className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-gray-300'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="payment_method"
              value={method.value}
              checked={isSelected}
              onChange={() => onChange(method.value)}
              disabled={isDisabled}
              className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={isSelected ? 'text-primary' : 'text-text-secondary'}>
                  {method.icon}
                </span>
                <span className="font-medium text-text-primary">{method.label}</span>
                {method.value === 'razorpay' && razorpayAvailable && (
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">{method.description}</p>
            </div>
            {method.value === 'razorpay' && (
              <div className="flex items-center gap-1">
                <img src="https://cdn.razorpay.com/logos/BUVwvgaqVByGp2_medium.png" alt="Razorpay" className="h-6" />
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
};
