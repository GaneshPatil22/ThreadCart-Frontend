import { useState } from "react";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

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
        <h1 className="text-5xl font-bold text-white mb-4">
          Perfection In Every Turn
        </h1>
        <p className="text-white max-w-6xl mx-auto mb-8">
          <h1 className="text-2xl font-normal text-white mb-4">
            For every industry - delivering reliability, certification, and speed in every order
          </h1>
        </p>

        <form onSubmit={handleSearch} className="flex justify-center max-w-xl mx-auto">
          <div className="flex w-full bg-white border border-border rounded-lg shadow-sm overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, categories..."
              className="flex-1 px-4 py-3 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-primary text-white px-5 flex items-center justify-center hover:bg-primary-hover"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

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