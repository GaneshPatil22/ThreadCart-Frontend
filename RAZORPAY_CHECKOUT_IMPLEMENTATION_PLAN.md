# Razorpay + Checkout Implementation Plan

## 📋 Overview

Complete implementation plan for integrating Razorpay payment gateway with checkout functionality, address management, and PIN code validation.

---

## 🎯 Implementation Phases

### **Phase 1: Database Schema** ⭐
**Estimated Time: ~15 minutes**

#### 1.1 Update Users Table (Add Address Fields)
```sql
-- Add address fields to users table (all optional)
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode VARCHAR(6),
ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
```

#### 1.2 Create Supported Pincodes Table
```sql
-- Create table to whitelist supported pincodes
CREATE TABLE IF NOT EXISTS public.supported_pincodes (
  pincode VARCHAR(6) PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add sample data
INSERT INTO public.supported_pincodes (pincode, city, state) VALUES
  ('400001', 'Mumbai', 'Maharashtra'),
  ('110001', 'New Delhi', 'Delhi'),
  ('560001', 'Bangalore', 'Karnataka'),
  ('600001', 'Chennai', 'Tamil Nadu');

-- Enable RLS
ALTER TABLE public.supported_pincodes ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can check supported pincodes)
CREATE POLICY "Anyone can view supported pincodes"
ON public.supported_pincodes FOR SELECT
USING (is_active = true);

-- Admin only write access
CREATE POLICY "Admin can manage pincodes"
ON public.supported_pincodes FOR ALL
USING (auth.jwt() ->> 'email' = 'superadmin@threadcart.com');
```

#### 1.3 Update Orders Table (if not already done)
```sql
-- Add shipping address to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- shipping_address structure:
-- {
--   "address_line1": "...",
--   "address_line2": "...",
--   "city": "...",
--   "state": "...",
--   "pincode": "...",
--   "phone": "..."
-- }
```

**Files to Create:**
- `supabase_checkout_schema.sql`

---

### **Phase 2: Address Management** ⭐
**Estimated Time: ~30 minutes**

#### 2.1 Address Validation Service
**File:** `src/services/address.service.ts`

```typescript
import { supabase } from '../utils/supabase';

export interface Address {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

// Validate if pincode is supported
export const validatePincode = async (pincode: string) => {
  const { data, error } = await supabase
    .from('supported_pincodes')
    .select('*')
    .eq('pincode', pincode)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, message: 'This pincode is not serviceable' };
  }

  return {
    valid: true,
    city: data.city,
    state: data.state,
    message: 'Pincode is serviceable'
  };
};

// Get user's saved address
export const getUserAddress = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('address_line1, address_line2, city, state, pincode, phone')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Save/Update user address
export const saveUserAddress = async (userId: string, address: Address) => {
  // Validate pincode first
  const validation = await validatePincode(address.pincode);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const { error } = await supabase
    .from('users')
    .update({
      address_line1: address.address_line1,
      address_line2: address.address_line2 || null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, message: 'Failed to save address' };
  }

  return { success: true, message: 'Address saved successfully' };
};

// Clear user address
export const clearUserAddress = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .update({
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      pincode: null,
      phone: null,
    })
    .eq('id', userId);

  return !error;
};
```

#### 2.2 Address Form Component
**File:** `src/components/checkout/AddressForm.tsx`

