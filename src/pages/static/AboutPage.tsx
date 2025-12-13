import StaticPageLayout from "../../components/StaticPageLayout";
import { Target, Eye, Award, Users } from "lucide-react";
import { CONTACT } from "../../utils/constants";

const stats = [
  { value: "10+", label: "Years of Experience" },
  { value: "50,000+", label: "Products" },
  { value: "5,000+", label: "Happy Customers" },
  { value: "Pan India", label: "Delivery Network" }
];

const values = [
  {
    icon: Award,
    title: "Quality First",
    description: "We source and supply only certified, tested fasteners that meet international standards."
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
          ThreadCart is a leading supplier of industrial fasteners, serving businesses across India with premium-quality
          products and exceptional service.
        </p>
        <p className="mb-4">
          Founded with a vision to simplify fastener procurement for businesses of all sizes, we have grown into a
          trusted partner for manufacturers, contractors, and engineers nationwide. Our comprehensive catalog features
          over 50,000 products, from standard bolts and nuts to specialized fastening solutions.
        </p>
        <p>
          We combine industry expertise with modern technology to provide an seamless buying experience—complete with
          instant pricing, CAD file access, and rapid delivery across India.
        </p>
      </section>

      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-border text-center">
              <div className="text-2xl font-bold text-accent mb-1">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-border">
            <Target className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Our Mission</h3>
            <p className="text-text-secondary">
              To provide businesses with reliable, high-quality fastening solutions backed by exceptional service,
              technical expertise, and competitive pricing—enabling our customers to build with confidence.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-border">
            <Eye className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Our Vision</h3>
            <p className="text-text-secondary">
              To be India's most trusted fastener partner, known for quality, innovation, and customer-centric service,
              while contributing to the growth of Indian manufacturing.
            </p>
          </div>
        </div>
      </section>

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

      <section className="bg-primary/10 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-text-primary mb-2">Partner With Us</h3>
        <p className="text-text-secondary">
          Whether you need a single part or bulk quantities, our team is ready to help.
          Contact us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
          {" "}to discuss your requirements.
        </p>
      </section>
    </StaticPageLayout>
  );
}
