import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/analytics";

/**
 * Component that tracks page views on route changes
 * Place this inside the Router component
 */
export default function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view whenever the route changes
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}
