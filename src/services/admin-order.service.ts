// ============================================================================
// ADMIN ORDER SERVICE
// ============================================================================
// Admin-specific order operations for managing orders
// ============================================================================

import { supabase } from '../utils/supabase';
import type { OrderStatus, PaymentStatus } from '../types/database.types';
import type { OrderWithItems, OrderItemWithProduct } from '../types/order.types';

// ============================================================================
// GET ALL ORDERS (Admin)
// ============================================================================

export const getAllOrders = async (): Promise<OrderWithItems[]> => {
  try {
    // Fetch all orders sorted by date (newest first)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Fetch items for all orders
    const orderIds = orders.map((o) => o.id);

    const { data: allOrderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(
        `
        id,
        order_id,
        product_id,
        quantity,
        price_at_purchase,
        created_at,
        product:product_id (
          id,
          name,
          image_url,
          price,
          quantity,
          thread_style,
          thread_size_pitch,
          fastener_length,
          head_height,
          Grade,
          Coating,
          part_number,
          sub_cat_id,
          sort_number,
          Material,
          "HSN/SAC"
        )
      `
      )
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return [];
    }

    // Group items by order_id
    const itemsByOrderId: Record<string, OrderItemWithProduct[]> = {};
    (allOrderItems || []).forEach((item: any) => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
        created_at: item.created_at,
        product: item.product,
      });
    });

    // Combine orders with their items
    const ordersWithItems: OrderWithItems[] = orders.map((order) => ({
      ...order,
      items: itemsByOrderId[order.id] || [],
    }));

    return ordersWithItems;
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    return [];
  }
};

// ============================================================================
// UPDATE ORDER STATUS (Admin)
// ============================================================================

export interface UpdateOrderStatusResult {
  success: boolean;
  error?: string;
}

export const adminUpdateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus
): Promise<UpdateOrderStatusResult> => {
  try {
    // Build update object with timestamp
    const updateData: Record<string, any> = {
      status: newStatus,
    };

    // Set appropriate timestamp based on status
    const timestamp = new Date().toISOString();
    switch (newStatus) {
      case 'confirmed':
        updateData.confirmed_at = timestamp;
        break;
      case 'packed':
        updateData.packed_at = timestamp;
        break;
      case 'shipped':
        updateData.shipped_at = timestamp;
        break;
      case 'out_for_delivery':
        updateData.out_for_delivery_at = timestamp;
        break;
      case 'delivered':
        updateData.delivered_at = timestamp;
        break;
      case 'cancelled':
        updateData.cancelled_at = timestamp;
        break;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in adminUpdateOrderStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================================================
// UPDATE PAYMENT STATUS (Admin)
// ============================================================================

export const adminUpdatePaymentStatus = async (
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<UpdateOrderStatusResult> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in adminUpdatePaymentStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================================================
// UPDATE ORDER NOTES (Admin)
// ============================================================================

export const adminUpdateOrderNotes = async (
  orderId: string,
  notes: string
): Promise<UpdateOrderStatusResult> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ notes: notes || null })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order notes:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in adminUpdateOrderNotes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================================================
// GET ORDER COUNTS BY STATUS (Admin Dashboard)
// ============================================================================

export interface OrderStatusCounts {
  total: number;
  pending: number;
  confirmed: number;
  packed: number;
  shipped: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
}

export const getOrderStatusCounts = (orders: OrderWithItems[]): OrderStatusCounts => {
  const counts: OrderStatusCounts = {
    total: orders.length,
    pending: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders.forEach((order) => {
    const status = order.status as keyof Omit<OrderStatusCounts, 'total'>;
    if (status in counts) {
      counts[status]++;
    }
  });

  return counts;
};

// ============================================================================
// GET PAYMENT STATUS COUNTS (Admin Dashboard)
// ============================================================================

export interface PaymentStatusCounts {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  refunded: number;
}

export const getPaymentStatusCounts = (orders: OrderWithItems[]): PaymentStatusCounts => {
  const counts: PaymentStatusCounts = {
    total: orders.length,
    pending: 0,
    completed: 0,
    failed: 0,
    refunded: 0,
  };

  orders.forEach((order) => {
    const status = order.payment_status as keyof Omit<PaymentStatusCounts, 'total'>;
    if (status in counts) {
      counts[status]++;
    }
  });

  return counts;
};
