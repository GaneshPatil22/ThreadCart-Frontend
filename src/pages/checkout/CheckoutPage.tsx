// ============================================================================
// CHECKOUT PAGE
// ============================================================================
// Full checkout flow with address, payment method selection, and order placement
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { supabase } from '../../utils/supabase';
import { getUserAddress, saveUserAddress, getDeliveryEstimate } from '../../services/address.service';
import { placeCodOrder, initiateRazorpayPayment, isRazorpayConfigured } from '../../services/checkout.service';
import { AddressForm } from '../../components/checkout/AddressForm';
import { AddressCard } from '../../components/checkout/AddressCard';
import { CheckoutItemRow } from '../../components/checkout/CheckoutItemRow';
import { PaymentMethodSelector } from '../../components/checkout/PaymentMethodSelector';
import type { UserAddress, AddressFormData } from '../../types/address.types';
import type { PaymentMethod } from '../../types/database.types';

// ============================================================================
// CHECKOUT STEPS
// ============================================================================

type CheckoutStep = 'address' | 'payment' | 'processing';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, refreshCart } = useCart();

  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Address state
  const [savedAddress, setSavedAddress] = useState<UserAddress | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isRazorpayConfigured() ? 'razorpay' : 'cod'
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Delivery estimate
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    days: number;
    date: string;
  } | null>(null);

  // Current step
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');

  // ============================================================================
  // AUTH CHECK
  // ============================================================================

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/cart');
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || null);
      setAuthChecked(true);
    };

    checkAuth();
  }, [navigate]);

  // ============================================================================
  // LOAD SAVED ADDRESS
  // ============================================================================

  useEffect(() => {
    const loadAddress = async () => {
      if (!userId) return;

      setAddressLoading(true);
      const address = await getUserAddress(userId);
      setSavedAddress(address);
      setIsEditingAddress(!address);
      setAddressLoading(false);

      if (address?.pincode) {
        const estimate = await getDeliveryEstimate(address.pincode);
        setDeliveryEstimate(estimate);
        if (address) {
          setCurrentStep('payment');
        }
      }
    };

    if (authChecked && userId) {
      loadAddress();
    }
  }, [userId, authChecked]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!userId) return;

    setAddressSaving(true);
    const result = await saveUserAddress(userId, data);
    setAddressSaving(false);

    if (result.success && result.address) {
      setSavedAddress(result.address);
      setIsEditingAddress(false);

      const estimate = await getDeliveryEstimate(data.pincode);
      setDeliveryEstimate(estimate);
      setCurrentStep('payment');
    } else {
      alert(result.message);
    }
  };

  const handlePlaceOrder = async () => {
    if (!savedAddress || !cart || cart.item_count === 0) {
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');

    if (paymentMethod === 'cod') {
      // Place COD order directly
      const result = await placeCodOrder(cart, savedAddress);

      if (result.success && result.order) {
        await refreshCart();
        navigate('/order/success', {
          state: { order: result.order },
          replace: true
        });
      } else {
        setIsProcessing(false);
        setCurrentStep('payment');
        alert(result.error || 'Failed to place order. Please try again.');
      }
    } else if (paymentMethod === 'razorpay') {
      // Initiate Razorpay payment
      await initiateRazorpayPayment({
        cart,
        address: savedAddress,
        userEmail: userEmail || '',
        onSuccess: async (order) => {
          await refreshCart();
          navigate('/order/success', {
            state: { order },
            replace: true
          });
        },
        onFailure: (error) => {
          setIsProcessing(false);
          setCurrentStep('payment');
          alert(error);
        },
        onCancel: () => {
          setIsProcessing(false);
          setCurrentStep('payment');
        },
      });
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (!authChecked || cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // EMPTY CART
  // ============================================================================

  if (!cart || cart.item_count === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <svg
            className="w-24 h-24 text-gray-300 mx-auto mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Your cart is empty</h2>
          <p className="text-text-secondary mb-6">
            Add some products to your cart before checking out.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PROCESSING STATE
  // ============================================================================

  if (currentStep === 'processing') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {paymentMethod === 'razorpay' ? 'Processing Payment...' : 'Placing Your Order...'}
            </h2>
            <p className="text-text-secondary">Please wait, do not close this page.</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <Link to="/cart" className="hover:text-primary">
              Cart
            </Link>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-text-primary font-medium">Checkout</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1: Address */}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  savedAddress ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'
                }`}
              >
                {savedAddress ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <span className={`text-sm font-medium ${currentStep === 'address' ? 'text-primary' : 'text-text-secondary'}`}>
                Address
              </span>
            </div>

            {/* Connector */}
            <div className={`w-16 h-0.5 ${savedAddress ? 'bg-primary' : 'bg-gray-200'}`}></div>

            {/* Step 2: Payment */}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'payment' ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'
                }`}
              >
                2
              </div>
              <span className={`text-sm font-medium ${currentStep === 'payment' ? 'text-primary' : 'text-text-secondary'}`}>
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Delivery Address
                </h2>
              </div>

              {addressLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-text-secondary text-sm">Loading address...</p>
                </div>
              ) : isEditingAddress ? (
                <AddressForm
                  initialData={
                    savedAddress
                      ? {
                          full_name: savedAddress.full_name,
                          phone: savedAddress.phone,
                          address_line1: savedAddress.address_line1,
                          address_line2: savedAddress.address_line2 || '',
                          pincode: savedAddress.pincode,
                          city: savedAddress.city,
                          state: savedAddress.state,
                        }
                      : undefined
                  }
                  onSubmit={handleAddressSubmit}
                  onCancel={savedAddress ? () => setIsEditingAddress(false) : undefined}
                  submitLabel={savedAddress ? 'Update & Continue' : 'Save & Continue'}
                  isLoading={addressSaving}
                />
              ) : savedAddress ? (
                <div>
                  <AddressCard address={savedAddress} onEdit={() => setIsEditingAddress(true)} />
                  {deliveryEstimate && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                          />
                        </svg>
                        <span className="font-medium">Estimated delivery by {deliveryEstimate.date}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Payment Method Section */}
            {savedAddress && !isEditingAddress && (
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Payment Method
                </h2>
                <PaymentMethodSelector
                  selected={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Order Items Section */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Items ({cart.item_count})
              </h2>

              <div className="divide-y divide-border">
                {cart.items.map((item) => (
                  <CheckoutItemRow key={item.id} item={item} />
                ))}
              </div>

              <Link
                to="/cart"
                className="mt-4 inline-flex items-center gap-1 text-primary hover:text-primary-hover text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Modify Cart
              </Link>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Order Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal ({cart.total_quantity} items)</span>
                  <span>₹{cart.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  <span className={cart.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {cart.shipping === 0 ? 'FREE' : `₹${cart.shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-text-secondary">
                  <span>Tax</span>
                  <span>₹{cart.tax.toFixed(2)}</span>
                </div>

                {paymentMethod === 'cod' && (
                  <div className="flex justify-between text-text-secondary">
                    <span>COD Charges</span>
                    <span>₹0.00</span>
                  </div>
                )}

                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between text-lg font-semibold text-text-primary">
                    <span>Total</span>
                    <span>₹{cart.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!savedAddress || isEditingAddress || isProcessing}
                className="w-full mt-6 bg-primary text-white py-3.5 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </>
                ) : paymentMethod === 'razorpay' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>Pay ₹{cart.total.toFixed(2)}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Place Order (COD)</span>
                  </>
                )}
              </button>

              {!savedAddress && (
                <p className="mt-3 text-center text-sm text-text-secondary">
                  Please add delivery address to continue
                </p>
              )}

              {/* Security Badge */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-xs text-text-secondary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Secure checkout{paymentMethod === 'razorpay' ? ' powered by Razorpay' : ''}</span>
                </div>
              </div>

              {/* User Info */}
              {userEmail && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-text-secondary">Logged in as</p>
                  <p className="text-sm font-medium text-text-primary truncate">{userEmail}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-border">
            <svg className="w-8 h-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <p className="font-medium text-text-primary text-sm">Secure Payment</p>
              <p className="text-xs text-text-secondary">256-bit SSL encrypted</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-border">
            <svg className="w-8 h-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
            <div>
              <p className="font-medium text-text-primary text-sm">Fast Delivery</p>
              <p className="text-xs text-text-secondary">3-5 business days</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-border">
            <svg className="w-8 h-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <div>
              <p className="font-medium text-text-primary text-sm">Easy Returns</p>
              <p className="text-xs text-text-secondary">30-day return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-border">
            <svg className="w-8 h-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-text-primary text-sm">24/7 Support</p>
              <p className="text-xs text-text-secondary">Help when you need it</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
