// ============================================================================
// ORDER SUCCESS PAGE
// ============================================================================
// Displays order confirmation after successful checkout
// ============================================================================

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { OrderWithItems } from '../../types/order.types';
import { ORDER_STATUS_CONFIG } from '../../types/order.types';
import { convertGoogleDriveUrl, handleImageError } from '../../utils/imageUtils';
import { trackPurchase } from '../../utils/analytics';
import { CONTACT, TAX } from '../../utils/constants';

export const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderWithItems | null>(null);

  useEffect(() => {
    // Get order from navigation state
    const orderData = location.state?.order as OrderWithItems | undefined;

    if (!orderData) {
      // No order data, redirect to home
      navigate('/', { replace: true });
      return;
    }

    setOrder(orderData);

    // Track purchase event with grand total (includes GST and shipping)
    const items = orderData.items.map(item => ({
      id: item.product_id,
      name: item.product?.name || 'Product',
      price: item.price_at_purchase,
      quantity: item.quantity,
    }));
    trackPurchase(orderData.order_number, items, orderData.grand_total);

    // Clear the navigation state to prevent showing same order on refresh
    window.history.replaceState({}, document.title);
  }, [location, navigate]);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const isPaid = order.payment_status === 'completed';
  const isCod = order.payment_method === 'cod';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Success Header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
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

          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {isPaid ? 'Payment Successful!' : 'Order Placed Successfully!'}
          </h1>
          <p className="text-text-secondary">
            {isCod
              ? 'Your order has been placed. Please keep the exact amount ready for delivery.'
              : 'Thank you for your purchase. Your order has been confirmed.'}
          </p>
        </div>

        {/* Order Details Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Order Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Order Number</p>
                  <p className="text-lg font-semibold text-text-primary">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-secondary">Order Date</p>
                  <p className="font-medium text-text-primary">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{statusConfig.icon}</span>
                <div>
                  <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
                  <p className="text-sm text-text-secondary">{statusConfig.description}</p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text-primary mb-3">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Payment Method</p>
                  <p className="font-medium text-text-primary capitalize">
                    {order.payment_method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Payment Status</p>
                  <p
                    className={`font-medium ${
                      isPaid ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {isPaid ? 'Paid' : 'Pending'}
                  </p>
                </div>
                {order.payment_id && (
                  <div className="col-span-2">
                    <p className="text-text-secondary">Transaction ID</p>
                    <p className="font-medium text-text-primary font-mono text-xs">
                      {order.payment_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text-primary mb-3">Delivery Address</h3>
              <div className="text-sm text-text-secondary">
                <p className="font-medium text-text-primary">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p className="mt-1">Phone: +91 {order.shipping_address.phone}</p>
                {order.gst_number && (
                  <p className="mt-1">
                    GST: <span className="font-mono">{order.gst_number}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text-primary mb-3">
                Order Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.image_url?.[0] && (
                        <img
                          src={convertGoogleDriveUrl(item.product.image_url[0])}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary text-sm line-clamp-1">
                        {item.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Qty: {item.quantity} × ₹{item.price_at_purchase.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-text-primary">
                        ₹{(item.quantity * item.price_at_purchase).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="px-6 py-4 bg-gray-50">
              {(() => {
                // Use values from order (prices in DB are exclusive of GST)
                const subtotal = order.total_amount;
                const gstAmount = subtotal * TAX.GST_RATE;
                const shippingCharge = order.shipping_charge || 0;

                return (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>GST ({TAX.GST_PERCENTAGE}%)</span>
                        <span>₹{gstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-text-secondary">
                        <span>Shipping</span>
                        {shippingCharge === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          <span>₹{shippingCharge.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="text-lg font-semibold text-text-primary">Total Amount</span>
                      <span className="text-2xl font-bold text-accent">
                        ₹{order.grand_total.toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()}
              {isCod && (
                <p className="text-sm text-text-secondary mt-2">
                  Please pay this amount in cash when your order is delivered.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Continue Shopping
            </Link>
            <Link
              to={`/orders/${order.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg font-medium text-text-primary hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Order Details
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-secondary">
              Questions about your order?{' '}
              <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
