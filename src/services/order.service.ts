// ============================================================================
// ORDER SERVICE (SUPABASE)
// ============================================================================
// Handles all order operations for authenticated users
// SCAFFOLDING: Ready for Phase 7 implementation
// ============================================================================

import { supabase } from '../utils/supabase';
import { TAX } from '../utils/constants';
import type {
  OrderInsert,
  OrderItemInsert,
  OrderStatus,
} from '../types/database.types';
import type {
  CreateOrderParams,
  CreateOrderResult,
  OrderWithItems,
  UpdateOrderStatusParams,
  UpdateOrderStatusResult,
  OrderTracking,
  OrderStatusHistory,
} from '../types/order.types';
import { ORDER_STATUS_FLOW } from '../types/order.types';

// ============================================================================
// CREATE ORDER FROM CART
// ============================================================================

export const createOrderFromCart = async (
  params: CreateOrderParams
): Promise<CreateOrderResult> => {
  try {
    const { user_id, shipping_address, payment_method, shipping_charge, gst_number, cart_items } = params;

    // Calculate total amount (subtotal without GST)
    const total_amount = cart_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate grand_total with GST and shipping
    const gst_amount = total_amount * TAX.GST_RATE;
    const grand_total = total_amount + gst_amount + (shipping_charge || 0);

    // Generate order number using DB function
    const { data: orderNumberData, error: orderNumberError } = await supabase.rpc(
      'generate_order_number'
    );

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      return {
        success: false,
        error: 'Failed to generate order number',
      };
    }

    const order_number = orderNumberData;

    // Create order
    const orderData: OrderInsert = {
      order_number,
      user_id,
      total_amount,
      grand_total,
      shipping_charge: shipping_charge || 0,
      gst_number: gst_number || null,
      status: 'pending',
      payment_method,
      payment_status: 'pending',
      shipping_address,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return {
        success: false,
        error: 'Failed to create order',
      };
    }

    // Create order items
    const orderItems: OrderItemInsert[] = cart_items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // TODO: Rollback order creation
      return {
        success: false,
        error: 'Failed to create order items',
      };
    }

    // Fetch complete order with items
    const orderWithItems = await getOrderById(order.id);

    if (!orderWithItems) {
      return {
        success: false,
        error: 'Failed to fetch created order',
      };
    }

    return {
      success: true,
      order: orderWithItems,
    };
  } catch (error) {
    console.error('Error in createOrderFromCart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================================================
// GET ORDER BY ID
// ============================================================================

export const getOrderById = async (
  order_id: string
): Promise<OrderWithItems | null> => {
  try {
    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return null;
    }

    // Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
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
          sort_number
        )
      `
      )
      .eq('order_id', order_id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return null;
    }

    // Transform to OrderWithItems
    const items = (orderItems || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      created_at: item.created_at,
      product: item.product,
    }));

    return {
      ...order,
      items,
    };
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return null;
  }
};

// ============================================================================
// GET USER ORDERS
// ============================================================================

export const getUserOrders = async (
  user_id: string
): Promise<OrderWithItems[]> => {
  try {
    // Fetch all orders for user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError);
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
          sort_number
        )
      `
      )
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return [];
    }

    // Group items by order_id
    const itemsByOrderId: Record<string, any[]> = {};
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
    console.error('Error in getUserOrders:', error);
    return [];
  }
};

// ============================================================================
// GET ORDER TRACKING INFO
// ============================================================================

export const getOrderTracking = async (
  order_id: string
): Promise<OrderTracking | null> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (error || !order) {
      console.error('Error fetching order:', error);
      return null;
    }

    // Build status history
    const currentStatusLevel = ORDER_STATUS_FLOW[order.status as OrderStatus];

    const history: OrderStatusHistory[] = [
      {
        status: 'pending',
        timestamp: order.created_at,
        is_current: order.status === 'pending',
        is_completed: currentStatusLevel >= ORDER_STATUS_FLOW.pending,
      },
      {
        status: 'confirmed',
        timestamp: order.confirmed_at,
        is_current: order.status === 'confirmed',
        is_completed: currentStatusLevel >= ORDER_STATUS_FLOW.confirmed,
      },
      {
        status: 'packed',
        timestamp: order.packed_at,
        is_current: order.status === 'packed',
        is_completed: currentStatusLevel >= ORDER_STATUS_FLOW.packed,
      },
      {
        status: 'shipped',
        timestamp: order.shipped_at,
        is_current: order.status === 'shipped',
        is_completed: currentStatusLevel >= ORDER_STATUS_FLOW.shipped,
      },
      {
        status: 'out_for_delivery',
        timestamp: order.out_for_delivery_at,
        is_current: order.status === 'out_for_delivery',
        is_completed: currentStatusLevel >= ORDER_STATUS_FLOW.out_for_delivery,
      },
      {
        status: 'delivered',
        timestamp: order.delivered_at,
        is_current: order.status === 'delivered',
        is_completed: currentStatusLevel >= ORDER_STATUS_FLOW.delivered,
      },
    ];

    return {
      order_number: order.order_number,
      current_status: order.status,
      history,
    };
  } catch (error) {
    console.error('Error in getOrderTracking:', error);
    return null;
  }
};

// ============================================================================
// UPDATE ORDER STATUS (Admin Only)
// ============================================================================

export const updateOrderStatus = async (
  params: UpdateOrderStatusParams
): Promise<UpdateOrderStatusResult> => {
  try {
    const { order_id, new_status } = params;

    // Build update object with timestamp
    const updateData: any = {
      status: new_status,
    };

    // Set appropriate timestamp based on status
    const timestamp = new Date().toISOString();
    switch (new_status) {
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

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();

    if (error || !order) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: 'Failed to update order status',
      };
    }

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================================================
// CANCEL ORDER (User)
// ============================================================================

export const cancelOrder = async (
  order_id: string,
  user_id: string
): Promise<UpdateOrderStatusResult> => {
  try {
    // Check if order belongs to user and is cancellable
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Check if order can be cancelled (only pending/confirmed)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return {
        success: false,
        error: 'Order cannot be cancelled at this stage',
      };
    }

    return updateOrderStatus({
      order_id,
      new_status: 'cancelled',
    });
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
