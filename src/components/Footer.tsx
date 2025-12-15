import { Link } from "react-router-dom";
import { FaFacebookF, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { SOCIAL_MEDIA } from "../utils/constants";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border text-text-secondary">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Company */}
        <div>
          <h3 className="text-text-primary font-semibold mb-4">Company</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="hover:text-text-primary">
                Home
              </Link>
            </li>
            <li>
              <Link to="/subcategory" className="hover:text-text-primary">
                Catalog
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-text-primary">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-text-primary">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Support */}
        <div>
          <h3 className="text-text-primary font-semibold mb-4">Support</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/help" className="hover:text-text-primary">
                Help Center
              </Link>
            </li>
            <li>
              <Link to="/shipping" className="hover:text-text-primary">
                Shipping & Returns
              </Link>
            </li>
            <li>
              <Link to="/faqs" className="hover:text-text-primary">
                FAQs
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-text-primary">
                Terms of Use
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Resources - Hidden until content is ready */}
        {/* <div>
          <h3 className="text-text-primary font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/blog" className="hover:text-text-primary">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/catalogs" className="hover:text-text-primary">
                Catalogs & Brochures
              </Link>
            </li>
            <li>
              <Link to="/guides" className="hover:text-text-primary">
                Buying Guides
              </Link>
            </li>
            <li>
              <Link to="/careers" className="hover:text-text-primary">
                Careers
              </Link>
            </li>
          </ul>
        </div> */}

        {/* Column 4: Stay Connected */}
        <div>
          <h3 className="text-text-primary font-semibold mb-4">Stay Connected</h3>
          <div className="flex space-x-4 mb-4">
            <a
              href={SOCIAL_MEDIA.FACEBOOK.URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={SOCIAL_MEDIA.FACEBOOK.LABEL}
              className="hover:text-primary transition-colors duration-200"
            >
              <FaFacebookF className="w-5 h-5" />
            </a>
            <a
              href={SOCIAL_MEDIA.LINKEDIN.URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={SOCIAL_MEDIA.LINKEDIN.LABEL}
              className="hover:text-primary transition-colors duration-200"
            >
              <FaLinkedinIn className="w-5 h-5" />
            </a>
            <a
              href={SOCIAL_MEDIA.INSTAGRAM.URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={SOCIAL_MEDIA.INSTAGRAM.LABEL}
              className="hover:text-primary transition-colors duration-200"
            >
              <FaInstagram className="w-5 h-5" />
            </a>
          </div>

          <p className="text-sm">
            Subscribe to our newsletter for the latest updates.
          </p>
          <form className="mt-2 flex">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-3 py-2 border border-border rounded-l-md focus:outline-none text-text-secondary"
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-hover"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center text-xs">
          <p className="text-text-secondary">
            &copy; {new Date().getFullYear()} ThreadCart. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link to="/privacy" className="hover:text-text-primary">
              Privacy Policy
            </Link>
            <Link to="/cookie" className="hover:text-text-primary">
              Cookie Policy
            </Link>
            <Link to="/sitemap" className="hover:text-text-primary">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
