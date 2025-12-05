import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, startPageTimer, trackTimeOnPage } from "../utils/analytics";

/**
 * Component that tracks page views and time on page
 * Place this inside the Router component
 */
export default function PageViewTracker() {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Track time spent on previous page before navigating
    if (previousPath.current && previousPath.current !== currentPath) {
      trackTimeOnPage(previousPath.current);
    }

    // Start timer for new page
    startPageTimer();

    // Track page view
    trackPageView(currentPath);

    // Update previous path
    previousPath.current = currentPath;

    // Track time on page when user leaves the site
    const handleBeforeUnload = () => {
      trackTimeOnPage(currentPath);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [location]);

  return null;
}
