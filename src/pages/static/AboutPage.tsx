import StaticPageLayout from "../../components/StaticPageLayout";
import { Target, Eye, Award, Users, Package, Truck } from "lucide-react";
import { CONTACT } from "../../utils/constants";

const highlights = [
  {
    icon: Package,
    title: "Wide Product Range",
    description: "From standard bolts and nuts to specialized fastening solutions"
  },
  {
    icon: Award,
    title: "Quality Assured",
    description: "We source only certified fasteners that meet industry standards"
  },
  {
    icon: Users,
    title: "Customer First",
    description: "Personalized support and solutions for every project"
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description: "Committed to timely delivery across India"
  }
];

const values = [
  {
    icon: Award,
    title: "Quality First",
    description: "We carefully source and supply certified, tested fasteners that meet industry standards."
  },
  {
    icon: Users,
    title: "Customer Focus",
    description: "Your success is our priority. We provide personalized support and solutions for every project."
  },
  {
    icon: Target,
    title: "Reliability",
    description: "Count on us for consistent quality, timely delivery, and transparent business practices."
  }
];

export default function AboutPage() {
  return (
    <StaticPageLayout title="About Us">
      <section className="mb-12">
        <p className="text-lg mb-6">
          ThreadCart is your trusted partner for industrial fasteners, dedicated to serving businesses across India
          with quality products and reliable service.
        </p>
        <p className="mb-4">
          We started with a simple goal: to make fastener procurement easier and more reliable for businesses of all sizes.
          Whether you're a manufacturer, contractor, or engineer, we're here to provide the right fastening solutions
          for your needs.
        </p>
        <p>
          Our catalog includes a variety of fasteners—from everyday bolts and nuts to specialized hardware—all
          sourced from trusted suppliers. We believe in building long-term relationships through honest dealings,
          fair pricing, and dependable service.
        </p>
      </section>

      {/* What We Offer */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">What We Offer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {highlights.map((item, index) => (
            <div key={index} className="bg-white p-5 rounded-lg border border-border text-center">
              <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-text-primary mb-1 text-sm">{item.title}</h3>
              <p className="text-xs text-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-border">
            <Target className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Our Mission</h3>
            <p className="text-text-secondary">
              To provide businesses with reliable, quality fastening solutions backed by honest service
              and fair pricing—helping our customers build with confidence.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-border">
            <Eye className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Our Vision</h3>
            <p className="text-text-secondary">
              To become a trusted name in the fastener industry, known for integrity, quality products,
              and customer-centric service.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <div key={index} className="bg-background p-6 rounded-lg border border-border">
              <value.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold text-text-primary mb-2">{value.title}</h3>
              <p className="text-sm text-text-secondary">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/10 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-text-primary mb-2">Let's Work Together</h3>
        <p className="text-text-secondary">
          Whether you need a single part or bulk quantities, we're here to help.
          Reach out to us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
          {" "}and let's discuss how we can support your project.
        </p>
      </section>
    </StaticPageLayout>
  );
}
