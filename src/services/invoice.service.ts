// ============================================================================
// INVOICE SERVICE
// ============================================================================
// Generate and download PDF invoices for orders
// ============================================================================

import jsPDF from 'jspdf';
import type { OrderWithItems } from '../types/order.types';
import { CONTACT } from '../utils/constants';

// ============================================================================
// GENERATE INVOICE PDF
// ============================================================================

export const generateInvoicePDF = (order: OrderWithItems): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  let yPos = 20;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    align?: 'left' | 'center' | 'right';
  }) => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left' } = options || {};
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);

    let xPos = x;
    if (align === 'center') {
      xPos = pageWidth / 2;
    } else if (align === 'right') {
      xPos = rightMargin;
    }

    doc.text(text, xPos, y, { align });
  };

  // Helper to draw a line
  const drawLine = (y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, y, rightMargin, y);
  };

  // ============================================================================
  // HEADER
  // ============================================================================

  // Company Logo/Name
  addText('ThreadCart', leftMargin, yPos, { fontSize: 24, fontStyle: 'bold' });
  yPos += 8;
  addText('Premium Fasteners & Hardware', leftMargin, yPos, { fontSize: 10 });

  // Invoice Title
  addText('INVOICE', rightMargin, 20, { fontSize: 20, fontStyle: 'bold', align: 'right' });

  yPos += 15;
  drawLine(yPos);
  yPos += 10;

  // ============================================================================
  // ORDER INFO
  // ============================================================================

  // Left Column - Invoice Details
  addText('Invoice Number:', leftMargin, yPos, { fontStyle: 'bold' });
  addText(order.order_number, leftMargin + 35, yPos);

  // Right Column - Date
  addText('Date:', rightMargin - 50, yPos, { fontStyle: 'bold' });
  addText(
    new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    rightMargin,
    yPos,
    { align: 'right' }
  );

  yPos += 7;

  // Payment Status (left side)
  addText('Payment Status:', leftMargin, yPos, { fontStyle: 'bold' });
  addText(
    order.payment_status === 'completed' ? 'PAID' : 'PENDING (COD)',
    leftMargin + 38,
    yPos
  );

  // Payment Method (right side - with more spacing)
  addText('Payment:', pageWidth / 2 + 20, yPos, { fontStyle: 'bold' });
  addText(
    order.payment_method === 'razorpay' ? 'Online' : 'COD',
    pageWidth / 2 + 45,
    yPos
  );

  yPos += 15;
  drawLine(yPos);
  yPos += 10;

  // ============================================================================
  // BILLING & SHIPPING ADDRESS
  // ============================================================================

  // Shipping Address
  addText('Ship To:', leftMargin, yPos, { fontSize: 11, fontStyle: 'bold' });
  yPos += 6;
  addText(order.shipping_address.full_name, leftMargin, yPos);
  yPos += 5;
  addText(order.shipping_address.address_line1, leftMargin, yPos);
  yPos += 5;
  if (order.shipping_address.address_line2) {
    addText(order.shipping_address.address_line2, leftMargin, yPos);
    yPos += 5;
  }
  addText(
    `${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.postal_code}`,
    leftMargin,
    yPos
  );
  yPos += 5;
  addText(`Phone: +91 ${order.shipping_address.phone}`, leftMargin, yPos);

  yPos += 15;
  drawLine(yPos);
  yPos += 10;

  // ============================================================================
  // ITEMS TABLE
  // ============================================================================

  // Table column positions (adjusted for better spacing)
  const colItem = leftMargin + 2;
  const colQty = leftMargin + 95;
  const colPrice = leftMargin + 115;
  const colTotal = leftMargin + 150;

  // Table Header
  doc.setFillColor(245, 245, 245);
  doc.rect(leftMargin, yPos - 5, pageWidth - 40, 10, 'F');

  addText('Item', colItem, yPos, { fontStyle: 'bold' });
  addText('Qty', colQty, yPos, { fontStyle: 'bold' });
  addText('Price', colPrice, yPos, { fontStyle: 'bold' });
  addText('Total', colTotal, yPos, { fontStyle: 'bold' });

  yPos += 10;

  // Table Items
  order.items.forEach((item) => {
    const itemTotal = item.quantity * item.price_at_purchase;
    const productName = item.product?.name || 'Product';

    // Truncate long product names (shorter to fit table)
    const maxNameLength = 40;
    const displayName = productName.length > maxNameLength
      ? productName.substring(0, maxNameLength) + '...'
      : productName;

    addText(displayName, colItem, yPos);
    addText(item.quantity.toString(), colQty, yPos);
    addText(`₹${item.price_at_purchase.toFixed(2)}`, colPrice, yPos);
    addText(`₹${itemTotal.toFixed(2)}`, colTotal, yPos);

    yPos += 7;

    // Part number if available
    if (item.product?.part_number) {
      doc.setTextColor(128, 128, 128);
      addText(`Part #: ${item.product.part_number}`, leftMargin + 2, yPos, { fontSize: 8 });
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    yPos += 3;
  });

  yPos += 5;
  drawLine(yPos);
  yPos += 10;

  // ============================================================================
  // TOTALS
  // ============================================================================

  const totalsX = pageWidth - 80;

  addText('Subtotal:', totalsX, yPos);
  addText(`₹${order.total_amount.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
  yPos += 7;

  addText('Shipping:', totalsX, yPos);
  addText('FREE', rightMargin - 2, yPos, { align: 'right' });
  yPos += 7;

  addText('Tax:', totalsX, yPos);
  addText('₹0.00', rightMargin - 2, yPos, { align: 'right' });
  yPos += 10;

  // Total
  doc.setFillColor(225, 29, 72); // Primary color
  doc.rect(totalsX - 10, yPos - 5, rightMargin - totalsX + 12, 12, 'F');
  doc.setTextColor(255, 255, 255);
  addText('TOTAL:', totalsX, yPos + 2, { fontStyle: 'bold', fontSize: 11 });
  addText(`₹${order.total_amount.toFixed(2)}`, rightMargin - 2, yPos + 2, {
    fontStyle: 'bold',
    fontSize: 11,
    align: 'right'
  });
  doc.setTextColor(0, 0, 0);

  yPos += 25;

  // ============================================================================
  // FOOTER
  // ============================================================================

  drawLine(yPos);
  yPos += 10;

  doc.setTextColor(128, 128, 128);
  addText('Thank you for shopping with ThreadCart!', pageWidth / 2, yPos, {
    align: 'center',
    fontSize: 10
  });
  yPos += 6;
  addText(`For support, contact: ${CONTACT.EMAIL}`, pageWidth / 2, yPos, {
    align: 'center',
    fontSize: 9
  });

  // Transaction ID if available
  if (order.payment_id) {
    yPos += 10;
    addText(`Transaction ID: ${order.payment_id}`, pageWidth / 2, yPos, {
      align: 'center',
      fontSize: 8
    });
  }

  doc.setTextColor(0, 0, 0);

  return doc;
};

// ============================================================================
// DOWNLOAD INVOICE
// ============================================================================

export const downloadInvoice = (order: OrderWithItems): void => {
  const doc = generateInvoicePDF(order);
  doc.save(`ThreadCart-Invoice-${order.order_number}.pdf`);
};

// ============================================================================
// GET INVOICE AS BLOB (for email attachment)
// ============================================================================

export const getInvoiceBlob = (order: OrderWithItems): Blob => {
  const doc = generateInvoicePDF(order);
  return doc.output('blob');
};

// ============================================================================
// GET INVOICE AS BASE64 (for email attachment)
// ============================================================================

export const getInvoiceBase64 = (order: OrderWithItems): string => {
  const doc = generateInvoicePDF(order);
  return doc.output('datauristring');
};