```typescript
import { useState } from 'react';
import type { Address } from '../../services/address.service';
import { validatePincode } from '../../services/address.service';

interface AddressFormProps {
  initialAddress?: Address;
  onSave: (address: Address) => void;
  onCancel?: () => void;
}

export const AddressForm = ({ initialAddress, onSave, onCancel }: AddressFormProps) => {
  const [address, setAddress] = useState<Address>(initialAddress || {
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const [pincodeError, setPincodeError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handlePincodeChange = async (pincode: string) => {
    setAddress({ ...address, pincode });

    if (pincode.length === 6) {
      setIsValidating(true);
      const result = await validatePincode(pincode);
      setIsValidating(false);

      if (result.valid) {
        setPincodeError('');
        setAddress(prev => ({
          ...prev,
          city: result.city!,
          state: result.state!,
        }));
      } else {
        setPincodeError(result.message);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincodeError) return;
    onSave(address);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address Line 1 <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          required
          value={address.address_line1}
          onChange={(e) => setAddress({ ...address, address_line1: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address Line 2
        </label>
        <input
          type="text"
          value={address.address_line2 || ''}
          onChange={(e) => setAddress({ ...address, address_line2: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Pincode */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pincode <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          required
          pattern="[0-9]{6}"
          maxLength={6}
          value={address.pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
        {isValidating && <p className="text-sm text-gray-500 mt-1">Validating pincode...</p>}
        {pincodeError && <p className="text-sm text-red-600 mt-1">{pincodeError}</p>}
      </div>

      {/* City (auto-filled) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">City</label>
        <input
          type="text"
          required
          value={address.city}
          readOnly
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
        />
      </div>

      {/* State (auto-filled) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">State</label>
        <input
          type="text"
          required
          value={address.state}
          readOnly
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone <span className="text-red-600">*</span>
        </label>
        <input
          type="tel"
          required
          pattern="[0-9]{10}"
          maxLength={10}
          value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!!pincodeError || isValidating}
          className="flex-1 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-hover disabled:opacity-50"
        >
          Save Address
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
```

**Files to Create:**
- `src/services/address.service.ts`
- `src/components/checkout/AddressForm.tsx`
- `src/pages/MyAddress.tsx` (optional - manage address separately)

---

### **Phase 3: Checkout Page** ⭐
**Estimated Time: ~45 minutes**

#### 3.1 Checkout Page Component
**File:** `src/pages/checkout/CheckoutPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { getUserAddress, saveUserAddress } from '../../services/address.service';
import { AddressForm } from '../../components/checkout/AddressForm';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const [userAddress, setUserAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    // Load user's saved address
    const address = await getUserAddress(userId);
    setUserAddress(address);
    setShowAddressForm(!address?.address_line1);
    setLoading(false);
  };

  const handleSaveAddress = async (address) => {
    const result = await saveUserAddress(userId, address);
    if (result.success) {
      setUserAddress(address);
      setShowAddressForm(false);
    } else {
      alert(result.message);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate address exists
    if (!userAddress?.pincode) {
      alert('Please add delivery address');
      return;
    }

    // Proceed to payment
    navigate('/payment');
  };

  if (loading) return <div>Loading...</div>;

  if (!cart || cart.items.length === 0) {
    return <div>Your cart is empty</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address & Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>

            {!showAddressForm && userAddress?.address_line1 ? (
              <div>
                <p>{userAddress.address_line1}</p>
                {userAddress.address_line2 && <p>{userAddress.address_line2}</p>}
                <p>{userAddress.city}, {userAddress.state} - {userAddress.pincode}</p>
                <p>Phone: {userAddress.phone}</p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="mt-4 text-primary hover:underline"
                >
                  Edit Address
                </button>
              </div>
            ) : (
              <AddressForm
                initialAddress={userAddress}
                onSave={handleSaveAddress}
                onCancel={() => setShowAddressForm(false)}
              />
            )}
          </div>

          {/* Cart Items */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Cart Items ({cart.item_count})</h2>
            {/* Render cart items */}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="bg-white p-6 rounded-lg border sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cart.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{cart.tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{cart.shipping}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{cart.total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!userAddress?.pincode}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Files to Create:**
- `src/pages/checkout/CheckoutPage.tsx`
- Update `src/App.tsx` to add `/checkout` route

---

### **Phase 4: Backend - Order Creation API** ⭐
**Estimated Time: ~30 minutes**

#### 4.1 Environment Variables
Add to `.env.local`:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
```

#### 4.2 Create Razorpay Order Service
**File:** `src/services/razorpay.service.ts`

```typescript
import Razorpay from 'razorpay';

// Backend only - Never expose secret key to frontend
const razorpay = new Razorpay({
  key_id: import.meta.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Backend only
});

export interface CreateOrderParams {
  amount: number; // in rupees
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

// Create Razorpay order
export const createRazorpayOrder = async (params: CreateOrderParams) => {
  const options = {
    amount: params.amount * 100, // Convert to paise
    currency: params.currency || 'INR',
    receipt: params.receipt,
    notes: params.notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
};

// Verify payment signature
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};
```

#### 4.3 Order Creation Endpoint
**File:** `src/services/order.service.ts` (update existing)

