# ThreadCart - Checkout & Order Management Progress

Last updated: December 5, 2025

---

## Completed Features

### Phase 1-3: Checkout Flow
- [x] Database schema for checkout (pincodes, addresses)
- [x] Address types and service
- [x] Address form component with pincode validation
- [x] Address card component
- [x] Checkout page with full layout
- [x] Checkout item row component

### Phase 4-6: Payment & Orders
- [x] Cash on Delivery (COD) - **WORKING**
- [x] Razorpay integration - **SCAFFOLDED** (needs API keys)
- [x] Order creation flow
- [x] Order success page
- [x] Payment method selector component

### Phase 7: Order Management
- [x] Order History page (`/orders`)
- [x] Order Details page (`/orders/:orderId`)
- [x] Order Status Timeline component
- [x] PDF Invoice download (using jsPDF)
- [x] Email Invoice modal (UI ready, backend needed)

### Other
- [x] Updated favicon to hex nut icon
- [x] Updated page title

---

## Files Created

### Database Schema
```
supabase_checkout_schema.sql     - Pincodes & addresses tables
supabase_orders_rls.sql          - RLS policies for orders (if created)
```

### Types
```
src/types/address.types.ts       - Address interfaces
src/types/order.types.ts         - Order interfaces & status config
```

### Services
```
src/services/address.service.ts  - Address CRUD & pincode validation
src/services/checkout.service.ts - Checkout orchestration
src/services/order.service.ts    - Order CRUD operations
src/services/invoice.service.ts  - PDF invoice generation
```

### Components
```
src/components/checkout/
  ├── AddressForm.tsx            - Address form with validation
  ├── AddressCard.tsx            - Address display card
  ├── CheckoutItemRow.tsx        - Cart item in checkout
  └── PaymentMethodSelector.tsx  - COD/Razorpay selector

src/components/order/
  ├── OrderStatusTimeline.tsx    - Visual order tracking
  └── EmailInvoiceModal.tsx      - Email invoice form
```

### Pages
```
src/pages/checkout/
  └── CheckoutPage.tsx           - Main checkout page

src/pages/order/
  ├── OrderSuccessPage.tsx       - Order confirmation
  ├── OrderHistoryPage.tsx       - List of user orders
  └── OrderDetailsPage.tsx       - Single order details
```

### Config & Docs
```
.env.example                     - Environment variables template
RAZORPAY_SETUP_GUIDE.md          - Razorpay configuration guide
public/favicon.svg               - Hex nut favicon
```

---

## Files Modified

```
src/App.tsx                      - Added checkout & order routes
src/components/Navbar.tsx        - Added "My Orders" link
src/components/cart/CartSummary.tsx - Navigate to checkout
src/index.css                    - Tailwind v4 theme colors
index.html                       - Favicon & title
```

---

## Routes Added

| Route | Page | Auth Required |
|-------|------|---------------|
| `/checkout` | CheckoutPage | Yes |
| `/order/success` | OrderSuccessPage | Yes |
| `/orders` | OrderHistoryPage | Yes |
| `/orders/:orderId` | OrderDetailsPage | Yes |

---

## Database Setup Required

Run these SQL scripts in Supabase SQL Editor:

### 1. Checkout Schema (`supabase_checkout_schema.sql`)
- `supported_pincodes` table
- `user_addresses` table
- RLS policies for addresses

### 2. Order Number Function
```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  current_date_str TEXT;
  sequence_num INT;
BEGIN
  current_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  new_number := 'TC-' || current_date_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_order_number() TO authenticated;
```

### 3. Orders RLS Policies
```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can create own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (for online payments)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## What's Working

1. **Full checkout flow** with address management
2. **COD payments** - Orders are created and saved
3. **Order history** - View all past orders
4. **Order details** - Full order info with tracking timeline
5. **PDF invoice download** - Generated client-side with jsPDF
6. **Email invoice UI** - Form ready (simulated send)

---

## Pending / Future Work

### High Priority
- [ ] **Razorpay Integration**: Add API keys and test online payments
- [ ] **Email Invoice Backend**: Implement Supabase Edge Function or external email API
- [ ] **Admin Order Management**: View/update order status from admin panel

### Nice to Have
- [ ] Order cancellation flow
- [ ] Return/refund requests
- [ ] Order notifications (email/SMS)
- [ ] Shipping tracking integration
- [ ] Multiple payment gateways

---

## Testing Checklist

- [ ] Create account / login
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Add new address with valid pincode
- [ ] Select COD payment
- [ ] Place order
- [ ] View order success page
- [ ] Click "View Order Details"
- [ ] Check "My Orders" in navbar
- [ ] Download PDF invoice
- [ ] Test email invoice form

---

## Known Issues / Notes

1. **Tailwind v4**: Uses CSS `@theme` directive in `src/index.css`, not `tailwind.config.js`
2. **Favicon caching**: Hard refresh needed to see new favicon
3. **Email sending**: Currently simulated - needs backend implementation
4. **Chunk size warning**: Build shows warning about large bundle - consider code splitting later

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
