import StaticPageLayout from "../../components/StaticPageLayout";
import { FileText, Download } from "lucide-react";

interface Catalog {
  title: string;
  description: string;
  pages: number;
  size: string;
}

const catalogs: Catalog[] = [
  {
    title: "Complete Fastener Catalog 2024",
    description: "Our comprehensive catalog featuring all fastener categories, specifications, and technical data.",
    pages: 120,
    size: "15 MB"
  },
  {
    title: "Stainless Steel Fasteners",
    description: "Specialized catalog for stainless steel products including SS304, SS316, and specialty grades.",
    pages: 45,
    size: "6 MB"
  },
  {
    title: "High-Strength Fasteners",
    description: "Grade 8.8, 10.9, and 12.9 fasteners for demanding industrial applications.",
    pages: 38,
    size: "5 MB"
  },
  {
    title: "Automotive Fasteners",
    description: "Specialized fasteners for automotive and transportation industry applications.",
    pages: 52,
    size: "7 MB"
  },
  {
    title: "Construction & Anchoring Solutions",
    description: "Anchors, concrete fasteners, and construction-grade hardware.",
    pages: 30,
    size: "4 MB"
  }
];

export default function CatalogsPage() {
  return (
    <StaticPageLayout title="Catalogs & Brochures">
      <p className="text-lg mb-8">
        Download our product catalogs and brochures for detailed specifications, technical data, and product information.
      </p>

      <div className="space-y-4">
        {catalogs.map((catalog, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg border border-border flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className="bg-primary/10 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1">{catalog.title}</h3>
              <p className="text-sm text-text-secondary mb-2">{catalog.description}</p>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span>{catalog.pages} pages</span>
                <span>•</span>
                <span>PDF, {catalog.size}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-text-primary mb-2">Need a Custom Catalog?</h3>
        <p className="text-text-secondary mb-4">
          We can create customized catalogs for your specific requirements. Contact our team for personalized documentation.
        </p>
        <a
          href="mailto:sales@threadcart.com"
          className="text-primary font-medium hover:underline"
        >
          Contact Sales Team →
        </a>
      </div>
    </StaticPageLayout>
  );
}
