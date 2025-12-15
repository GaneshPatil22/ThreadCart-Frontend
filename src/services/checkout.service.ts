// ============================================================================
// CHECKOUT SERVICE
// ============================================================================
// Orchestrates the checkout flow: address validation → payment → order creation
// ============================================================================

import { supabase } from '../utils/supabase';
import { createOrderFromCart } from './order.service';
import { clearCart } from './cart.service';
import { loadRazorpayScript } from '../utils/razorpay';
import { sendOrderNotificationToAdmins } from './order-notification.service';
import type { CartSummary } from '../types/cart.types';
import type { UserAddress } from '../types/address.types';
import type { PaymentMethod, ShippingAddress } from '../types/database.types';
import type { OrderWithItems, RazorpayPaymentResponse } from '../types/order.types';

// ============================================================================
// TYPES
// ============================================================================

export interface CheckoutData {
  cart: CartSummary;
  address: UserAddress;
  paymentMethod: PaymentMethod;
  shippingCharge: number;
  gstNumber?: string | null;
}

export interface CheckoutResult {
  success: boolean;
  order?: OrderWithItems;
  error?: string;
}

export interface RazorpayCheckoutParams {
  cart: CartSummary;
  address: UserAddress;
  userEmail: string;
  shippingCharge: number;
  gstNumber?: string | null;
  onSuccess: (order: OrderWithItems) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
}

// ============================================================================
// RAZORPAY KEY
// ============================================================================

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// ============================================================================
// CONVERT ADDRESS TO SHIPPING FORMAT
// ============================================================================

const toShippingAddress = (address: UserAddress): ShippingAddress => ({
  full_name: address.full_name,
  phone: address.phone,
  address_line1: address.address_line1,
  address_line2: address.address_line2,
  city: address.city,
  state: address.state,
  postal_code: address.pincode,
  country: address.country || 'India',
});

// ============================================================================
// CREATE ORDER (COD or after payment)
// ============================================================================

export const createOrder = async (
  data: CheckoutData,
  paymentId?: string
): Promise<CheckoutResult> => {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Please login to place order' };
    }

    const userId = session.user.id;

    // Prepare cart items for order
    const cartItems = data.cart.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    // Create order
    const result = await createOrderFromCart({
      user_id: userId,
      shipping_address: toShippingAddress(data.address),
      payment_method: data.paymentMethod,
      shipping_charge: data.shippingCharge || 0,
      gst_number: data.gstNumber || null,
      cart_items: cartItems,
    });

    if (!result.success || !result.order) {
      return { success: false, error: result.error || 'Failed to create order' };
    }

    // Update payment info if paid via Razorpay
    if (paymentId && data.paymentMethod === 'razorpay') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_id: paymentId,
          payment_status: 'completed',
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', result.order.id);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
      } else {
        // Refresh order data
        result.order.payment_id = paymentId;
        result.order.payment_status = 'completed';
        result.order.status = 'confirmed';
      }
    }

    // Clear cart after successful order
    await clearCart(userId);

    // Send notification to admins (don't block on failure)
    sendOrderNotificationToAdmins(result.order).catch((err) => {
      console.error('Failed to send order notification:', err);
    });

    return { success: true, order: result.order };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
};

// ============================================================================
// PLACE COD ORDER
// ============================================================================

export const placeCodOrder = async (
  cart: CartSummary,
  address: UserAddress,
  shippingCharge: number,
  gstNumber?: string | null
): Promise<CheckoutResult> => {
  return createOrder({
    cart,
    address,
    paymentMethod: 'cod',
    shippingCharge,
    gstNumber,
  });
};

// ============================================================================
// INITIATE RAZORPAY CHECKOUT
// ============================================================================

export const initiateRazorpayPayment = async (
  params: RazorpayCheckoutParams
): Promise<void> => {
  const { cart, address, userEmail, shippingCharge, gstNumber, onSuccess, onFailure, onCancel } = params;

  try {
    // Check if Razorpay key is configured
    if (!RAZORPAY_KEY_ID) {
      onFailure('Payment gateway not configured. Please use Cash on Delivery.');
      return;
    }

    // Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure('Failed to load payment gateway. Please try again.');
      return;
    }

    // Check if Razorpay is available
    if (!window.Razorpay) {
      onFailure('Payment gateway not available. Please refresh and try again.');
      return;
    }

    // Generate a temporary order reference
    const tempOrderRef = `TC${Date.now()}`;

    // Amount in paise (1 INR = 100 paise) - include shipping
    const totalWithShipping = cart.total + (shippingCharge || 0);
    const amountInPaise = Math.round(totalWithShipping * 100);

    // Razorpay options
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
      name: 'ThreadCart',
      description: `Order Payment`,
      order_id: '', // Leave empty for test mode without backend
      prefill: {
        name: address.full_name,
        email: userEmail,
        contact: `+91${address.phone}`,
      },
      notes: {
        order_ref: tempOrderRef,
        address: `${address.city}, ${address.state}`,
      },
      theme: {
        color: '#e11d48',
      },
      handler: async (response: RazorpayPaymentResponse) => {
        // Payment successful - create order
        const result = await createOrder(
          { cart, address, paymentMethod: 'razorpay', shippingCharge: shippingCharge || 0, gstNumber },
          response.razorpay_payment_id
        );

        if (result.success && result.order) {
          onSuccess(result.order);
        } else {
          onFailure(result.error || 'Failed to create order after payment');
        }
      },
      modal: {
        ondismiss: () => {
          onCancel();
        },
        escape: true,
        backdropclose: false,
      },
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', (response: any) => {
      console.error('Payment failed:', response.error);
      onFailure(response.error?.description || 'Payment failed. Please try again.');
    });

    razorpay.open();
  } catch (error) {
    console.error('Error initiating Razorpay:', error);
    onFailure('Failed to initiate payment. Please try again.');
  }
};

// ============================================================================
// CHECK RAZORPAY AVAILABILITY
// ============================================================================

export const isRazorpayConfigured = (): boolean => {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_ID !== 'rzp_test_XXXXXXXX');
};

// Check if Razorpay is in test mode (key starts with rzp_test_)
export const isRazorpayTestMode = (): boolean => {
  return RAZORPAY_KEY_ID.startsWith('rzp_test_');
};
