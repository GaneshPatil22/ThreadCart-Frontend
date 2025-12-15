// ============================================================================
// ORDER NOTIFICATION SERVICE
// ============================================================================
// Sends email notifications to admin when new orders are placed
// Uses EmailJS (already configured in project)
// ============================================================================

import emailjs from '@emailjs/browser';
import type { OrderWithItems } from '../types/order.types';
import { TAX } from '../utils/constants';

// ============================================================================
// EMAILJS CONFIGURATION
// ============================================================================

const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  orderTemplateId: import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID || '',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

// Admin emails (comma-separated in env variable)
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_NOTIFICATION_EMAILS || '').split(',').filter(Boolean);

// ============================================================================
// FORMAT HELPERS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAddress = (address: OrderWithItems['shipping_address']): string => {
  const parts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
};

const formatItemsList = (order: OrderWithItems): string => {
  return order.items
    .map((item, index) => {
      const productName = item.product?.name || 'Product unavailable';
      const quantity = item.quantity;
      const price = formatCurrency(item.price_at_purchase);
      const total = formatCurrency(item.quantity * item.price_at_purchase);
      return `${index + 1}. ${productName}\n   Qty: ${quantity} x ${price} = ${total}`;
    })
    .join('\n\n');
};

// ============================================================================
// SEND ORDER NOTIFICATION TO ADMINS
// ============================================================================

export interface NotificationResult {
  success: boolean;
  sentTo: string[];
  failed: string[];
  error?: string;
}

export const sendOrderNotificationToAdmins = async (
  order: OrderWithItems
): Promise<NotificationResult> => {
  const result: NotificationResult = {
    success: false,
    sentTo: [],
    failed: [],
  };

  // Check if EmailJS is configured
  if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.orderTemplateId || !EMAILJS_CONFIG.publicKey) {
    console.warn('EmailJS order notification not configured. Skipping email notification.');
    result.error = 'EmailJS not configured';
    return result;
  }

  // Check if admin emails are configured
  if (ADMIN_EMAILS.length === 0) {
    console.warn('No admin notification emails configured. Skipping email notification.');
    result.error = 'No admin emails configured';
    return result;
  }

  // Calculate GST (grand_total = subtotal + gst + shipping)
  const shippingCharge = order.shipping_charge || 0;
  const gstAmount = order.total_amount * TAX.GST_RATE;

  // Prepare email template data
  const templateParams = {
    order_number: order.order_number,
    customer_name: order.shipping_address.full_name,
    customer_phone: order.shipping_address.phone,
    customer_gst: order.gst_number || 'Not provided',
    shipping_address: formatAddress(order.shipping_address),
    items_list: formatItemsList(order),
    items_count: order.items.length,
    subtotal: formatCurrency(order.total_amount),
    gst: formatCurrency(gstAmount),
    gst_percentage: TAX.GST_PERCENTAGE,
    shipping: shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge),
    shipping_amount: formatCurrency(shippingCharge),
    grand_total: formatCurrency(order.grand_total),
    payment_method: order.payment_method?.toUpperCase() || 'N/A',
    payment_status: order.payment_status,
    order_status: order.status,
    order_date: formatDate(order.created_at),
    // Will be set per recipient
    to_email: '',
  };

  // Send email to each admin
  for (const adminEmail of ADMIN_EMAILS) {
    const email = adminEmail.trim();
    if (!email) continue;

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.orderTemplateId,
        { ...templateParams, to_email: email },
        EMAILJS_CONFIG.publicKey
      );
      result.sentTo.push(email);
    } catch (error) {
      console.error(`Failed to send order notification to ${email}:`, error);
      result.failed.push(email);
    }
  }

  result.success = result.sentTo.length > 0;

  if (result.sentTo.length > 0) {
    console.log(`Order notification sent to: ${result.sentTo.join(', ')}`);
  }
  if (result.failed.length > 0) {
    console.warn(`Order notification failed for: ${result.failed.join(', ')}`);
  }

  return result;
};

// ============================================================================
// CHECK IF NOTIFICATIONS ARE CONFIGURED
// ============================================================================

export const isOrderNotificationConfigured = (): boolean => {
  return Boolean(
    EMAILJS_CONFIG.serviceId &&
    EMAILJS_CONFIG.orderTemplateId &&
    EMAILJS_CONFIG.publicKey &&
    ADMIN_EMAILS.length > 0
  );
};

// ============================================================================
// GET CONFIGURED ADMIN EMAILS (for debugging)
// ============================================================================

export const getConfiguredAdminEmails = (): string[] => {
  return ADMIN_EMAILS;
};
