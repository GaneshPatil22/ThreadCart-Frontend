import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics 4
 */
export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log("[Analytics] GA4 initialized with ID:", GA_MEASUREMENT_ID);
  } else {
    console.warn("[Analytics] GA4 Measurement ID not found. Analytics disabled.");
  }
};

/**
 * Track page views
 */
export const trackPageView = (path: string, title?: string) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: title || document.title,
  });
};

/**
 * Track custom events
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// ============================================================================
// E-COMMERCE EVENTS (GA4 Enhanced E-commerce)
// ============================================================================

interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}

/**
 * Track when user views a product
 */
export const trackViewItem = (product: ProductItem) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("view_item", {
    currency: "INR",
    value: product.price,
    items: [
      {
        item_id: String(product.id),
        item_name: product.name,
        price: product.price,
        quantity: 1,
      },
    ],
  });
};

/**
 * Track when user adds item to cart
 */
export const trackAddToCart = (product: ProductItem, quantity: number) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("add_to_cart", {
    currency: "INR",
    value: product.price * quantity,
    items: [
      {
        item_id: String(product.id),
        item_name: product.name,
        price: product.price,
        quantity: quantity,
      },
    ],
  });
};

/**
 * Track when user removes item from cart
 */
export const trackRemoveFromCart = (product: ProductItem, quantity: number) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("remove_from_cart", {
    currency: "INR",
    value: product.price * quantity,
    items: [
      {
        item_id: String(product.id),
        item_name: product.name,
        price: product.price,
        quantity: quantity,
      },
    ],
  });
};

/**
 * Track when user views cart
 */
export const trackViewCart = (items: ProductItem[], totalValue: number) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("view_cart", {
    currency: "INR",
    value: totalValue,
    items: items.map((item) => ({
      item_id: String(item.id),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
};

/**
 * Track when user begins checkout
 */
export const trackBeginCheckout = (items: ProductItem[], totalValue: number) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("begin_checkout", {
    currency: "INR",
    value: totalValue,
    items: items.map((item) => ({
      item_id: String(item.id),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
};

/**
 * Track successful purchase
 */
export const trackPurchase = (
  orderId: string,
  items: ProductItem[],
  totalValue: number
) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("purchase", {
    transaction_id: orderId,
    currency: "INR",
    value: totalValue,
    items: items.map((item) => ({
      item_id: String(item.id),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("search", {
    search_term: searchTerm,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: string) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("login", {
    method: method,
  });
};

/**
 * Track user registration
 */
export const trackSignUp = (method: string) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("sign_up", {
    method: method,
  });
};
