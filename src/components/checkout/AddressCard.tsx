// ============================================================================
// ADDRESS CARD COMPONENT
// ============================================================================
// Displays a saved address with edit/change option
// ============================================================================

import type { UserAddress } from '../../types/address.types';

interface AddressCardProps {
  address: UserAddress;
  onEdit: () => void;
  showEditButton?: boolean;
  isSelected?: boolean;
}

export const AddressCard = ({
  address,
  onEdit,
  showEditButton = true,
  isSelected = true,
}: AddressCardProps) => {
  return (
    <div
      className={`border rounded-lg p-4 ${
        isSelected ? 'border-accent bg-accent-light' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          <span className="font-semibold text-text-primary">{address.full_name}</span>
          {address.is_default && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-text-secondary rounded">
              Default
            </span>
          )}
        </div>
        {showEditButton && (
          <button
            onClick={onEdit}
            className="text-primary hover:text-primary-hover text-sm font-medium"
          >
            Change
          </button>
        )}
      </div>

      {/* Address Details */}
      <div className="text-text-secondary text-sm space-y-1">
        <p>{address.address_line1}</p>
        {address.address_line2 && <p>{address.address_line2}</p>}
        <p>
          {address.city}, {address.state} - {address.pincode}
        </p>
        <p className="flex items-center gap-2 pt-2">
          <svg
            className="w-4 h-4 text-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <span>+91 {address.phone}</span>
        </p>
      </div>
    </div>
  );
};