```typescript
// Create order and initiate Razorpay payment
export const initiateOrder = async (userId: string, cartItems: CartItem[]) => {
  // 1. Validate cart items and stock
  // 2. Validate user address and pincode
  // 3. Calculate total amount
  // 4. Create Razorpay order
  // 5. Return razorpay_order_id, amount, currency

  const totalAmount = calculateTotal(cartItems);
  const receipt = `order_${Date.now()}`;

  const razorpayOrder = await createRazorpayOrder({
    amount: totalAmount,
    currency: 'INR',
    receipt,
    notes: { userId, cartItems: JSON.stringify(cartItems) },
  });

  return {
    razorpay_order_id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key_id: import.meta.env.VITE_RAZORPAY_KEY_ID,
  };
};
```

**Files to Create:**
- `src/services/razorpay.service.ts`
- Update `src/services/order.service.ts`

---

### **Phase 5: Razorpay Payment Integration** ⭐
**Estimated Time: ~1 hour**

#### 5.1 Install Razorpay SDK
```bash
npm install razorpay
```

#### 5.2 Load Razorpay Script
**File:** `src/utils/razorpay.ts`

```typescript
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
```

#### 5.3 Payment Component
**File:** `src/components/checkout/RazorpayPayment.tsx`

```typescript
import { useEffect } from 'react';
import { loadRazorpayScript } from '../../utils/razorpay';
import { initiateOrder } from '../../services/order.service';

interface RazorpayPaymentProps {
  userId: string;
  cartItems: CartItem[];
  userAddress: Address;
  onSuccess: (paymentDetails: any) => void;
  onFailure: (error: any) => void;
}

export const RazorpayPayment = ({
  userId,
  cartItems,
  userAddress,
  onSuccess,
  onFailure
}: RazorpayPaymentProps) => {

  const handlePayment = async () => {
    // 1. Load Razorpay script
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load');
      return;
    }

    // 2. Create order on backend
    const orderData = await initiateOrder(userId, cartItems);

    // 3. Open Razorpay checkout
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'ThreadCart',
      description: 'Order Payment',
      order_id: orderData.razorpay_order_id,
      handler: async (response: any) => {
        // Payment successful
        onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      prefill: {
        name: userAddress.name,
        email: userAddress.email,
        contact: userAddress.phone,
      },
      theme: {
        color: '#e11d48', // primary color
      },
      modal: {
        ondismiss: () => {
          onFailure({ message: 'Payment cancelled by user' });
        },
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-hover"
    >
      Pay Now
    </button>
  );
};
```

#### 5.4 Payment Verification
**File:** `src/services/order.service.ts` (add function)

```typescript
export const verifyAndCreateOrder = async (
  userId: string,
  paymentDetails: any,
  cartItems: CartItem[],
  shippingAddress: Address
) => {
  // 1. Verify payment signature on backend
  const isValid = verifyPaymentSignature(
    paymentDetails.razorpay_order_id,
    paymentDetails.razorpay_payment_id,
    paymentDetails.razorpay_signature
  );

  if (!isValid) {
    throw new Error('Payment verification failed');
  }

  // 2. Create order in database
  const order = await createOrder({
    user_id: userId,
    total_amount: calculateTotal(cartItems),
    payment_method: 'razorpay',
    payment_id: paymentDetails.razorpay_payment_id,
    payment_status: 'completed',
    shipping_address: shippingAddress,
    cart_items: cartItems,
  });

  // 3. Clear cart
  await clearCart(userId);

  return order;
};
```

**Files to Create:**
- `src/utils/razorpay.ts`
- `src/components/checkout/RazorpayPayment.tsx`
- Update `src/services/order.service.ts`

---

### **Phase 6: Order Confirmation** ⭐
**Estimated Time: ~20 minutes**

