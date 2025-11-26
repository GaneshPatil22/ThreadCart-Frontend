// ============================================================================
// USE CART HOOK
// ============================================================================
// Custom hook to access cart context
// ============================================================================

import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import type { CartContextState } from '../types/cart.types';

export const useCart = (): CartContextState => {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};
