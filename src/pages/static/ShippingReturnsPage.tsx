import StaticPageLayout from "../../components/StaticPageLayout";
import { Truck, RotateCcw, Package, Clock } from "lucide-react";
import { CONTACT } from "../../utils/constants";

export default function ShippingReturnsPage() {
  return (
    <StaticPageLayout title="Shipping & Returns">
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-border">
          <Truck className="w-10 h-10 text-primary mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">Fast Delivery</h3>
          <p className="text-sm">Express delivery within 24 hours for select locations</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <RotateCcw className="w-10 h-10 text-primary mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">Easy Returns</h3>
          <p className="text-sm">Hassle-free returns within 7 days of delivery</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-text-primary mb-4">Shipping Information</h2>

      <h3 className="font-semibold text-text-primary mt-6 mb-2">Delivery Options</h3>
      <ul className="space-y-2 mb-6">
        <li className="flex items-start">
          <Clock className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
          <span><strong>Express Delivery (24 Hours):</strong> Available for metro cities and select locations</span>
        </li>
        <li className="flex items-start">
          <Package className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
          <span><strong>Standard Delivery (3-5 Days):</strong> Available across India</span>
        </li>
      </ul>

      <h3 className="font-semibold text-text-primary mt-6 mb-2">Shipping Charges</h3>
      <div className="bg-background p-4 rounded-lg mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2">Order Value</th>
              <th className="text-left py-2">Shipping Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2">Above ₹5,000</td>
              <td className="py-2 text-green-600 font-medium">FREE</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2">₹2,000 - ₹5,000</td>
              <td className="py-2">₹99</td>
            </tr>
            <tr>
              <td className="py-2">Below ₹2,000</td>
              <td className="py-2">₹199</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Return Policy</h2>

      <h3 className="font-semibold text-text-primary mt-6 mb-2">Eligibility</h3>
      <ul className="space-y-2 mb-6">
        <li>• Items must be returned within 7 days of delivery</li>
        <li>• Products must be unused and in original packaging</li>
        <li>• All tags and labels must be intact</li>
        <li>• Custom orders and bulk orders may have different return policies</li>
      </ul>

      <h3 className="font-semibold text-text-primary mt-6 mb-2">How to Return</h3>
      <ol className="space-y-2 mb-6 list-decimal list-inside">
        <li>Contact our support team at {CONTACT.EMAIL}</li>
        <li>Provide your order number and reason for return</li>
        <li>Receive return authorization and shipping label</li>
        <li>Pack items securely and ship using provided label</li>
        <li>Refund processed within 5-7 business days after inspection</li>
      </ol>

      <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-text-primary mb-2">Questions?</h3>
        <p>
          For any shipping or return queries, contact us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
        </p>
      </div>
    </StaticPageLayout>
  );
}
