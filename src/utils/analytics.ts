import ReactGA from "react-ga4";
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// ============================================================================
// WEB VITALS TRACKING
// ============================================================================

/**
 * Send Web Vitals metrics to GA4
 */
const sendWebVitalToGA = (metric: Metric) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event({
    category: "Web Vitals",
    action: metric.name,
    label: metric.id,
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    nonInteraction: true,
  });
};

/**
 * Initialize Web Vitals tracking
 * Call this after GA is initialized
 */
export const initWebVitals = () => {
  if (!GA_MEASUREMENT_ID) return;

  onCLS(sendWebVitalToGA);
  onINP(sendWebVitalToGA);
  onLCP(sendWebVitalToGA);
  onFCP(sendWebVitalToGA);
  onTTFB(sendWebVitalToGA);

  console.log("[Analytics] Web Vitals tracking initialized");
};

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

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track JavaScript errors
 */
export const trackError = (
  errorMessage: string,
  errorSource?: string,
  isFatal: boolean = false
) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("exception", {
    description: errorMessage,
    fatal: isFatal,
    error_source: errorSource || "unknown",
  });
};

/**
 * Setup global error handler
 */
export const initErrorTracking = () => {
  if (!GA_MEASUREMENT_ID) return;

  // Track unhandled errors
  window.addEventListener("error", (event) => {
    trackError(
      event.message || "Unknown error",
      `${event.filename}:${event.lineno}:${event.colno}`,
      false
    );
  });

  // Track unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    trackError(
      event.reason?.message || String(event.reason) || "Unhandled Promise Rejection",
      "Promise",
      false
    );
  });

  console.log("[Analytics] Error tracking initialized");
};

// ============================================================================
// ENGAGEMENT TRACKING
// ============================================================================

/**
 * Track scroll depth (25%, 50%, 75%, 100%)
 */
export const initScrollTracking = () => {
  if (!GA_MEASUREMENT_ID) return;

  const scrollThresholds = [25, 50, 75, 100];
  const trackedThresholds = new Set<number>();

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    scrollThresholds.forEach((threshold) => {
      if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
        trackedThresholds.add(threshold);
        ReactGA.event({
          category: "Engagement",
          action: "Scroll Depth",
          label: `${threshold}%`,
          value: threshold,
          nonInteraction: true,
        });
      }
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  // Reset on page navigation
  return () => {
    trackedThresholds.clear();
  };
};

/**
 * Track time on page
 */
let pageStartTime: number | null = null;

export const startPageTimer = () => {
  pageStartTime = Date.now();
};

export const trackTimeOnPage = (pagePath: string) => {
  if (!GA_MEASUREMENT_ID || !pageStartTime) return;

  const timeSpent = Math.round((Date.now() - pageStartTime) / 1000); // seconds

  if (timeSpent > 0) {
    ReactGA.event({
      category: "Engagement",
      action: "Time on Page",
      label: pagePath,
      value: timeSpent,
      nonInteraction: true,
    });
  }

  pageStartTime = null;
};

/**
 * Track outbound link clicks
 */
export const trackOutboundLink = (url: string) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event({
    category: "Outbound Link",
    action: "Click",
    label: url,
  });
};

// ============================================================================
// CHECKOUT FUNNEL TRACKING
// ============================================================================

/**
 * Track checkout step progress
 */
export const trackCheckoutStep = (
  step: "address" | "payment" | "review",
  stepNumber: number
) => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("checkout_progress", {
    checkout_step: stepNumber,
    checkout_option: step,
  });
};

/**
 * Track payment method selection
 */
export const trackPaymentMethod = (method: "razorpay" | "cod") => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("add_payment_info", {
    payment_type: method === "razorpay" ? "Online Payment" : "Cash on Delivery",
  });
};

/**
 * Track shipping info added
 */
export const trackShippingInfo = () => {
  if (!GA_MEASUREMENT_ID) return;

  ReactGA.event("add_shipping_info", {
    shipping_tier: "Standard",
  });
};
