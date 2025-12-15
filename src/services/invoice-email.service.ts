// ============================================================================
// INVOICE EMAIL SERVICE
// ============================================================================
// Sends invoice emails to customers using EmailJS
// ============================================================================

import emailjs from '@emailjs/browser';
import type { OrderWithItems } from '../types/order.types';
import { TAX, COMPANY, CONTACT } from '../utils/constants';

// ============================================================================
// EMAILJS CONFIGURATION
// ============================================================================

const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  invoiceTemplateId: import.meta.env.VITE_EMAILJS_INVOICE_TEMPLATE_ID || '',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

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
// SEND INVOICE EMAIL
// ============================================================================

export interface InvoiceEmailResult {
  success: boolean;
  error?: string;
}

export const sendInvoiceEmail = async (
  order: OrderWithItems,
  recipientEmail: string
): Promise<InvoiceEmailResult> => {
  // Check if EmailJS is configured
  if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.invoiceTemplateId || !EMAILJS_CONFIG.publicKey) {
    console.warn('EmailJS invoice template not configured.');
    return { success: false, error: 'Email service not configured. Please try downloading the invoice instead.' };
  }

  // Calculate amounts
  const subtotal = order.total_amount;
  const gstAmount = subtotal * TAX.GST_RATE;
  const shippingCharge = order.shipping_charge || 0;

  // Prepare email template data
  const templateParams = {
    to_email: recipientEmail,
    order_number: order.order_number,
    customer_name: order.shipping_address.full_name,
    customer_phone: order.shipping_address.phone,
    customer_gst: order.gst_number || 'Not provided',
    shipping_address: formatAddress(order.shipping_address),
    items_list: formatItemsList(order),
    items_count: order.items.length,
    subtotal: formatCurrency(subtotal),
    gst: formatCurrency(gstAmount),
    gst_percentage: TAX.GST_PERCENTAGE,
    shipping: shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge),
    grand_total: formatCurrency(order.grand_total),
    payment_method: order.payment_method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery',
    payment_status: order.payment_status === 'completed' ? 'Paid' : 'Pending',
    order_status: order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' '),
    order_date: formatDate(order.created_at),
    company_name: COMPANY.NAME,
    company_gstin: COMPANY.GSTIN,
    company_email: CONTACT.EMAIL,
    company_phone: CONTACT.PHONE,
  };

  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.invoiceTemplateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log(`Invoice email sent to: ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return {
      success: false,
      error: 'Failed to send email. Please try downloading the invoice instead.'
    };
  }
};

// ============================================================================
// CHECK IF INVOICE EMAIL IS CONFIGURED
// ============================================================================

export const isInvoiceEmailConfigured = (): boolean => {
  return Boolean(
    EMAILJS_CONFIG.serviceId &&
    EMAILJS_CONFIG.invoiceTemplateId &&
    EMAILJS_CONFIG.publicKey
  );
};
