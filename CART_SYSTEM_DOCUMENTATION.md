# ThreadCart - Cart System Documentation

## Overview

This document provides complete documentation for the ThreadCart cart and order system implementation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CART SYSTEM ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

Anonymous User                    Logged-In User
     ↓                                  ↓
LocalStorage Cart  ──Login──→    Supabase Cart
     │                            ↓          ↑
     │                         carts    cart_items
     │                            ↓
     └──────────→ Merge (Add Quantities) ──→ Checkout
                                              ↓
                                         orders + order_items
                                              ↓
                                      Order Tracking System
```

## Implementation Phases

### Phase 1: Database Foundation ✅
**Files Created:**
- `supabase_cart_schema.sql` - Complete database schema
- `src/types/database.types.ts` - Core database types
- `src/types/cart.types.ts` - Cart application types
- `src/types/order.types.ts` - Order & tracking types

**Database Tables:**
1. `carts` - One cart per user
2. `cart_items` - Individual cart items
3. `orders` - Order headers with tracking
4. `order_items` - Order line items (historical snapshot)

**Security:**
- Row Level Security (RLS) enabled on all tables
- Users can only access their own carts and orders
- Admin can view/update all orders

### Phase 2: LocalStorage Cart ✅
**Files Created:**
- `src/utils/cartLocalStorage.ts` - Complete LocalStorage utilities

**Features:**
- Anonymous cart storage in browser
- CRUD operations for cart items
- Automatic cleanup of invalid items
- Cart count and quantity helpers

### Phase 3: Supabase Cart Service ✅
**Files Created:**
- `src/services/cart.service.ts` - Complete Supabase cart service

**Features:**
- Auto-create cart on first add
- Stock validation before adding
- Update/remove cart items
- Clear entire cart
- Merge LocalStorage cart with DB cart on login

### Phase 4: Cart Context & Hook ✅
**Files Created:**
- `src/context/CartContext.tsx` - Global cart state management
- `src/hooks/useCart.ts` - Custom hook to access cart

**Features:**
- Auto-detect authentication state
- Route to LocalStorage or Supabase based on auth
- Real-time cart updates
- Auth state listener for automatic switching

### Phase 5: Login Merge Strategy ✅
**Implementation:**
- Automatic merge on login
- **Strategy:** Add quantities together (5 local + 3 DB = 8 total)
- Clear LocalStorage after successful merge
- Stock validation during merge

### Phase 6: Cart UI Components ✅
**Files Created:**
- `src/components/cart/CartIcon.tsx` - Navbar badge
- `src/components/cart/EmptyCart.tsx` - Empty state
- `src/components/cart/CartItemRow.tsx` - Individual cart item
- `src/components/cart/CartSummary.tsx` - Cart totals & checkout
- `src/pages/cart/CartPage.tsx` - Full cart page

**Features:**
- Responsive design (mobile & desktop)
- Real-time quantity updates
- Stock warnings
- Remove item confirmation
- Clear cart functionality
- Cart badge showing unique product count

### Phase 7: Checkout & Order Structure ✅
**Files Created:**
- `src/services/order.service.ts` - Complete order service
- `src/utils/razorpay.ts` - Razorpay integration scaffolding

**Features:**
- Order creation from cart
- Order tracking with timestamps
- User order history
- Order cancellation
- Admin order status updates
- Razorpay payment integration (scaffolding)

## API Reference

### Cart Context API

```typescript
import { useCart } from './hooks/useCart';

const {
  cart,              // CartSummary | null
  loading,           // boolean
  error,             // string | null
  addToCart,         // (product_id, quantity) => Promise<AddToCartResult>
  updateQuantity,    // (product_id, quantity) => Promise<UpdateCartItemResult>
  removeFromCart,    // (product_id) => Promise<RemoveFromCartResult>
  clearCart,         // () => Promise<void>
  refreshCart,       // () => Promise<void>
  validateCart,      // () => Promise<CartValidationResult>
  getItemQuantity,   // (product_id) => number
  isInCart,          // (product_id) => boolean
} = useCart();
```

### Cart Service API

```typescript
import * as cartService from './services/cart.service';

// Get or create cart
const cart = await cartService.getOrCreateCart(user_id);

// Get cart with items and product details
const cartSummary = await cartService.getCartWithItems(user_id);

// Add item to cart
const result = await cartService.addToCart(user_id, product_id, quantity);

// Update quantity
const result = await cartService.updateCartItemQuantity(user_id, product_id, quantity);

// Remove item
const result = await cartService.removeFromCart(user_id, product_id);

