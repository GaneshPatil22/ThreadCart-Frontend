import StaticPageLayout from "../../components/StaticPageLayout";
import { BookOpen, ArrowRight } from "lucide-react";
import { CONTACT } from "../../utils/constants";

interface Guide {
  title: string;
  description: string;
  topics: string[];
}

const guides: Guide[] = [
  {
    title: "How to Choose the Right Bolt Grade",
    description: "A comprehensive guide to understanding bolt grades, tensile strength, and selecting the appropriate grade for your application.",
    topics: ["Grade markings", "Tensile strength", "Application matching", "Safety factors"]
  },
  {
    title: "Thread Types and Standards Explained",
    description: "Learn about different thread standards including Metric, UNC, UNF, and specialty threads.",
    topics: ["Metric vs Imperial", "Thread pitch", "Thread class", "Common applications"]
  },
  {
    title: "Material Selection for Fasteners",
    description: "Understanding different materials and their properties to make the right choice for your environment.",
    topics: ["Carbon steel", "Stainless steel", "Brass & Bronze", "Specialty alloys"]
  },
  {
    title: "Corrosion Protection Guide",
    description: "Explore various coating and plating options to protect your fasteners from corrosion.",
    topics: ["Zinc plating", "Hot-dip galvanizing", "Dacromet", "Stainless alternatives"]
  },
  {
    title: "Torque and Preload Fundamentals",
    description: "Master the basics of proper torque application and understanding preload in bolted joints.",
    topics: ["Torque calculation", "Lubrication effects", "Torque patterns", "Common mistakes"]
  },
  {
    title: "Fastener Sizing and Measurement",
    description: "Learn how to properly measure and specify fasteners including diameter, length, and thread dimensions.",
    topics: ["Diameter measurement", "Length conventions", "Thread measurement", "Head dimensions"]
  }
];

export default function BuyingGuidesPage() {
  return (
    <StaticPageLayout title="Buying Guides">
      <p className="text-lg mb-8">
        Our buying guides help you make informed decisions when selecting fasteners for your projects.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {guides.map((guide, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3 mb-3">
              <BookOpen className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <h3 className="font-semibold text-text-primary">{guide.title}</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4">{guide.description}</p>
            <div className="mb-4">
              <p className="text-xs font-medium text-text-primary mb-2">Topics covered:</p>
              <div className="flex flex-wrap gap-2">
                {guide.topics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-xs bg-background px-2 py-1 rounded text-text-secondary"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <button className="flex items-center text-primary text-sm font-medium hover:underline">
              Read Guide <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-primary/10 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-text-primary mb-2">Need Expert Advice?</h3>
        <p className="text-text-secondary">
          Our technical team is available to help you select the right products for your specific requirements.
          Contact us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
        </p>
      </div>
    </StaticPageLayout>
  );
}
