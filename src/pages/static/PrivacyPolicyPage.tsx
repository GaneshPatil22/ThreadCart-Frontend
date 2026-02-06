import StaticPageLayout from "../../components/StaticPageLayout";
import { CONTACT, COMPANY } from "../../utils/constants";

export default function PrivacyPolicyPage() {
  return (
    <StaticPageLayout title="Privacy Policy">
      <p className="text-sm text-text-secondary mb-8">Last updated: February 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">1. Introduction</h2>
        <p className="mb-4">
          {COMPANY.NAME} ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">2. Information We Collect</h2>
        <p className="mb-4">We may collect information about you in various ways, including:</p>
        <ul className="space-y-2 ml-4">
          <li>• <strong>Personal Data:</strong> Name, email address, phone number, shipping address, and billing information when you create an account or place an order.</li>
          <li>• <strong>Payment Information:</strong> Payment details are processed securely through our payment partner Razorpay. We do not store your complete card details.</li>
          <li>• <strong>Usage Data:</strong> Information about how you interact with our website, including pages visited and time spent.</li>
          <li>• <strong>Device Information:</strong> Browser type, IP address, and device identifiers for security and analytics purposes.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">3. How We Use Your Information</h2>
        <p className="mb-4">We use the information we collect to:</p>
        <ul className="space-y-2 ml-4">
          <li>• Process and fulfill your orders</li>
          <li>• Send order confirmations and shipping updates</li>
          <li>• Respond to your inquiries and provide customer support</li>
          <li>• Improve our website and services</li>
          <li>• Send promotional communications (with your consent)</li>
          <li>• Prevent fraud and ensure security</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">4. Information Sharing</h2>
        <p className="mb-4">
          We do not sell your personal information. We may share your information with:
        </p>
        <ul className="space-y-2 ml-4">
          <li>• <strong>Service Providers:</strong> Shipping partners, payment processors, and analytics services that help us operate our business.</li>
          <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">5. Data Security</h2>
        <p className="mb-4">
          We implement appropriate technical and organizational measures to protect your personal information against
          unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the
          Internet is 100% secure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">6. Your Rights</h2>
        <p className="mb-4">You have the right to:</p>
        <ul className="space-y-2 ml-4">
          <li>• Access the personal information we hold about you</li>
          <li>• Request correction of inaccurate information</li>
          <li>• Request deletion of your account and associated data</li>
          <li>• Opt-out of marketing communications</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">7. Data Retention</h2>
        <p className="mb-4">
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy,
          unless a longer retention period is required by law (e.g., for tax and accounting purposes).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">8. Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
          policy on this page and updating the "Last updated" date.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
        </p>
      </section>
    </StaticPageLayout>
  );
}
