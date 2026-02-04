// ============================================================================
// ORDER HISTORY PAGE
// ============================================================================
// Displays all orders for the logged-in user
// ============================================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { getUserOrders } from '../../services/order.service';
import { ORDER_STATUS_CONFIG } from '../../types/order.types';
import type { OrderWithItems } from '../../types/order.types';
import { getDisplayUrl, handleImageError } from '../../utils/imageUtils';

export const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      try {
        const userOrders = await getUserOrders(session.user.id);
        setOrders(userOrders);
      } catch (err) {
        setError('Failed to load orders');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-primary hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">My Orders</h1>
          <p className="text-text-secondary mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>

        {orders.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-xl border border-border p-12 text-center">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto mb-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-xl font-semibold text-text-primary mb-2">No orders yet</h2>
            <p className="text-text-secondary mb-6">
              When you place orders, they will appear here.
            </p>
            <Link
              to="/"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          // Orders List
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status];
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-white rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-text-secondary">Order Number</p>
                        <p className="font-semibold text-text-primary">{order.order_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">Order Date</p>
                        <p className="font-medium text-text-primary">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id}
                            className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 overflow-hidden"
                            style={{ zIndex: 3 - idx }}
                          >
                            {item.product?.image_url?.[0] && (
                              <img
                                src={getDisplayUrl(item.product.image_url[0])}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            )}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-text-secondary">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">
                          {order.items[0]?.product?.name || 'Product'}
                          {order.items.length > 1 && ` and ${order.items.length - 1} more`}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{statusConfig.icon}</span>
                        <span className={`font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-text-primary">
                          ₹{order.grand_total.toFixed(2)}
                        </span>
                        <svg
                          className="w-5 h-5 text-text-secondary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
