// ============================================================================
// INVOICE SERVICE
// ============================================================================
// Generate and download PDF invoices for orders (with multi-page support)
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
    img.src = '/invoice_logo.jpeg';
  });
};

// ============================================================================
// GENERATE INVOICE PDF (WITH MULTI-PAGE SUPPORT)
// ============================================================================

export const generateInvoicePDF = async (order: OrderWithItems): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPos = 20;
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  const contentWidth = rightMargin - leftMargin;
  const bottomMargin = 20; // Space to leave at bottom before new page
  let currentPage = 1;

  // Column positions for items table
  const col1 = leftMargin + 3;      // S.No
  const col2 = leftMargin + 13;     // Item Description
  const col3 = leftMargin + 80;     // HSN/SAC
  const col4 = leftMargin + 110;    // Qty
  const col5 = leftMargin + 125;    // Rate
  const col6 = leftMargin + 155;    // Amount

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number): boolean => {
    if (yPos + requiredSpace > pageHeight - bottomMargin) {
      return true;
    }
    return false;
  };

  // Helper function to add a new page with header
  const addNewPage = () => {
    doc.addPage();
    currentPage++;
    yPos = 20;

    // Add continuation header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice: ${order.order_number} (Page ${currentPage})`, leftMargin, yPos);
    doc.text('ThreadCart', rightMargin, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 10;
  };

  // Helper function to add table header
  const addTableHeader = () => {
    doc.setFillColor(225, 29, 72);
    doc.rect(leftMargin, yPos - 5, contentWidth, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('S.No', col1, yPos);
    doc.text('Item Description', col2, yPos);
    doc.text('HSN/SAC', col3, yPos);
    doc.text('Qty', col4, yPos);
    doc.text('Rate', col5, yPos);
    doc.text('Amount', col6, yPos);

    doc.setTextColor(0, 0, 0);
    yPos += 10;
  };

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

  // Helper to wrap text within a max width
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  // ============================================================================
  // HEADER WITH LOGO (First page only)
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

  // Get billing address (use shipping if not set)
  const billingAddr = order.billing_address || order.shipping_address;
  const addressColWidth = 80; // Max width for address text wrapping

  // BILL TO Section
  addText('BILL TO:', leftMargin, yPos, { fontSize: 10, fontStyle: 'bold' });
  yPos += 6;

  // Background box for billing
  doc.setFillColor(250, 250, 250);

  // Calculate billing address content
  let billingLines: string[] = [];
  billingLines.push(billingAddr.full_name);
  billingLines = billingLines.concat(wrapText(billingAddr.address_line1, addressColWidth, 9));
  if (billingAddr.address_line2) {
    billingLines = billingLines.concat(wrapText(billingAddr.address_line2, addressColWidth, 9));
  }
  billingLines.push(`${billingAddr.city}, ${billingAddr.state}`);
  billingLines.push(`PIN: ${billingAddr.postal_code}`);
  billingLines.push(`Phone: +91 ${billingAddr.phone}`);
  if (order.gst_number) {
    billingLines.push(`GSTIN: ${order.gst_number}`);
  }

  const billingBoxHeight = billingLines.length * 5 + 6;
  doc.rect(leftMargin, yPos - 3, contentWidth / 2 - 5, billingBoxHeight, 'F');

  // Print billing address
  let billingYPos = yPos;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(billingAddr.full_name, leftMargin + 3, billingYPos);
  billingYPos += 5;

  doc.setFont('helvetica', 'normal');
  const billingAddr1Lines = wrapText(billingAddr.address_line1, addressColWidth, 9);
  billingAddr1Lines.forEach(line => {
    doc.text(line, leftMargin + 3, billingYPos);
    billingYPos += 5;
  });

  if (billingAddr.address_line2) {
    const billingAddr2Lines = wrapText(billingAddr.address_line2, addressColWidth, 9);
    billingAddr2Lines.forEach(line => {
      doc.text(line, leftMargin + 3, billingYPos);
      billingYPos += 5;
    });
  }

  doc.text(`${billingAddr.city}, ${billingAddr.state}`, leftMargin + 3, billingYPos);
  billingYPos += 5;
  doc.text(`PIN: ${billingAddr.postal_code}`, leftMargin + 3, billingYPos);
  billingYPos += 5;
  doc.text(`Phone: +91 ${billingAddr.phone}`, leftMargin + 3, billingYPos);
  billingYPos += 5;

  if (order.gst_number) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(`GSTIN: ${order.gst_number}`, leftMargin + 3, billingYPos);
    doc.setTextColor(0, 0, 0);
    billingYPos += 5;
  }

  // SHIP TO Section (on the right side, same row as billing)
  const shipToX = leftMargin + contentWidth / 2 + 5;
  let shipYPos = yPos - 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('SHIP TO:', shipToX, shipYPos);
  shipYPos += 6;

  // Calculate shipping address content
  let shippingLines: string[] = [];
  shippingLines.push(order.shipping_address.full_name);
  shippingLines = shippingLines.concat(wrapText(order.shipping_address.address_line1, addressColWidth, 9));
  if (order.shipping_address.address_line2) {
    shippingLines = shippingLines.concat(wrapText(order.shipping_address.address_line2, addressColWidth, 9));
  }
  shippingLines.push(`${order.shipping_address.city}, ${order.shipping_address.state}`);
  shippingLines.push(`PIN: ${order.shipping_address.postal_code}`);
  shippingLines.push(`Phone: +91 ${order.shipping_address.phone}`);

  const shippingBoxHeight = shippingLines.length * 5 + 6;
  doc.setFillColor(250, 250, 250);
  doc.rect(shipToX, shipYPos - 3, contentWidth / 2 - 5, shippingBoxHeight, 'F');

  // Print shipping address
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(order.shipping_address.full_name, shipToX + 3, shipYPos);
  shipYPos += 5;

  doc.setFont('helvetica', 'normal');
  const shipAddr1Lines = wrapText(order.shipping_address.address_line1, addressColWidth, 9);
  shipAddr1Lines.forEach(line => {
    doc.text(line, shipToX + 3, shipYPos);
    shipYPos += 5;
  });

  if (order.shipping_address.address_line2) {
    const shipAddr2Lines = wrapText(order.shipping_address.address_line2, addressColWidth, 9);
    shipAddr2Lines.forEach(line => {
      doc.text(line, shipToX + 3, shipYPos);
      shipYPos += 5;
    });
  }

  doc.text(`${order.shipping_address.city}, ${order.shipping_address.state}`, shipToX + 3, shipYPos);
  shipYPos += 5;
  doc.text(`PIN: ${order.shipping_address.postal_code}`, shipToX + 3, shipYPos);
  shipYPos += 5;
  doc.text(`Phone: +91 ${order.shipping_address.phone}`, shipToX + 3, shipYPos);

  // Move yPos to after the taller address box
  yPos = Math.max(billingYPos, shipYPos) + 10;

  // ============================================================================
  // ITEMS TABLE WITH HSN/SAC (WITH PAGINATION)
  // ============================================================================

  // Add table header
  addTableHeader();

  // Table Items with pagination
  let serialNo = 1;
  for (let index = 0; index < order.items.length; index++) {
    const item = order.items[index];
    const itemTotal = item.quantity * item.price_at_purchase;
    const productName = item.product?.name || 'Product';
    const hsnSac = item.product?.['HSN/SAC'] || '-';

    // Calculate space needed for this item
    const itemHeight = item.product?.part_number ? 13 : 8;

    // Check if we need a new page
    if (checkNewPage(itemHeight + 5)) {
      addNewPage();
      addTableHeader();
    }

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(leftMargin, yPos - 4, contentWidth, 12, 'F');
    }

    // Truncate long product names
    const maxNameLength = 35;
    const displayName = productName.length > maxNameLength
      ? productName.substring(0, maxNameLength) + '...'
      : productName;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text(serialNo.toString(), col1, yPos);
    doc.text(displayName, col2, yPos);
    doc.text(hsnSac, col3, yPos);
    doc.text(item.quantity.toString(), col4, yPos);
    doc.text(formatCurrency(item.price_at_purchase), col5, yPos);
    doc.text(formatCurrency(itemTotal), col6, yPos);

    yPos += 6;

    // Part number if available
    if (item.product?.part_number) {
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(7);
      doc.text(`Part #: ${item.product.part_number}`, col2, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    yPos += 2;
    serialNo++;
  }

  yPos += 5;
  drawLine(yPos);
  yPos += 10;

  // ============================================================================
  // TOTALS WITH SGST & CGST (Split GST)
  // ============================================================================

  // Check if we need a new page for totals section (need about 80px)
  if (checkNewPage(80)) {
    addNewPage();
  }

  // Use values from order (prices in DB are EXCLUSIVE of GST)
  const subtotalAmount = order.total_amount;
  const sgstRate = TAX.GST_RATE / 2; // 9%
  const cgstRate = TAX.GST_RATE / 2; // 9%
  const sgstAmount = subtotalAmount * sgstRate;
  const cgstAmount = subtotalAmount * cgstRate;
  const shippingCharge = order.shipping_charge || 0;

  const totalsLabelX = rightMargin - 70;
  const totalsValueX = rightMargin - 3;

  // Subtotal (Base amount before tax)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', totalsLabelX, yPos, { align: 'right' });
  doc.text(formatCurrency(subtotalAmount), totalsValueX, yPos, { align: 'right' });
  yPos += 7;

  // SGST (9%)
  doc.text(`SGST (${TAX.GST_PERCENTAGE / 2}%):`, totalsLabelX, yPos, { align: 'right' });
  doc.text(formatCurrency(sgstAmount), totalsValueX, yPos, { align: 'right' });
  yPos += 7;

  // CGST (9%)
  doc.text(`CGST (${TAX.GST_PERCENTAGE / 2}%):`, totalsLabelX, yPos, { align: 'right' });
  doc.text(formatCurrency(cgstAmount), totalsValueX, yPos, { align: 'right' });
  yPos += 7;

  // Shipping
  doc.text('Shipping:', totalsLabelX, yPos, { align: 'right' });
  doc.text(shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge), totalsValueX, yPos, { align: 'right' });
  yPos += 10;

  // Total Box
  doc.setFillColor(225, 29, 72);
  doc.rect(rightMargin - 90, yPos - 6, 90, 14, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GRAND TOTAL:', rightMargin - 85, yPos + 2);
  doc.text(formatCurrency(order.grand_total), totalsValueX, yPos + 2, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  yPos += 25;

  // ============================================================================
  // PAYMENT INFO
  // ============================================================================

  // Check if we need a new page for payment info
  if (checkNewPage(25)) {
    addNewPage();
  }

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

  // Check if we need a new page for footer
  if (checkNewPage(40)) {
    addNewPage();
  }

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

  // Add page numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

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