#### 6.1 Order Success Page
**File:** `src/pages/OrderSuccess.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getOrderById } from '../services/order.service';

export const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  const loadOrder = async (id: string) => {
    const orderData = await getOrderById(id);
    setOrder(orderData);
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <svg className="w-24 h-24 text-green-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-8">
        Thank you for your order. Your order has been confirmed and will be delivered soon.
      </p>

      {/* Order Details */}
      <div className="bg-white p-6 rounded-lg border text-left mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Order Number:</span>
            <span className="font-semibold">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Order Date:</span>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold">₹{order.total_amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Status:</span>
            <span className="text-green-600 font-semibold">Paid</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white p-6 rounded-lg border text-left mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
        <p>{order.shipping_address.address_line1}</p>
        {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
        <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
        <p>Phone: {order.shipping_address.phone}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Link
          to={`/orders/${order.id}`}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
        >
          View Order Details
        </Link>
        <Link
          to="/"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};
```

**Files to Create:**
- `src/pages/OrderSuccess.tsx`
- Update `src/App.tsx` to add `/order/success` route

---

### **Phase 7: Order Tracking (Future)** 🔮
**Estimated Time: ~1-2 hours**

#### 7.1 Order History Page
**File:** `src/pages/OrderHistory.tsx`
- List all orders for logged-in user
- Show order status, date, total
- Link to order details page

#### 7.2 Order Details Page
**File:** `src/pages/OrderDetails.tsx`
- Show complete order information
- Order items with quantities
- Delivery address
- Payment details
- Order timeline/status tracking

#### 7.3 Admin Order Management
- Update order status
- Add tracking information
- Mark as shipped/delivered

**Files to Create:**
- `src/pages/OrderHistory.tsx`
- `src/pages/OrderDetails.tsx`
- `src/components/orders/OrderStatusTimeline.tsx`

---

## 🔑 Key Points

### **Address Management:**
- ✅ One address per user (stored in users table)
- ✅ Address is optional
- ✅ New address replaces old address

### **PIN Code Validation:**
- ✅ Whitelist approach using `supported_pincodes` table
- ✅ Validation at multiple levels (frontend + backend)
- ✅ Admin can manage supported pincodes
- ✅ Orders only allowed for supported pincodes

### **Payment Flow:**
```
Cart → Checkout → Address → Create Razorpay Order →
Payment UI → Verify Payment → Create DB Order →
Clear Cart → Success Page
```

### **Security:**
- ✅ Never expose Razorpay secret key to frontend
- ✅ Verify payment signature on backend
- ✅ RLS policies for all database operations
- ✅ Validate pincode before order creation

---

## 📂 Files to Create

### **Database:**
- `supabase_checkout_schema.sql`

### **Services:**
- `src/services/address.service.ts`
- `src/services/razorpay.service.ts`
- Update: `src/services/order.service.ts`

### **Components:**
- `src/components/checkout/AddressForm.tsx`
- `src/components/checkout/RazorpayPayment.tsx`

### **Pages:**
- `src/pages/checkout/CheckoutPage.tsx`
- `src/pages/OrderSuccess.tsx`
- `src/pages/MyAddress.tsx` (optional)

### **Utils:**
- `src/utils/razorpay.ts`

### **Future (Phase 7):**
- `src/pages/OrderHistory.tsx`
- `src/pages/OrderDetails.tsx`
- `src/components/orders/OrderStatusTimeline.tsx`

---

## ⏱️ Time Estimates

| Phase | Task | Time |
|-------|------|------|
| 1 | Database Schema | 15 mins |
| 2 | Address Management | 30 mins |
| 3 | Checkout Page | 45 mins |
| 4 | Backend Order API | 30 mins |
| 5 | Razorpay Integration | 1 hour |
| 6 | Order Confirmation | 20 mins |
| **Total** | **Phases 1-6** | **~3-4 hours** |
| 7 | Order Tracking (Future) | 1-2 hours |

---

## 🚀 Getting Started

When ready to implement:

1. Start with **Phase 1** (Database Schema)
2. Test each phase before moving to next
3. Keep Razorpay in test mode during development
4. Use test card numbers for payment testing
5. Only switch to live mode after full testing

---

## 🧪 Testing

### **Razorpay Test Cards:**
- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### **Test Pincodes:**
Add sample pincodes in `supported_pincodes` table for testing.

---

## 📝 Notes

- This plan assumes cart system is already implemented (✅ Done)
- Razorpay SDK is for Node.js backend, frontend uses checkout.js
- All amounts in Razorpay are in paise (multiply by 100)
- Store this file for reference when implementing
- Follow the phases in order for smooth implementation

---

**Status:** 📋 **PLANNED - Ready to Implement**
