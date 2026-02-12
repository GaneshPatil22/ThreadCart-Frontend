import StaticPageLayout from "../../components/StaticPageLayout";
import { Truck, Package, Clock, Shield } from "lucide-react";
import { CONTACT } from "../../utils/constants";

export default function ShippingPage() {
  return (
    <StaticPageLayout title="Shipping Information">
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-border">
          <Truck className="w-10 h-10 text-primary mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">Fast Delivery</h3>
          <p className="text-sm">Express delivery within 24 hours for select locations</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border">
          <Shield className="w-10 h-10 text-primary mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">Quality Assured</h3>
          <p className="text-sm">All products are quality checked before dispatch</p>
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
              <td className="py-2">₹1 - ₹1,000</td>
              <td className="py-2">₹80</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2">₹1,001 - ₹4,000</td>
              <td className="py-2">₹180</td>
            </tr>
            <tr>
              <td className="py-2">Above ₹4,000</td>
              <td className="py-2">₹600</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-text-primary mt-6 mb-2">Order Tracking</h3>
      <ul className="space-y-2 mb-6">
        <li>• Once your order is shipped, you will receive a tracking number via email and SMS</li>
        <li>• You can track your shipment on our website or the courier partner's website</li>
        <li>• For any delivery queries, contact our support team</li>
      </ul>

      <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
        <h3 className="font-semibold text-text-primary mb-2">Questions?</h3>
        <p>
          For any shipping queries, contact us at{" "}
          <a href={`mailto:${CONTACT.EMAIL}`} className="text-primary hover:underline">
            {CONTACT.EMAIL}
          </a>
        </p>
      </div>
    </StaticPageLayout>
  );
}
