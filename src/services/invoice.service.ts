// ============================================================================
// INVOICE SERVICE
// ============================================================================
// Generate and download PDF invoices for orders
// ============================================================================

import jsPDF from 'jspdf';
import type { OrderWithItems } from '../types/order.types';
import { CONTACT, COMPANY, TAX } from '../utils/constants';

// ============================================================================
// LOAD LOGO AS BASE64
// ============================================================================

const loadLogoAsBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = '/logo.jpeg';
  });
};

// ============================================================================
// GENERATE INVOICE PDF
// ============================================================================

export const generateInvoicePDF = async (order: OrderWithItems): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  let yPos = 20;
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  const contentWidth = rightMargin - leftMargin;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    align?: 'left' | 'center' | 'right';
    color?: [number, number, number];
  }) => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', color = [0, 0, 0] } = options || {};
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);

    let xPos = x;
    if (align === 'center') {
      xPos = pageWidth / 2;
    } else if (align === 'right') {
      xPos = rightMargin;
    }

    doc.text(text, xPos, y, { align });
  };

  // Helper to format currency (use Rs. instead of ₹ for PDF compatibility)
  const formatCurrency = (amount: number): string => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  // Helper to draw a line
  const drawLine = (y: number, color: [number, number, number] = [200, 200, 200]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.line(leftMargin, y, rightMargin, y);
  };

  // ============================================================================
  // HEADER WITH LOGO
  // ============================================================================

  // Try to add logo
  try {
    const logoBase64 = await loadLogoAsBase64();
    doc.addImage(logoBase64, 'JPEG', rightMargin - 35, yPos - 5, 35, 35);
  } catch (error) {
    console.warn('Could not load logo for invoice');
  }

  // Company Name & Details (Left side)
  addText('ThreadCart', leftMargin, yPos, { fontSize: 22, fontStyle: 'bold', color: [225, 29, 72] });
  yPos += 7;
  addText('Premium Fasteners & Hardware', leftMargin, yPos, { fontSize: 10, color: [100, 100, 100] });
  yPos += 6;
  addText(`GSTIN: ${COMPANY.GSTIN}`, leftMargin, yPos, { fontSize: 9, color: [80, 80, 80] });
  yPos += 5;
  addText(`UDYAM: ${COMPANY.UDYAM}`, leftMargin, yPos, { fontSize: 9, color: [80, 80, 80] });
  yPos += 5;
  addText(`Phone: ${CONTACT.PHONE}`, leftMargin, yPos, { fontSize: 9, color: [80, 80, 80] });
  yPos += 5;
  addText(`Email: ${CONTACT.EMAIL}`, leftMargin, yPos, { fontSize: 9, color: [80, 80, 80] });

  yPos += 12;
  drawLine(yPos, [225, 29, 72]);
  yPos += 3;
  drawLine(yPos, [225, 29, 72]);
  yPos += 10;

  // ============================================================================
  // INVOICE TITLE & INFO
  // ============================================================================

  // Invoice Title Box
  doc.setFillColor(245, 245, 245);
  doc.rect(leftMargin, yPos - 5, contentWidth, 25, 'F');

  addText('TAX INVOICE', leftMargin + 5, yPos + 3, { fontSize: 16, fontStyle: 'bold' });

  // Invoice details on the right
  const invoiceInfoX = pageWidth / 2 + 10;
  addText('Invoice No:', invoiceInfoX, yPos, { fontSize: 9, fontStyle: 'bold' });
  addText(order.order_number, invoiceInfoX + 25, yPos, { fontSize: 9 });

  addText('Date:', invoiceInfoX, yPos + 7, { fontSize: 9, fontStyle: 'bold' });
  addText(
    new Date(order.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    invoiceInfoX + 25,
    yPos + 7,
    { fontSize: 9 }
  );

  addText('Status:', invoiceInfoX, yPos + 14, { fontSize: 9, fontStyle: 'bold' });
  addText(
    order.payment_status === 'completed' ? 'PAID' : 'PENDING (COD)',
    invoiceInfoX + 25,
    yPos + 14,
    { fontSize: 9, color: order.payment_status === 'completed' ? [22, 163, 74] : [234, 179, 8] }
  );

  yPos += 30;

  // ============================================================================
  // BILLING & SHIPPING ADDRESS
  // ============================================================================

  addText('BILL TO / SHIP TO:', leftMargin, yPos, { fontSize: 10, fontStyle: 'bold' });
  yPos += 7;

  doc.setFillColor(250, 250, 250);
  doc.rect(leftMargin, yPos - 4, contentWidth / 2 - 5, 35, 'F');

  addText(order.shipping_address.full_name, leftMargin + 3, yPos, { fontSize: 10, fontStyle: 'bold' });
  yPos += 5;
  addText(order.shipping_address.address_line1, leftMargin + 3, yPos, { fontSize: 9 });
  yPos += 5;
  if (order.shipping_address.address_line2) {
    addText(order.shipping_address.address_line2, leftMargin + 3, yPos, { fontSize: 9 });
    yPos += 5;
  }
  addText(
    `${order.shipping_address.city}, ${order.shipping_address.state}`,
    leftMargin + 3,
    yPos,
    { fontSize: 9 }
  );
  yPos += 5;
  addText(`PIN: ${order.shipping_address.postal_code}`, leftMargin + 3, yPos, { fontSize: 9 });
  yPos += 5;
  addText(`Phone: +91 ${order.shipping_address.phone}`, leftMargin + 3, yPos, { fontSize: 9 });

  yPos += 15;

  // ============================================================================
  // ITEMS TABLE
  // ============================================================================

  // Table Header
  doc.setFillColor(225, 29, 72);
  doc.rect(leftMargin, yPos - 5, contentWidth, 10, 'F');

  const col1 = leftMargin + 3;      // S.No
  const col2 = leftMargin + 15;     // Item Description
  const col3 = leftMargin + 100;    // Qty
  const col4 = leftMargin + 120;    // Rate
  const col5 = leftMargin + 150;    // Amount

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('S.No', col1, yPos);
  doc.text('Item Description', col2, yPos);
  doc.text('Qty', col3, yPos);
  doc.text('Rate', col4, yPos);
  doc.text('Amount', col5, yPos);

  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // Table Items
  let serialNo = 1;
  order.items.forEach((item, index) => {
    const itemTotal = item.quantity * item.price_at_purchase;
    const productName = item.product?.name || 'Product';

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(leftMargin, yPos - 4, contentWidth, 12, 'F');
    }

    // Truncate long product names
    const maxNameLength = 45;
    const displayName = productName.length > maxNameLength
      ? productName.substring(0, maxNameLength) + '...'
      : productName;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.text(serialNo.toString(), col1, yPos);
    doc.text(displayName, col2, yPos);
    doc.text(item.quantity.toString(), col3, yPos);
    doc.text(formatCurrency(item.price_at_purchase), col4, yPos);
    doc.text(formatCurrency(itemTotal), col5, yPos);

    yPos += 6;

    // Part number if available
    if (item.product?.part_number) {
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(8);
      doc.text(`Part #: ${item.product.part_number}`, col2, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    yPos += 2;
    serialNo++;
  });

  yPos += 5;
  drawLine(yPos);
  yPos += 10;

  // ============================================================================
  // TOTALS WITH GST
  // ============================================================================

  // Calculate GST (prices in DB are EXCLUSIVE of GST, so we add GST on top)
  // Subtotal = sum of item prices, GST = 18% of subtotal, Total = subtotal + GST
  const subtotalAmount = order.items.reduce(
    (sum, item) => sum + item.quantity * item.price_at_purchase,
    0
  );
  const gstAmount = subtotalAmount * TAX.GST_RATE;
  const grandTotal = subtotalAmount + gstAmount;

  const totalsLabelX = rightMargin - 70;
  const totalsValueX = rightMargin - 3;

  // Subtotal (Base amount before tax)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', totalsLabelX, yPos, { align: 'right' });
  doc.text(formatCurrency(subtotalAmount), totalsValueX, yPos, { align: 'right' });
  yPos += 7;

  // GST
  doc.text(`GST (${TAX.GST_PERCENTAGE}%):`, totalsLabelX, yPos, { align: 'right' });
  doc.text(formatCurrency(gstAmount), totalsValueX, yPos, { align: 'right' });
  yPos += 7;

  // Shipping
  doc.text('Shipping:', totalsLabelX, yPos, { align: 'right' });
  doc.text('FREE', totalsValueX, yPos, { align: 'right' });
  yPos += 10;

  // Total Box
  doc.setFillColor(225, 29, 72);
  doc.rect(rightMargin - 90, yPos - 6, 90, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GRAND TOTAL:', rightMargin - 85, yPos + 2);
  doc.text(formatCurrency(grandTotal), totalsValueX, yPos + 2, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  yPos += 25;

  // ============================================================================
  // PAYMENT INFO
  // ============================================================================

  if (order.payment_method === 'razorpay' && order.payment_id) {
    doc.setFillColor(240, 253, 244);
    doc.rect(leftMargin, yPos - 4, contentWidth, 15, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Payment Method: Online (Razorpay)', leftMargin + 3, yPos + 2);
    doc.setTextColor(100, 100, 100);
    doc.text(`Transaction ID: ${order.payment_id}`, leftMargin + 3, yPos + 9);
    doc.setTextColor(0, 0, 0);
    yPos += 20;
  } else {
    doc.setFillColor(254, 252, 232);
    doc.rect(leftMargin, yPos - 4, contentWidth, 10, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Payment Method: Cash on Delivery (COD)', leftMargin + 3, yPos + 2);
    yPos += 15;
  }

  // ============================================================================
  // FOOTER
  // ============================================================================

  drawLine(yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('For queries, contact us at:', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`${CONTACT.EMAIL} | ${CONTACT.PHONE}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(7);
  doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });

  doc.setTextColor(0, 0, 0);

  return doc;
};

// ============================================================================
// DOWNLOAD INVOICE
// ============================================================================

export const downloadInvoice = async (order: OrderWithItems): Promise<void> => {
  const doc = await generateInvoicePDF(order);
  doc.save(`ThreadCart-Invoice-${order.order_number}.pdf`);
};

// ============================================================================
// GET INVOICE AS BLOB (for email attachment)
// ============================================================================

export const getInvoiceBlob = async (order: OrderWithItems): Promise<Blob> => {
  const doc = await generateInvoicePDF(order);
  return doc.output('blob');
};

// ============================================================================
// GET INVOICE AS BASE64 (for email attachment)
// ============================================================================

export const getInvoiceBase64 = async (order: OrderWithItems): Promise<string> => {
  const doc = await generateInvoicePDF(order);
  return doc.output('datauristring');
};
