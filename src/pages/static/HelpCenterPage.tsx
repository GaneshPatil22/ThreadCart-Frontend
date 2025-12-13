import StaticPageLayout from "../../components/StaticPageLayout";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { CONTACT } from "../../utils/constants";

export default function HelpCenterPage() {
  return (
    <StaticPageLayout title="Help Center">
      <p className="text-lg mb-8">
        Welcome to the ThreadCart Help Center. We're here to assist you with any questions or concerns.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-border text-center">
          <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">Email Support</h3>
          <p className="text-sm">{CONTACT.EMAIL}</p>
          <p className="text-xs mt-2">Response within 24 hours</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border text-center">
          <Phone className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">Phone Support</h3>
          <p className="text-sm">{CONTACT.PHONE}</p>
          <p className="text-xs mt-2">Mon-Sat, 9 AM - 6 PM</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border text-center">
          <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">Live Chat</h3>
          <p className="text-sm">Chat with our team</p>
          <p className="text-xs mt-2">Available during business hours</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-text-primary mb-4">Popular Topics</h2>
      <ul className="space-y-3 mb-8">
        <li className="flex items-start">
          <span className="text-accent mr-2">•</span>
          <span>How do I track my order?</span>
        </li>
        <li className="flex items-start">
          <span className="text-accent mr-2">•</span>
          <span>What payment methods do you accept?</span>
        </li>
        <li className="flex items-start">
          <span className="text-accent mr-2">•</span>
          <span>How can I request a quote for bulk orders?</span>
        </li>
        <li className="flex items-start">
          <span className="text-accent mr-2">•</span>
          <span>Do you provide CAD files for products?</span>
        </li>
        <li className="flex items-start">
          <span className="text-accent mr-2">•</span>
          <span>What is your return policy?</span>
        </li>
      </ul>

      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-text-primary mb-2">Need More Help?</h3>
        <p>
          If you can't find the answer you're looking for, please don't hesitate to contact us directly.
          Our customer support team is always ready to help.
        </p>
      </div>
    </StaticPageLayout>
  );
}
