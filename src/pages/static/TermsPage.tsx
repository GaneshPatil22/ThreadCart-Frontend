import StaticPageLayout from "../../components/StaticPageLayout";
import { CONTACT } from "../../utils/constants";

export default function TermsPage() {
  return (
    <StaticPageLayout title="Terms of Use">
      <p className="text-sm text-text-secondary mb-8">Last updated: December 2024</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using ThreadCart ("the Website"), you accept and agree to be bound by these Terms of Use.
          If you do not agree to these terms, please do not use our website or services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">2. Use of the Website</h2>
        <p className="mb-4">You agree to use this website only for lawful purposes and in accordance with these Terms. You agree not to:</p>
        <ul className="space-y-2 ml-4">
          <li>• Use the website in any way that violates applicable laws or regulations</li>
          <li>• Attempt to gain unauthorized access to any part of the website</li>
          <li>• Use the website to transmit any harmful or malicious content</li>
          <li>• Interfere with or disrupt the website's functionality</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">3. Account Registration</h2>
        <p className="mb-4">
          To access certain features, you may need to create an account. You are responsible for maintaining the
          confidentiality of your account credentials and for all activities under your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">4. Product Information</h2>
        <p className="mb-4">
          We strive to provide accurate product descriptions, specifications, and pricing. However, we do not warrant
          that product descriptions or other content is accurate, complete, or error-free. Prices are subject to change
          without notice.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">5. Orders and Payment</h2>
        <p className="mb-4">
          All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order
          for any reason. Payment must be received in full before order processing.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">6. Intellectual Property</h2>
        <p className="mb-4">
          All content on this website, including text, images, logos, and software, is the property of ThreadCart
          and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative
          works without our written permission.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">7. Limitation of Liability</h2>
        <p className="mb-4">
          ThreadCart shall not be liable for any indirect, incidental, special, or consequential damages arising
          from your use of the website or products purchased through it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">8. Changes to Terms</h2>
        <p className="mb-4">
          We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting.
          Your continued use of the website constitutes acceptance of the modified terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">9. Contact Information</h2>
        <p>
          For questions about these Terms, please contact us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
        </p>
      </section>
    </StaticPageLayout>
  );
}
