// ============================================================================
// INVOICE EMAIL SERVICE
// ============================================================================
// Sends invoice emails to customers using Web3Forms (free, unlimited)
// Includes invoice PDF download link via Supabase Storage
// ============================================================================

import type { OrderWithItems } from '../types/order.types';
import { TAX, COMPANY, CONTACT } from '../utils/constants';
import { supabase } from '../utils/supabase';
import { generateInvoicePDF } from './invoice.service';

// ============================================================================
// WEB3FORMS CONFIGURATION
// ============================================================================

const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

// Signed URL expiry (30 days in seconds)
const SIGNED_URL_EXPIRY = 30 * 24 * 60 * 60;

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
// UPLOAD INVOICE PDF TO STORAGE
// ============================================================================

const uploadInvoicePDF = async (
  order: OrderWithItems
): Promise<string | null> => {
  try {
    // Generate the PDF
    const pdfDoc = await generateInvoicePDF(order);
    const pdfBlob = pdfDoc.output('blob');

    // Create file path: invoices/{user_id}/{order_number}.pdf
    const filePath = `${order.user_id}/${order.order_number}.pdf`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading invoice to storage:', uploadError);
      return null;
    }

    // Get signed URL (valid for 30 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error creating signed URL:', signedUrlError);
      return null;
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error in uploadInvoicePDF:', error);
    return null;
  }
};

// ============================================================================
// SEND INVOICE EMAIL (Using Web3Forms)
// ============================================================================

export interface InvoiceEmailResult {
  success: boolean;
  error?: string;
}

export const sendInvoiceEmail = async (
  order: OrderWithItems,
  recipientEmail: string
): Promise<InvoiceEmailResult> => {
  // Check if Web3Forms is configured
  if (!WEB3FORMS_ACCESS_KEY) {
    console.warn('Web3Forms not configured.');
    return { success: false, error: 'Email service not configured. Please try downloading the invoice instead.' };
  }

  try {
    // Upload invoice PDF and get download link
    const invoiceUrl = await uploadInvoicePDF(order);

    // Calculate amounts
    const subtotal = order.total_amount;
    const gstAmount = subtotal * TAX.GST_RATE;
    const shippingCharge = order.shipping_charge || 0;

    // Build email body
    const emailBody = `
INVOICE - ${COMPANY.NAME}
================================

Order Number: ${order.order_number}
Order Date: ${formatDate(order.created_at)}

${invoiceUrl ? `DOWNLOAD INVOICE PDF: ${invoiceUrl}` : ''}

CUSTOMER DETAILS:
-----------------
Name: ${order.shipping_address.full_name}
Phone: +91 ${order.shipping_address.phone}
${order.gst_number ? `GST Number: ${order.gst_number}` : ''}

SHIPPING ADDRESS:
-----------------
${formatAddress(order.shipping_address)}

ORDER ITEMS:
------------
${formatItemsList(order)}

ORDER SUMMARY:
--------------
Subtotal: ${formatCurrency(subtotal)}
GST (${TAX.GST_PERCENTAGE}%): ${formatCurrency(gstAmount)}
Shipping: ${shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge)}
--------------
GRAND TOTAL: ${formatCurrency(order.grand_total)}

PAYMENT:
--------
Method: ${order.payment_method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
Status: ${order.payment_status === 'completed' ? 'Paid' : order.payment_status === 'refund_initiated' ? 'Refund Initiated' : order.payment_status === 'refunded' ? 'Refunded' : order.payment_status === 'failed' ? 'Failed' : 'Pending'}
${order.payment_id ? `Transaction ID: ${order.payment_id}` : ''}

---
${COMPANY.NAME}
GSTIN: ${COMPANY.GSTIN}
Email: ${CONTACT.EMAIL}
Phone: ${CONTACT.PHONE}

Thank you for your business!
    `.trim();

    // Prepare form data for Web3Forms
    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `Your Invoice from ${COMPANY.NAME} - Order #${order.order_number}`);
    formData.append('from_name', COMPANY.NAME);
    formData.append('to_email', recipientEmail);
    formData.append('message', emailBody);
    formData.append('Order Number', order.order_number);
    formData.append('Grand Total', formatCurrency(order.grand_total));

    if (invoiceUrl) {
      formData.append('Invoice PDF Link', invoiceUrl);
    }

    // Send via Web3Forms
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Invoice email sent to: ${recipientEmail}`);
      return { success: true };
    } else {
      console.error('Web3Forms error:', result);
      return {
        success: false,
        error: result.message || 'Failed to send email. Please try downloading the invoice instead.',
      };
    }
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return {
      success: false,
      error: 'Failed to send email. Please try downloading the invoice instead.',
    };
  }
};

// ============================================================================
// CHECK IF INVOICE EMAIL IS CONFIGURED
// ============================================================================

export const isInvoiceEmailConfigured = (): boolean => {
  return Boolean(WEB3FORMS_ACCESS_KEY);
};
