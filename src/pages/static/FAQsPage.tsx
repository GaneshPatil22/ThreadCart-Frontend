import { useState } from "react";
import StaticPageLayout from "../../components/StaticPageLayout";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CONTACT } from "../../utils/constants";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What types of fasteners do you offer?",
    answer: "We offer a comprehensive range of industrial fasteners including bolts, nuts, screws, washers, threaded rods, anchors, and specialty fasteners. Our products come in various materials like stainless steel, carbon steel, brass, and more."
  },
  {
    question: "Do you provide CAD files for your products?",
    answer: "Yes! We provide ready-to-use CAD models for all our fasteners. This ensures faster design integration, accurate fitment, and seamless workflow for engineers and designers."
  },
  {
    question: "What is your delivery time?",
    answer: "We offer express delivery within 24 hours for metro cities and select locations. Standard delivery takes 3-5 business days. Bulk orders may have customized delivery schedules."
  },
  {
    question: "Do you provide material test certificates?",
    answer: "Yes, we provide material and test certificates with every order upon request. This ensures full traceability and quality assurance for your projects."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods including credit/debit cards, UPI, net banking, and bank transfers. For bulk orders, we also offer credit terms for verified businesses."
  },
  {
    question: "Can I get a quote for bulk orders?",
    answer: `Absolutely! For bulk orders, please contact our sales team at ${CONTACT.EMAIL} with your requirements. We offer competitive pricing and customized solutions for large quantity orders.`
  },
  {
    question: "Do you ship across India?",
    answer: "Yes, we deliver to all major cities and towns across India. We also offer international shipping for select products. Contact us for international shipping queries."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you will receive a tracking number via email and SMS. You can use this to track your shipment on our website or the courier partner's website."
  },
  {
    question: "Do you offer technical support?",
    answer: `Yes, our technical team is available to help you choose the right fasteners for your application. Contact us at ${CONTACT.EMAIL} or call our helpline at ${CONTACT.PHONE} for assistance.`
  }
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-medium text-text-primary">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0 ml-4" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-background border-t border-border">
          <p className="text-text-secondary">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <StaticPageLayout title="Frequently Asked Questions">
      <p className="text-lg mb-8">
        Find answers to commonly asked questions about our products, services, and policies.
      </p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} faq={faq} />
        ))}
      </div>

      <div className="mt-12 bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-text-primary mb-2">Still have questions?</h3>
        <p>
          Can't find what you're looking for? Contact our support team at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
        </p>
      </div>
    </StaticPageLayout>
  );
}
