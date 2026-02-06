import StaticPageLayout from "../../components/StaticPageLayout";
import { CONTACT, COMPANY } from "../../utils/constants";

export default function CookiePolicyPage() {
  return (
    <StaticPageLayout title="Cookie Policy">
      <p className="text-sm text-text-secondary mb-8">Last updated: February 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">1. What Are Cookies?</h2>
        <p className="mb-4">
          Cookies are small text files that are stored on your device when you visit a website. They help websites
          remember your preferences and improve your browsing experience. {COMPANY.NAME} uses cookies to provide you
          with a better, more personalized shopping experience.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">2. Types of Cookies We Use</h2>

        <div className="mb-4">
          <h3 className="font-semibold text-text-primary mb-2">Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core features like user
            authentication, shopping cart functionality, and secure checkout. Without these cookies, the website
            cannot operate correctly.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-text-primary mb-2">Analytics Cookies</h3>
          <p>
            We use Google Analytics to understand how visitors interact with our website. These cookies collect
            information about pages visited, time spent on the site, and how you arrived at our website. This helps
            us improve our services.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-text-primary mb-2">Functional Cookies</h3>
          <p>
            These cookies remember your preferences and choices (such as language or region) to provide a more
            personalized experience.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">3. Third-Party Cookies</h2>
        <p className="mb-4">
          Some cookies on our website are set by third-party services we use:
        </p>
        <ul className="space-y-2 ml-4">
          <li>• <strong>Google Analytics:</strong> For website traffic analysis and user behavior insights.</li>
          <li>• <strong>Supabase:</strong> For user authentication and session management.</li>
          <li>• <strong>Razorpay:</strong> For secure payment processing during checkout.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">4. Cookie Duration</h2>
        <p className="mb-4">Cookies can be either:</p>
        <ul className="space-y-2 ml-4">
          <li>• <strong>Session Cookies:</strong> Temporary cookies that are deleted when you close your browser.</li>
          <li>• <strong>Persistent Cookies:</strong> Cookies that remain on your device for a set period or until you delete them.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">5. Managing Cookies</h2>
        <p className="mb-4">
          You can control and manage cookies in several ways:
        </p>
        <ul className="space-y-2 ml-4">
          <li>• <strong>Browser Settings:</strong> Most browsers allow you to view, manage, and delete cookies through their settings.</li>
          <li>• <strong>Opt-Out Links:</strong> You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.</li>
        </ul>
        <p className="mt-4">
          Please note that disabling certain cookies may affect the functionality of our website and your user experience.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">6. Updates to This Policy</h2>
        <p className="mb-4">
          We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated
          revision date.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">7. Contact Us</h2>
        <p>
          If you have questions about our use of cookies, please contact us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
        </p>
      </section>
    </StaticPageLayout>
  );
}
