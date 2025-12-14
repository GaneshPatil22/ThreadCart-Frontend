// ============================================================================
// CART SERVICE (SUPABASE)
// ============================================================================
// Handles all cart operations for authenticated users via Supabase
// ============================================================================

import { supabase } from '../utils/supabase';
import { TAX } from '../utils/constants';
import type {
  Cart,
  CartItemInsert,
} from '../types/database.types';
import type {
  CartItemWithProduct,
  CartSummary,
  AddToCartResult,
  UpdateCartItemResult,
  RemoveFromCartResult,
  MergeCartResult,
  LocalCartItem,
} from '../types/cart.types';

// ============================================================================
// GET OR CREATE CART FOR USER
// ============================================================================

export const getOrCreateCart = async (user_id: string): Promise<Cart | null> => {
  try {
    // Try to get existing cart
    const { data: existingCart, error: fetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existingCart && !fetchError) {
      return existingCart;
    }

    // Create new cart if doesn't exist
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert([{ user_id }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating cart:', createError);
      return null;
    }

    return newCart;
  } catch (error) {
    console.error('Error in getOrCreateCart:', error);
    return null;
  }
};

// ============================================================================
// GET CART WITH ITEMS AND PRODUCT DETAILS
// ============================================================================

export const getCartWithItems = async (
  user_id: string
): Promise<CartSummary | null> => {
  try {
    // Get or create cart
    const cart = await getOrCreateCart(user_id);
    if (!cart) {
      return null;
    }

    // Get cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        cart_id,
        product_id,
        quantity,
        added_at,
        updated_at,
        product:product_id (
          id,
          name,
          image_url,
          price,
          quantity,
          thread_style,
          thread_size_pitch,
          fastener_length,
          head_height,
          Grade,
          Coating,
          part_number,
          sub_cat_id,
          sort_number
        )
      `
      )
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return null;
    }

    // Transform data to CartItemWithProduct
    const items: CartItemWithProduct[] = (cartItems || []).map((item: any) => ({
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: item.quantity,
      added_at: item.added_at,
      product: item.product,
    }));

    // Calculate summary
    // Product prices in DB are EXCLUSIVE of GST, so we add GST on top
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const tax = subtotal * TAX.GST_RATE; // Add 18% GST
    const shipping = 0; // Free shipping
    const total = subtotal + tax + shipping; // Final amount with GST
    const item_count = items.length;
    const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      tax,
      shipping,
      total,
      item_count,
      total_quantity,
    };
  } catch (error) {
    console.error('Error in getCartWithItems:', error);
    return null;
  }
};

// ============================================================================
// ADD ITEM TO CART
// ============================================================================

export const addToCart = async (
  user_id: string,
  product_id: number,
  quantity: number
): Promise<AddToCartResult> => {
  try {
    // Validate quantity
    if (quantity <= 0) {
      return {
        success: false,
        message: 'Quantity must be greater than 0',
      };
    }

    // Get or create cart
    const cart = await getOrCreateCart(user_id);
    if (!cart) {
      return {
        success: false,
        message: 'Failed to create cart',
      };
    }

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    if (product.quantity === 0) {
      return {
        success: false,
        message: 'Product is out of stock',
      };
    }

    // Check if product already in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', product_id)
      .single();

    if (existingItem && !existingError) {
      // Update quantity if product exists
      const newQuantity = existingItem.quantity + quantity;

      // Check stock availability
      if (newQuantity > product.quantity) {
        return {
          success: false,
          message: `Only ${product.quantity} units available in stock`,
        };
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return {
          success: false,
          message: 'Failed to update cart',
        };
      }

      return {
        success: true,
        message: 'Cart updated successfully',
      };
    }

    // Check stock availability for new item
    if (quantity > product.quantity) {
      return {
        success: false,
        message: `Only ${product.quantity} units available in stock`,
      };
    }

    // Add new item to cart
    const newItem: CartItemInsert = {
      cart_id: cart.id,
      product_id,
      quantity,
    };

    const { error: insertError } = await supabase
      .from('cart_items')
      .insert([newItem]);

    if (insertError) {
      console.error('Error adding to cart:', insertError);
      return {
        success: false,
        message: 'Failed to add to cart',
      };
    }

    return {
      success: true,
      message: 'Added to cart successfully',
    };
  } catch (error) {
    console.error('Error in addToCart:', error);
    return {
      success: false,
      message: 'An error occurred',
    };
  }
};

// ============================================================================
// UPDATE CART ITEM QUANTITY
// ============================================================================

export const updateCartItemQuantity = async (
  user_id: string,
  product_id: number,
  quantity: number
): Promise<UpdateCartItemResult> => {
  try {
    // Get cart
    const cart = await getOrCreateCart(user_id);
    if (!cart) {
      return {
        success: false,
        message: 'Cart not found',
      };
    }

    // If quantity is 0 or negative, remove item
    if (quantity <= 0) {
      const removeResult = await removeFromCart(user_id, product_id);
      return {
        success: removeResult.success,
        message: removeResult.message,
      };
    }

    // Check product stock
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    if (quantity > product.quantity) {
      return {
        success: false,
        message: `Only ${product.quantity} units available in stock`,
      };
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('cart_id', cart.id)
      .eq('product_id', product_id);

    if (updateError) {
      console.error('Error updating quantity:', updateError);
      return {
        success: false,
        message: 'Failed to update quantity',
      };
    }

    return {
      success: true,
      message: 'Quantity updated successfully',
    };
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    return {
      success: false,
      message: 'An error occurred',
    };
  }
};

// ============================================================================
// REMOVE ITEM FROM CART
// ============================================================================

export const removeFromCart = async (
  user_id: string,
  product_id: number
): Promise<RemoveFromCartResult> => {
  try {
    // Get cart
    const cart = await getOrCreateCart(user_id);
    if (!cart) {
      return {
        success: false,
        message: 'Cart not found',
      };
    }

    // Remove item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('product_id', product_id);

    if (deleteError) {
      console.error('Error removing from cart:', deleteError);
      return {
        success: false,
        message: 'Failed to remove from cart',
      };
    }

    return {
      success: true,
      message: 'Removed from cart successfully',
    };
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return {
      success: false,
      message: 'An error occurred',
    };
  }
};

// ============================================================================
// CLEAR CART
// ============================================================================

export const clearCart = async (user_id: string): Promise<boolean> => {
  try {
    // Get cart
    const cart = await getOrCreateCart(user_id);
    if (!cart) {
      return false;
    }

    // Delete all items
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      console.error('Error clearing cart:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in clearCart:', error);
    return false;
  }
};

// ============================================================================
// MERGE LOCAL CART WITH DB CART (On Login)
// ============================================================================

export const mergeLocalCartWithDB = async (
  user_id: string,
  localCartItems: LocalCartItem[]
): Promise<MergeCartResult> => {
  try {
    if (localCartItems.length === 0) {
      return {
        success: true,
        message: 'No items to merge',
        merged_count: 0,
      };
    }

    // Get or create cart
    const cart = await getOrCreateCart(user_id);
    if (!cart) {
      return {
        success: false,
        message: 'Failed to create cart',
        merged_count: 0,
        error: 'Cart creation failed',
      };
    }

    // Get existing cart items
    const { data: existingItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (fetchError) {
      console.error('Error fetching existing cart items:', fetchError);
      return {
        success: false,
        message: 'Failed to fetch cart',
        merged_count: 0,
        error: fetchError.message,
      };
    }

    let mergedCount = 0;

    // Process each local cart item
    for (const localItem of localCartItems) {
      const existingItem = existingItems?.find(
        (item) => item.product_id === localItem.product_id
      );

      if (existingItem) {
        // MERGE STRATEGY: Add quantities together
        const newQuantity = existingItem.quantity + localItem.quantity;

        // Check stock availability
        const { data: product } = await supabase
          .from('product')
          .select('quantity')
          .eq('id', localItem.product_id)
          .single();

        const finalQuantity = product
          ? Math.min(newQuantity, product.quantity)
          : newQuantity;

        // Update existing item
        await supabase
          .from('cart_items')
          .update({ quantity: finalQuantity })
          .eq('id', existingItem.id);

        mergedCount++;
      } else {
        // Insert new item
        const newItem: CartItemInsert = {
          cart_id: cart.id,
          product_id: localItem.product_id,
          quantity: localItem.quantity,
        };

        await supabase.from('cart_items').insert([newItem]);
        mergedCount++;
      }
    }

    return {
      success: true,
      message: `Successfully merged ${mergedCount} items`,
      merged_count: mergedCount,
    };
  } catch (error) {
    console.error('Error in mergeLocalCartWithDB:', error);
    return {
      success: false,
      message: 'Merge failed',
      merged_count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================================================
// GET CART ITEM COUNT (for badge)
// ============================================================================

export const getCartItemCount = async (user_id: string): Promise<number> => {
  try {
    const cart = await getOrCreateCart(user_id);
    if (!cart) return 0;

    const { data, error } = await supabase
      .from('cart_items')
      .select('id')
      .eq('cart_id', cart.id);

    if (error) {
      console.error('Error fetching cart item count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in getCartItemCount:', error);
    return 0;
  }
};
