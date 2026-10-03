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
  billingAddress?: ShippingAddress | null; // null = same as shipping
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
  billingAddress?: ShippingAddress | null; // null = same as shipping
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
      billing_address: data.billingAddress || null,
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
  gstNumber?: string | null,
  billingAddress?: ShippingAddress | null
): Promise<CheckoutResult> => {
  return createOrder({
    cart,
    address,
    billingAddress,
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
  const { cart, address, billingAddress, userEmail, shippingCharge, gstNumber, onSuccess, onFailure, onCancel } = params;

  try {
    // Check if Razorpay key is configured
    if (!RAZORPAY_KEY_ID) {
      // COD is not wired into CheckoutPage, so there is no fallback to offer.
      onFailure('Online payment is temporarily unavailable. Please contact us to place your order.');
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

    // Create the Razorpay order server-side. The Edge Function recomputes the
    // amount from this user's cart rows in the database — the browser never
    // supplies an amount, so a tampered client cannot underpay.
    const { data: rzpOrder, error: createError } = await supabase.functions.invoke(
      'razorpay-create-order',
      { body: { receipt: tempOrderRef } }
    );

    if (createError || !rzpOrder?.order_id) {
      console.error('Failed to create Razorpay order:', createError);
      onFailure('Could not start payment. Please try again.');
      return;
    }

    // Server-computed figures are authoritative for both the payment modal and
    // the order row written afterwards, so the two can never disagree.
    const amountInPaise: number = rzpOrder.amount;
    const serverShipping: number = rzpOrder.breakdown?.shipping ?? shippingCharge ?? 0;

    // Razorpay options
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: rzpOrder.currency ?? 'INR',
      name: 'ThreadCart',
      description: `Order Payment`,
      order_id: rzpOrder.order_id,
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
        // Verify the signature server-side BEFORE recording anything. Only
        // Razorpay can produce a valid signature, so this is what stops a
        // forged callback from creating an order that was never paid for.
        const { data: verification, error: verifyError } =
          await supabase.functions.invoke('razorpay-verify-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });

        if (verifyError || !verification?.verified) {
          console.error('Payment verification failed:', verifyError);
          onFailure(
            'We could not verify your payment. If money was deducted it will be ' +
              'refunded automatically. Please contact support quoting reference ' +
              `${response.razorpay_payment_id}.`
          );
          return;
        }

        // Verified — safe to record the order
        const result = await createOrder(
          { cart, address, billingAddress, paymentMethod: 'razorpay', shippingCharge: serverShipping, gstNumber },
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
