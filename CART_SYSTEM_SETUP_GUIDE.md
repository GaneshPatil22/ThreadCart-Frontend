# ThreadCart Cart System - Quick Setup Guide

## 🚀 Getting Started (5 Minutes)

Follow these steps to get the cart system up and running:

### Step 1: Database Setup (2 min)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy contents of `supabase_cart_schema.sql`
5. Paste and click **Run**
6. Verify all tables are created (carts, cart_items, orders, order_items)

### Step 2: Environment Variables (1 min)

Add to `.env.development`:

```bash
# Existing Supabase vars
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# New Razorpay vars (optional for now)
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
VITE_RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**Note:** You can use placeholder Razorpay keys for now. Real keys needed only when implementing payment.

### Step 3: Test the Cart (2 min)

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open the app in browser

3. Test as **anonymous user**:
   - Browse products
   - Add item to cart
   - Check cart icon badge
   - Visit `/cart` page
   - Update quantities
   - Remove items

4. Test as **logged-in user**:
   - Sign in
   - Add items to cart
   - Check cart persists after page refresh
   - Check cart badge updates

5. Test **login merge**:
   - Logout
   - Add items to cart (anonymous)
   - Login
   - Verify items merged with any existing cart

## ✅ Verification Checklist

- [ ] Database schema created successfully
- [ ] No errors in browser console
- [ ] Cart icon visible in navbar
- [ ] Can add items to cart (anonymous)
- [ ] Cart badge shows correct count
- [ ] Cart page loads correctly
- [ ] Can update quantities
- [ ] Can remove items
- [ ] Login merges anonymous cart
- [ ] Logged-in cart persists across refreshes

## 🎯 Next Steps

### Immediate (Ready to Use)
- ✅ Full cart functionality works
- ✅ Anonymous and authenticated users supported
- ✅ Cart persistence implemented
- ✅ Stock validation active

### Short Term (Before Production)
1. **Implement Razorpay Backend:**
   - Create backend endpoints (see `razorpay.ts` comments)
   - Add payment verification
   - Test with Razorpay test mode

2. **Add Checkout Page:**
   - Create `/checkout` route
   - Add shipping address form
   - Integrate Razorpay payment
   - Handle order confirmation

3. **Implement Order History:**
   - Create `/orders` route
   - Display user order list
   - Add order detail pages
   - Implement order tracking UI

### Medium Term (Enhancements)
1. **Email Notifications:**
   - Order confirmation emails
   - Order status update emails
   - Abandoned cart reminders

2. **Admin Order Management:**
   - View all orders
   - Update order status
   - Generate invoices
   - Export reports

3. **Advanced Features:**
   - Discount codes/coupons
   - Saved addresses
   - Multiple payment methods
   - Guest checkout

## 🐛 Troubleshooting

### Cart not loading?
```bash
# Check browser console
# Verify CartProvider is in App.tsx
# Check Supabase connection
```

### Badge not showing?
```bash
# Check if items actually in cart
# Verify useCart hook is working
# Check CartIcon component renders
```

### Merge not working?
```bash
# Check browser console for merge logs
# Verify localStorage has items before login
# Check auth listener in CartContext
```

### Stock validation failing?
```bash
# Verify product.quantity field exists
# Check product exists in database
# Ensure RLS policies allow reading products
```

## 📚 Documentation

- **Full Documentation:** See `CART_SYSTEM_DOCUMENTATION.md`
- **API Reference:** See documentation file for complete API
- **Code Comments:** All files have detailed inline comments

## 🆘 Need Help?

1. Check `CART_SYSTEM_DOCUMENTATION.md` for detailed guides
2. Review code comments in source files
3. Check Supabase logs for database errors
4. Verify RLS policies in Supabase dashboard

## 🎉 You're Ready!

Your cart system is now fully functional. Start adding products to cart and testing the flow!

---

**Pro Tips:**
- Test with multiple browsers to verify LocalStorage isolation
- Use Supabase Table Editor to view cart data in real-time
- Check Network tab to debug API calls
- Enable React DevTools to inspect cart state
