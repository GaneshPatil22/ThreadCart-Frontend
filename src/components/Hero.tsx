import { Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      className="relative border-b border-border py-16 bg-background"
      style={{
        backgroundImage: "url('/background.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Everything You Need for Your Business
        </h1>
        <p className="text-white max-w-2xl mx-auto mb-8">
          From industrial supplies to safety equipment — get quality products at unbeatable prices.
        </p>

        <div className="flex justify-center max-w-xl mx-auto">
          <div className="flex w-full bg-white border border-border rounded-lg shadow-sm overflow-hidden">
            <input
              type="text"
              placeholder="Search products, brands, or categories..."
              className="flex-1 px-4 py-3 focus:outline-none"
            />
            <button className="bg-primary text-white px-5 flex items-center justify-center hover:bg-primary-hover">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        <Link
          to="/subcategory"
          className="inline-block mt-8 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover font-medium"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}