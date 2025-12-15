# ThreadCart Email Setup Guide

This document contains all the information needed to set up email functionality in ThreadCart.

---

## Environment Variables Required

Add these to your `.env.development` and `.env.production` files:

```env
# EmailJS Configuration (already existing)
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Order Notification Template (for admin notifications when orders are placed)
VITE_EMAILJS_ORDER_TEMPLATE_ID=template_xxx

# Invoice Email Template (for sending invoices to customers)
VITE_EMAILJS_INVOICE_TEMPLATE_ID=template_xxx

# Admin emails for order notifications (comma-separated)
VITE_ADMIN_NOTIFICATION_EMAILS=email1@example.com,email2@example.com
```

---

## EmailJS Templates

### 1. Order Notification Template (Admin)

**Template ID:** `VITE_EMAILJS_ORDER_TEMPLATE_ID`

**Purpose:** Sends notification to admin emails when a new order is placed.

**Template Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Admin email recipient | admin@example.com |
| `{{order_number}}` | Order number | TC1234567890 |
| `{{customer_name}}` | Customer's full name | John Doe |
| `{{customer_phone}}` | Customer's phone | 9876543210 |
| `{{customer_gst}}` | Customer GST number | 22AAAAA0000A1Z5 or "Not provided" |
| `{{shipping_address}}` | Full formatted address | 123 Street, City, State, 400001, India |
| `{{items_list}}` | Formatted list of items | 1. Product Name\n   Qty: 2 x ₹100.00 = ₹200.00 |
| `{{items_count}}` | Number of items | 3 |
| `{{subtotal}}` | Subtotal amount | ₹1,000.00 |
| `{{gst}}` | GST amount | ₹180.00 |
| `{{gst_percentage}}` | GST percentage | 18 |
| `{{shipping}}` | Shipping charge | FREE or ₹500.00 |
| `{{shipping_amount}}` | Shipping amount (always numeric) | ₹0.00 or ₹500.00 |
| `{{grand_total}}` | Grand total | ₹1,180.00 |
| `{{payment_method}}` | Payment method | COD or RAZORPAY |
| `{{payment_status}}` | Payment status | pending or completed |
| `{{order_status}}` | Order status | pending |
| `{{order_date}}` | Formatted order date | December 16, 2024, 10:30 AM |

**Sample Template:**

```
Subject: New Order #{{order_number}} - ThreadCart

New Order Received!

Order Number: {{order_number}}
Date: {{order_date}}

Customer Details:
- Name: {{customer_name}}
- Phone: {{customer_phone}}
- GST: {{customer_gst}}

Shipping Address:
{{shipping_address}}

Order Items ({{items_count}} items):
{{items_list}}

Order Summary:
- Subtotal: {{subtotal}}
- GST ({{gst_percentage}}%): {{gst}}
- Shipping: {{shipping}}
- Grand Total: {{grand_total}}

Payment:
- Method: {{payment_method}}
- Status: {{payment_status}}

Order Status: {{order_status}}
```

---

### 2. Invoice Email Template (Customer)

**Template ID:** `VITE_EMAILJS_INVOICE_TEMPLATE_ID`

**Purpose:** Sends invoice details to customers from the Order Details page.

**Template Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Customer email recipient | customer@example.com |
| `{{order_number}}` | Order number | TC1234567890 |
| `{{customer_name}}` | Customer's full name | John Doe |
| `{{customer_phone}}` | Customer's phone | 9876543210 |
| `{{customer_gst}}` | Customer GST number | 22AAAAA0000A1Z5 or "Not provided" |
| `{{shipping_address}}` | Full formatted address | 123 Street, City, State, 400001, India |
| `{{items_list}}` | Formatted list of items | 1. Product Name\n   Qty: 2 x ₹100.00 = ₹200.00 |
| `{{items_count}}` | Number of items | 3 |
| `{{subtotal}}` | Subtotal amount | ₹1,000.00 |
| `{{gst}}` | GST amount | ₹180.00 |
| `{{gst_percentage}}` | GST percentage | 18 |
| `{{shipping}}` | Shipping charge | FREE or ₹500.00 |
| `{{grand_total}}` | Grand total | ₹1,180.00 |
| `{{payment_method}}` | Payment method | Online Payment or Cash on Delivery |
| `{{payment_status}}` | Payment status | Paid or Pending |
| `{{order_status}}` | Order status (capitalized) | Pending, Confirmed, Shipped, etc. |
| `{{order_date}}` | Formatted order date | December 16, 2024, 10:30 AM |
| `{{company_name}}` | Company name | ThreadCart |
| `{{company_gstin}}` | Company GSTIN | Your company GSTIN |
| `{{company_email}}` | Company email | info.threadcart@gmail.com |
| `{{company_phone}}` | Company phone | Your phone number |

**Sample Template:**

```
Subject: Invoice for Order #{{order_number}} - ThreadCart

Dear {{customer_name}},

Thank you for your order! Here are your invoice details:

ORDER DETAILS
-------------
Order Number: {{order_number}}
Order Date: {{order_date}}
Order Status: {{order_status}}

SHIPPING ADDRESS
----------------
{{customer_name}}
{{shipping_address}}
Phone: {{customer_phone}}
GST: {{customer_gst}}

ORDER ITEMS
-----------
{{items_list}}

PRICE BREAKDOWN
---------------
Subtotal: {{subtotal}}
GST ({{gst_percentage}}%): {{gst}}
Shipping: {{shipping}}
-----------------------
Grand Total: {{grand_total}}

PAYMENT INFORMATION
-------------------
Method: {{payment_method}}
Status: {{payment_status}}

-------------------
{{company_name}}
GSTIN: {{company_gstin}}
Email: {{company_email}}
Phone: {{company_phone}}

This is a computer-generated invoice.
```

---

## Files Created/Modified

### New Files:
1. `src/services/invoice-email.service.ts` - Service for sending invoice emails to customers
2. `src/services/order-notification.service.ts` - Service for sending order notifications to admins

### Modified Files:
1. `src/components/order/EmailInvoiceModal.tsx` - Updated to use actual email sending

---

## How to Set Up in EmailJS Dashboard

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Create a new Email Service (Gmail, Outlook, etc.)
3. Create two Email Templates:
   - One for Order Notifications (admin)
   - One for Invoice Emails (customer)
4. Copy the template variables from above into your templates
5. Get the Template IDs and add them to your `.env` files
6. Get your Service ID and Public Key from EmailJS dashboard

---

## Testing

1. Place a test order to verify admin notifications work
2. Go to Order Details page and click "Email Invoice" to test customer invoice emails
3. Check browser console for any errors

---

## Notes

- EmailJS free plan allows 200 emails per month
- Invoice emails include: order details, items, price breakdown with GST and shipping
- Admin notifications are sent automatically when orders are placed
- Customer invoice emails are sent manually from the Order Details page