// Clear cart
const success = await cartService.clearCart(user_id);

// Merge local cart with DB cart
const result = await cartService.mergeLocalCartWithDB(user_id, localCartItems);

// Get cart item count (for badge)
const count = await cartService.getCartItemCount(user_id);
```

### Order Service API

```typescript
import * as orderService from './services/order.service';

// Create order from cart
const result = await orderService.createOrderFromCart({
  user_id,
  shipping_address,
  payment_method,
  cart_items: [{ product_id, quantity, price }],
});

// Get order by ID
const order = await orderService.getOrderById(order_id);

// Get user orders
const orders = await orderService.getUserOrders(user_id);

// Get order tracking
const tracking = await orderService.getOrderTracking(order_id);

// Update order status (admin)
const result = await orderService.updateOrderStatus({
  order_id,
  new_status: 'shipped',
});

// Cancel order (user)
const result = await orderService.cancelOrder(order_id, user_id);
```

### LocalStorage Cart API

```typescript
import * as localCartUtils from './utils/cartLocalStorage';

// Get local cart
const cart = localCartUtils.getLocalCart();

// Add to local cart
const item = localCartUtils.addToLocalCart(product_id, quantity);

// Update item
const item = localCartUtils.updateLocalCartItem(product_id, quantity);

// Remove item
const success = localCartUtils.removeLocalCartItem(product_id);

// Clear cart
localCartUtils.clearLocalCart();

// Get item count (unique products)
const count = localCartUtils.getLocalCartItemCount();

// Get total quantity
const total = localCartUtils.getLocalCartTotalQuantity();

// Get item quantity
const qty = localCartUtils.getLocalCartItemQuantity(product_id);

// Check if in cart
const inCart = localCartUtils.isProductInLocalCart(product_id);
```

## Database Setup

### 1. Run SQL Schema

Execute `supabase_cart_schema.sql` in Supabase SQL Editor:

```bash
# In Supabase Dashboard
# SQL Editor → New Query → Paste contents of supabase_cart_schema.sql → Run
```

### 2. Verify Tables

Check that these tables exist:
- `carts`
- `cart_items`
- `orders`
- `order_items`

### 3. Verify RLS Policies

Check that RLS is enabled and policies are active for all tables.

### 4. Test with Sample Data (Optional)

```sql
-- Insert a test product (if not exists)
INSERT INTO product (name, image_url, price, quantity, sub_cat_id, sort_number)
VALUES ('Test Product', ARRAY['https://via.placeholder.com/300'], 99.99, 10, 'your-subcategory-id', 0);
```

## Environment Variables

Add these to your `.env.development` and `.env.production` files:

```bash
# Supabase (existing)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay (add these)
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
VITE_RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Getting Razorpay Keys

1. Sign up at https://razorpay.com/
2. Go to Settings → API Keys
3. Generate Test Keys (for development)
4. Generate Live Keys (for production)

## Integration Guide

### Adding Cart to Product Page

```typescript
import { useCart } from '../hooks/useCart';

function ProductPage() {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    const result = await addToCart(product.id, quantity);
    if (result.success) {
      alert('Added to cart!');
    } else {
      alert(result.message);
    }
  };

  return (
    <div>
      {/* Quantity selector */}
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min="1"
        max={product.quantity}
      />

      {/* Add to cart button */}
      <button onClick={handleAddToCart}>
        {isInCart(product.id) ? 'Update Cart' : 'Add to Cart'}
      </button>

      {/* Current quantity in cart */}
      {isInCart(product.id) && (
        <p>Currently in cart: {getItemQuantity(product.id)}</p>
      )}
    </div>
  );
}
```

### Implementing Checkout

```typescript
import { useCart } from '../hooks/useCart';
import { createOrderFromCart } from '../services/order.service';
import { startRazorpayCheckout } from '../utils/razorpay';

function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState({...});

  const handleCheckout = async () => {
    if (!cart || !user) return;

    // Step 1: Create order
    const orderResult = await createOrderFromCart({
      user_id: user.id,
      shipping_address: shippingAddress,
      payment_method: 'razorpay',
      cart_items: cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      })),
    });

    if (!orderResult.success) {
      alert('Failed to create order');
      return;
    }

    const order = orderResult.order;

    // Step 2: Initiate Razorpay payment
    await startRazorpayCheckout({
      amount: order.total_amount,
      order_number: order.order_number,
      user_name: user.name,
      user_email: user.email,
      onSuccess: async (response) => {
        // Step 3: Update order with payment details
        // TODO: Call backend to verify and update order

        // Step 4: Clear cart
        await clearCart();

        // Step 5: Redirect to order confirmation
        navigate(`/orders/${order.id}`);
      },
      onFailure: (error) => {
        alert('Payment failed: ' + error.message);
      },
    });
  };

  return (
    // Your checkout UI
  );
}
```

