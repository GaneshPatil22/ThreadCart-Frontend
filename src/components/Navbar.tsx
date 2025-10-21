import { Bolt } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-border shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <Bolt className="w-6 h-6 text-white" />
            <span className="font-semibold text-lg text-white">Thread Cart</span>
          </Link>

          <Link to="/subcategory" className="text-white hover:text-blue-200">
            Catalog
          </Link>
          <a href="#" className="text-white hover:text-blue-50">
            Help
          </a>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          <button className="text-white hover:text-blue-50">Register</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:text-blue-50">
            Sign In
          </button>
        </div>
      </nav>
    </header>
  );
}
