import React from 'react';

// Reusable Number Input Component
interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  min?: number;
  max?: number;
  allowDecimals?: boolean;
}

export function NumberInput({
  value,
  onChange,
  placeholder = "",
  required = false,
  className = "",
  min,
  max,
  allowDecimals = true,
}: NumberInputProps) {
  const [internalValue, setInternalValue] = React.useState<string>('');

  // Sync external value to internal string representation
  React.useEffect(() => {
    if (value === null) {
      setInternalValue('');
    } else {
      setInternalValue(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (val === '') {
      setInternalValue('');
      onChange(null);
      return;
    }
    
    // Regex: allow decimals (including leading dot like .05) or integers
    const regex = allowDecimals ? /^\.?\d*\.?\d*$/ : /^\d*$/;
    
    // Prevent multiple dots
    if (allowDecimals && (val.match(/\./g) || []).length > 1) return;
    
    if (regex.test(val)) {
      setInternalValue(val);
      
      // Don't convert to number if it's just a dot or ends with incomplete decimal
      if (val === '.' || val === '') {
        onChange(null);
        return;
      }
      
      const numVal = Number(val);
      
      // Check min/max constraints
      if (min !== undefined && numVal < min) return;
      if (max !== undefined && numVal > max) return;
      
      onChange(numVal);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={internalValue}
      onChange={handleChange}
      className={`border rounded-lg p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
      required={required}
    />
  );
}