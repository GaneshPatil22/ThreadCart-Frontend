// ============================================================================
// ORDER DETAILS PAGE
// ============================================================================
// Full order details with tracking, invoice download, and email options
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { getOrderById } from '../../services/order.service';
import { downloadInvoice } from '../../services/invoice.service';
import { OrderStatusTimeline } from '../../components/order/OrderStatusTimeline';
import { EmailInvoiceModal } from '../../components/order/EmailInvoiceModal';
import { ORDER_STATUS_CONFIG } from '../../types/order.types';
import type { OrderWithItems } from '../../types/order.types';
import { convertGoogleDriveUrl, handleImageError } from '../../utils/imageUtils';
import { CONTACT, TAX } from '../../utils/constants';

export const OrderDetailsPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      setUserEmail(session.user.email || '');

      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        const orderData = await getOrderById(orderId);

        // Check if order exists and belongs to this user
        if (!orderData || orderData.user_id !== session.user.id) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        setOrder(orderData);
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, navigate]);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    if (order && !downloading) {
      setDownloading(true);
      try {
        await downloadInvoice(order);
      } catch (err) {
        console.error('Failed to download invoice:', err);
      } finally {
        setDownloading(false);
      }
    }
  };

  if (loading) {
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

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Order not found'}</p>
          <Link
            to="/orders"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Orders</span>
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                Order #{order.order_number}
              </h1>
              <p className="text-text-secondary">
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{statusConfig.icon}</span>
              <span className={`text-lg font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-border">
                      {item.product?.image_url?.[0] ? (
                        <img
                          src={convertGoogleDriveUrl(item.product.image_url[0])}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary">
                        {item.product?.name || 'Product'}
                      </h3>
                      {item.product?.part_number && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          Part #: {item.product.part_number}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-text-secondary">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-semibold text-text-primary">
                          ₹{(item.quantity * item.price_at_purchase).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        ₹{item.price_at_purchase.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Tracking */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-6">
                Order Tracking
              </h2>
              <OrderStatusTimeline order={order} />
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Order Summary
              </h2>
              {(() => {
                // Use values from order (prices in DB are EXCLUSIVE of GST)
                const subtotalAmount = order.total_amount;
                const gstAmount = subtotalAmount * TAX.GST_RATE;
                const shippingCharge = order.shipping_charge || 0;

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal</span>
                      <span>₹{subtotalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>GST ({TAX.GST_PERCENTAGE}%)</span>
                      <span>₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Shipping</span>
                      {shippingCharge === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        <span>₹{shippingCharge.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-text-primary">Total</span>
                        <span className="font-bold text-xl text-accent">
                          ₹{order.grand_total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Payment Information
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Method</span>
                  <span className="font-medium text-text-primary">
                    {order.payment_method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Status</span>
                  <span className={`font-medium ${
                    order.payment_status === 'completed'
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }`}>
                    {order.payment_status === 'completed' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.payment_id && (
                  <div className="pt-2 border-t border-border mt-2">
                    <p className="text-xs text-text-secondary">Transaction ID</p>
                    <p className="text-sm font-mono text-text-primary break-all">
                      {order.payment_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Shipping Address
              </h2>
              <div className="text-text-secondary">
                <p className="font-medium text-text-primary">
                  {order.shipping_address.full_name}
                </p>
                <p className="mt-1">{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                </p>
                <p className="mt-2">
                  <span className="text-text-secondary">Phone: </span>
                  <span className="text-text-primary">+91 {order.shipping_address.phone}</span>
                </p>
                {order.gst_number && (
                  <p className="mt-2">
                    <span className="text-text-secondary">GST Number: </span>
                    <span className="text-text-primary font-mono">{order.gst_number}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Invoice Actions */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Invoice
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download Invoice</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="w-full flex items-center justify-center gap-2 border border-border text-text-primary px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email Invoice</span>
                </button>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Need Help?
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                If you have questions about your order, please contact our support team.
              </p>
              <a
                href={`mailto:${CONTACT.EMAIL}`}
                className="text-primary hover:underline text-sm font-medium"
              >
                {CONTACT.EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Email Invoice Modal */}
      <EmailInvoiceModal
        order={order}
        defaultEmail={userEmail}
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
};
