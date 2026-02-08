import { Link } from "react-router-dom";
import StaticPageLayout from "../../components/StaticPageLayout";

interface SitemapSection {
  title: string;
  links: { name: string; path: string }[];
}

const sitemapSections: SitemapSection[] = [
  {
    title: "Main Pages",
    links: [
      { name: "Home", path: "/" },
      { name: "Product Catalog", path: "/subcategory" },
      { name: "Gallery", path: "/gallery" },
      { name: "Search", path: "/search" },
    ],
  },
  {
    title: "Shopping",
    links: [
      { name: "Shopping Cart", path: "/cart" },
      { name: "Checkout", path: "/checkout" },
      { name: "Order History", path: "/orders" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About Us", path: "/about" },
      { name: "Contact Us", path: "/contact" },
      { name: "Careers", path: "/careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help Center", path: "/help" },
      { name: "Shipping", path: "/shipping" },
      { name: "FAQs", path: "/faqs" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Blog", path: "/blog" },
      { name: "Catalogs & Brochures", path: "/catalogs" },
      { name: "Buying Guides", path: "/guides" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Terms of Use", path: "/terms" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Cookie Policy", path: "/cookie" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <StaticPageLayout title="Sitemap">
      <p className="mb-8">
        Find all the pages on our website organized by category. Click on any link to navigate directly to that page.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sitemapSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 border-b border-border pb-2">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-text-secondary hover:text-primary transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </StaticPageLayout>
  );
}
