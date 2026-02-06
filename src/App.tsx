import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import PageViewTracker from "./components/PageViewTracker";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  initGA,
  initWebVitals,
  initErrorTracking,
  initScrollTracking,
} from "./utils/analytics";
import Home from "./components/Home";
import Products from "./components/product/Products";
import { SubCategoryHome } from "./components/sub-categories/SubCategoryHome";
import { AddItem } from "./components/AddItems/AddItem";
import ConfirmEmail from "./pages/ConfirmEmail";
import { CartProvider } from "./context/CartContext";
import { CartPage } from "./pages/cart/CartPage";
import { FloatingWhatsApp } from "./components/common/FloatingWhatsApp";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { OrderSuccessPage } from "./pages/order/OrderSuccessPage";
import { OrderHistoryPage } from "./pages/order/OrderHistoryPage";
import { OrderDetailsPage } from "./pages/order/OrderDetailsPage";

// Static pages
import SearchResultsPage from "./pages/SearchResultsPage";
import HelpCenterPage from "./pages/static/HelpCenterPage";
import ShippingPage from "./pages/static/ShippingReturnsPage";
import FAQsPage from "./pages/static/FAQsPage";
import TermsPage from "./pages/static/TermsPage";
import BlogPage from "./pages/static/BlogPage";
import CatalogsPage from "./pages/static/CatalogsPage";
import BuyingGuidesPage from "./pages/static/BuyingGuidesPage";
import CareersPage from "./pages/static/CareersPage";
import AboutPage from "./pages/static/AboutPage";
import ContactPage from "./pages/static/ContactPage";
import PrivacyPolicyPage from "./pages/static/PrivacyPolicyPage";
import CookiePolicyPage from "./pages/static/CookiePolicyPage";
import SitemapPage from "./pages/static/SitemapPage";
import GalleryPage from "./pages/GalleryPage";

export default function App() {
  // Initialize all analytics tracking on app mount
  useEffect(() => {
    initGA();
    initWebVitals();
    initErrorTracking();
    initScrollTracking();
  }, []);

  return (
    <ErrorBoundary>
      <CartProvider>
        <div className="bg-background min-h-screen text-text-primary flex flex-col">
          <ScrollToTop />
          <PageViewTracker />
          <Navbar />

          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/subcategory" element={<SubCategoryHome />} />
              <Route path="/add_item" element={<AddItem />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/success" element={<OrderSuccessPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
              <Route path="/search" element={<SearchResultsPage />} />

              {/* Static pages - Support */}
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/faqs" element={<FAQsPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Static pages - Resources */}
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/catalogs" element={<CatalogsPage />} />
              <Route path="/guides" element={<BuyingGuidesPage />} />
              <Route path="/careers" element={<CareersPage />} />

              {/* Static pages - Company */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Static pages - Legal */}
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/cookie" element={<CookiePolicyPage />} />
              <Route path="/sitemap" element={<SitemapPage />} />

              {/* Gallery */}
              <Route path="/gallery" element={<GalleryPage />} />
            </Routes>
          </div>

          <Footer />
          <FloatingWhatsApp />
        </div>
      </CartProvider>
    </ErrorBoundary>
  );
}
