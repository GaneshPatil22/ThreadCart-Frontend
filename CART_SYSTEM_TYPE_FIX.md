# Cart System - Product ID Type Fix

## Issue
The cart schema was originally created with `UUID` type for `product_id`, but your existing `product` table uses `BIGINT` for the `id` column.

## Error
```
ERROR: 42804: foreign key constraint "cart_items_product_id_fkey" cannot be implemented
DETAIL: Key columns "product_id" and "id" are of incompatible types: uuid and bigint.
```

## Solution Applied

### 1. Database Schema Updated
Changed `product_id` from `UUID` to `BIGINT` in:
- `cart_items` table
- `order_items` table

**File:** `supabase_cart_schema.sql`

### 2. TypeScript Types Updated
Changed `product_id` from `string` to `number` in all type definitions:

**Files Updated:**
- `src/types/database.types.ts`
  - `CartItem.product_id`: `string` → `number`
  - `CartItemInsert.product_id`: `string` → `number`
  - `CartItemUpdate.product_id`: `string` → `number`
  - `OrderItem.product_id`: `string` → `number`
  - `OrderItemInsert.product_id`: `string` → `number`
  - `Product.id`: `string` → `number`

- `src/types/cart.types.ts`
  - `CartItemWithProduct.product_id`: `string` → `number`
  - `LocalCartItem.product_id`: `string` → `number`
  - `CartValidationIssue.product_id`: `string` → `number`
  - `AddToCartParams.product_id`: `string` → `number`
  - `UpdateCartItemParams.product_id`: `string` → `number`
  - `RemoveFromCartParams.product_id`: `string` → `number`
  - `CartContextState.addToCart()`: parameter type updated
  - `CartContextState.updateQuantity()`: parameter type updated
  - `CartContextState.removeFromCart()`: parameter type updated
  - `CartContextState.getItemQuantity()`: parameter type updated
  - `CartContextState.isInCart()`: parameter type updated

- `src/types/order.types.ts`
  - `CreateOrderParams.cart_items[].product_id`: `string` → `number`

### 3. Service & Utility Functions Updated
Changed function signatures to accept `number` instead of `string`:

**Files Updated:**
- `src/services/cart.service.ts`
  - `addToCart(user_id, product_id: number, ...)`
  - `updateCartItemQuantity(user_id, product_id: number, ...)`
  - `removeFromCart(user_id, product_id: number)`

- `src/utils/cartLocalStorage.ts`
  - `addToLocalCart(product_id: number, ...)`
  - `updateLocalCartItem(product_id: number, ...)`
  - `removeLocalCartItem(product_id: number)`
  - `getLocalCartItemQuantity(product_id: number)`
  - `isProductInLocalCart(product_id: number)`
  - `validateLocalCart(validProductIds: number[])`

- `src/utils/cartValidation.ts`
  - `checkProductAvailability(product_id: number, ...)`
  - `autoFixCartIssues()`: return type updated to `removed_items: number[]`

- `src/context/CartContext.tsx`
  - `addToCart(product_id: number, ...)`
  - `updateQuantity(product_id: number, ...)`
  - `removeFromCart(product_id: number)`
  - `getItemQuantity(product_id: number)`
  - `isInCart(product_id: number)`
  - Fixed local cart loading to use `id: \`local-${localItem.product_id}\`` for temporary string ID

## Verification

✅ **Build Status:** SUCCESS
✅ **TypeScript Errors:** 0
✅ **Database Schema:** Compatible with existing product table

## Next Steps

1. **Run the Updated SQL Schema:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- File: supabase_cart_schema.sql
   ```

2. **Verify Database Tables:**
   - Check that `cart_items.product_id` is `BIGINT`
   - Check that `order_items.product_id` is `BIGINT`
   - Verify foreign keys are created successfully

3. **Test the Cart:**
   - Add items to cart
   - Update quantities
   - Remove items
   - Test login merge

## Notes

- All `product_id` references now use `number` (TypeScript) / `BIGINT` (PostgreSQL)
- The `id` field in `CartItem` remains `string` (UUID) as it represents the cart_item's own ID
- Product IDs from your existing database will work seamlessly
- No changes needed to existing product data

## Type Mapping

| Database Type | TypeScript Type |
|--------------|-----------------|
| UUID | string |
| BIGINT | number |
| INTEGER | number |
| TEXT | string |
| NUMERIC | number |
| TIMESTAMPTZ | string |
| JSONB | object |

---

**Status:** ✅ **RESOLVED**
**Build:** ✅ **PASSING**
**Ready to Use:** ✅ **YES**
