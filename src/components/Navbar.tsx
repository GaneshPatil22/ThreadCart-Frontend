import { useEffect, useState } from "react";
import { Bolt } from "lucide-react";
import { Link } from "react-router-dom";
import AuthModal from "./auth/AuthModal";
import supabase from "../utils/supabase";

export default function Navbar() {
  const [authMode, setAuthMode] = useState<"signin" | "register" | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ✅ Check login state on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    };
    fetchUser();

    // ✅ Realtime listener for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    alert("You’ve been logged out!");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-black border-b border-border shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <Bolt className="w-6 h-6 text-white" />
              <span className="font-semibold text-lg text-white">
                Thread Cart
              </span>
            </Link>

            <Link to="/subcategory" className="text-white hover:text-blue-200">
              Catalog
            </Link>
            {userEmail && <Link to="/add_item" className="text-white hover:text-blue-200">
              Add Item
            </Link>}
            <a href="#" className="text-white hover:text-blue-50">
              Help
            </a>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {userEmail ? (
              <>
                <span className="text-white">{userEmail}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-white hover:text-blue-50"
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                  onClick={() => setAuthMode("signin")}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Auth Modal */}
      {authMode && (
        <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </>
  );
}
