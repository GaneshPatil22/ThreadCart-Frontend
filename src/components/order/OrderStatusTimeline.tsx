// ============================================================================
// ORDER STATUS TIMELINE
// ============================================================================
// Visual timeline showing order progress through different stages
// ============================================================================

import { ORDER_STATUS_CONFIG, ORDER_STATUS_FLOW } from '../../types/order.types';
import type { OrderStatus } from '../../types/database.types';
import type { Order } from '../../types/database.types';

interface OrderStatusTimelineProps {
  order: Order;
}

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: string;
  timestamp: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
}

export const OrderStatusTimeline = ({ order }: OrderStatusTimelineProps) => {
  const currentStatusLevel = ORDER_STATUS_FLOW[order.status];
  const isCancelled = order.status === 'cancelled';

  // Define the timeline steps (excluding cancelled which is shown separately)
  const steps: TimelineStep[] = [
    {
      status: 'pending',
      label: 'Order Placed',
      icon: '📋',
      timestamp: order.created_at,
      isCompleted: currentStatusLevel >= ORDER_STATUS_FLOW.pending,
      isCurrent: order.status === 'pending',
    },
    {
      status: 'confirmed',
      label: 'Confirmed',
      icon: '✓',
      timestamp: order.confirmed_at,
      isCompleted: currentStatusLevel >= ORDER_STATUS_FLOW.confirmed,
      isCurrent: order.status === 'confirmed',
    },
    {
      status: 'packed',
      label: 'Packed',
      icon: '📦',
      timestamp: order.packed_at,
      isCompleted: currentStatusLevel >= ORDER_STATUS_FLOW.packed,
      isCurrent: order.status === 'packed',
    },
    {
      status: 'shipped',
      label: 'Shipped',
      icon: '🚚',
      timestamp: order.shipped_at,
      isCompleted: currentStatusLevel >= ORDER_STATUS_FLOW.shipped,
      isCurrent: order.status === 'shipped',
    },
    {
      status: 'out_for_delivery',
      label: 'Out for Delivery',
      icon: '🛵',
      timestamp: order.out_for_delivery_at,
      isCompleted: currentStatusLevel >= ORDER_STATUS_FLOW.out_for_delivery,
      isCurrent: order.status === 'out_for_delivery',
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: '✅',
      timestamp: order.delivered_at,
      isCompleted: currentStatusLevel >= ORDER_STATUS_FLOW.delivered,
      isCurrent: order.status === 'delivered',
    },
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Cancelled Order View
  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <div>
            <h3 className="font-semibold text-red-700">Order Cancelled</h3>
            <p className="text-sm text-red-600">
              {order.cancelled_at && `Cancelled on ${formatDate(order.cancelled_at)}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const statusConfig = ORDER_STATUS_CONFIG[step.status];

          return (
            <div key={step.status} className="relative flex gap-4">
              {/* Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-full -ml-px ${
                    step.isCompleted ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Icon Circle */}
              <div
                className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.isCompleted
                    ? 'bg-primary text-white'
                    : step.isCurrent
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-lg">{step.icon}</span>
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-8 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-medium ${
                      step.isCompleted || step.isCurrent ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.timestamp && step.isCompleted && (
                    <span className="text-xs text-text-secondary">
                      {formatDate(step.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mt-0.5">
                  {statusConfig.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