## Order Tracking Implementation

### Display Order Status

```typescript
import { getOrderTracking } from '../services/order.service';
import { ORDER_STATUS_CONFIG } from '../types/order.types';

function OrderTrackingPage({ orderId }) {
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    loadTracking();
  }, [orderId]);

  const loadTracking = async () => {
    const data = await getOrderTracking(orderId);
    setTracking(data);
  };

  if (!tracking) return <div>Loading...</div>;

  return (
    <div>
      <h2>Order {tracking.order_number}</h2>

      {/* Status Timeline */}
      <div className="timeline">
        {tracking.history.map((step) => {
          const config = ORDER_STATUS_CONFIG[step.status];

          return (
            <div
              key={step.status}
              className={`
                timeline-step
                ${step.is_completed ? 'completed' : ''}
                ${step.is_current ? 'current' : ''}
              `}
            >
              <div className="icon">{config.icon}</div>
              <div className="label">{config.label}</div>
              <div className="timestamp">
                {step.timestamp
                  ? new Date(step.timestamp).toLocaleString()
                  : 'Pending'}
              </div>
              <div className="description">{config.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Testing Checklist

### Cart Functionality
- [ ] Add item to cart (anonymous)
- [ ] Add item to cart (logged in)
- [ ] Update quantity
- [ ] Remove item
- [ ] Clear cart
- [ ] Cart badge updates correctly
- [ ] Stock validation works

### Authentication Flow
- [ ] Anonymous cart persists across page refreshes
- [ ] Login merges LocalStorage cart with DB cart
- [ ] Quantities are added correctly during merge
- [ ] LocalStorage is cleared after merge
- [ ] Logout clears cart state

### UI/UX
- [ ] Cart page displays correctly
- [ ] Empty cart state shows
- [ ] Cart item rows display product details
- [ ] Quantity selector works
- [ ] Remove button works with confirmation
- [ ] Cart summary shows correct totals
- [ ] Responsive design works on mobile

### Orders
- [ ] Order creation works
- [ ] Order displays in user order history
- [ ] Order tracking shows correct status
- [ ] Order cancellation works (for pending orders)

## Troubleshooting

### Cart not loading
1. Check if CartProvider is wrapping App
2. Check browser console for errors
3. Verify Supabase connection
4. Check RLS policies

### Merge not working on login
1. Check browser console for merge logs
2. Verify LocalStorage has items before login
3. Check if merge function is called in auth listener
4. Verify cart items are inserted correctly

### Stock validation failing
1. Check if product quantity field is correct
2. Verify product exists in database
3. Check if product quantity is updated correctly

### Razorpay not loading
1. Check if Razorpay script is loaded
2. Verify RAZORPAY_KEY_ID in .env
3. Check browser console for script errors
4. Ensure backend endpoints are implemented

## Performance Optimization

### Recommended Optimizations

1. **Cart Context:**
   - Consider using React Query for better caching
   - Implement optimistic updates for instant UI feedback

2. **Database Queries:**
   - Add indexes on frequently queried columns
   - Use select only required fields

3. **Image Loading:**
   - Implement lazy loading for product images
   - Use image CDN for faster loading

4. **LocalStorage:**
   - Implement size limits to prevent overflow
   - Periodically clean up old cart data

## Future Enhancements

### Suggested Features

1. **Cart Expiration:**
   - Auto-remove items after X days
   - Notify users of expiring cart items

2. **Save for Later:**
   - Move items from cart to wishlist
   - Restore items from wishlist to cart

3. **Product Recommendations:**
   - Show related products in cart
   - "Frequently bought together" suggestions

4. **Discount Codes:**
   - Apply coupon codes
   - Show discount breakdown in summary

5. **Multiple Addresses:**
   - Save multiple shipping addresses
   - Select address during checkout

6. **Guest Checkout:**
   - Allow anonymous users to checkout
   - Create account after order placement

7. **Email Notifications:**
   - Order confirmation email
   - Order status updates
   - Abandoned cart reminders

8. **Analytics:**
   - Track cart abandonment rate
   - Monitor conversion funnel
   - A/B test checkout flow

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the code comments in source files
- Contact the development team

---

**Version:** 1.0
**Last Updated:** January 2025
**Author:** ThreadCart Development Team
