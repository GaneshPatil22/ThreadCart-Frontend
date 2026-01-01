import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "./auth/AuthModal";
import supabase from "../utils/supabase";
import { isAdmin } from "../utils/adminCheck";
import { CartIcon } from "./cart/CartIcon";

export default function Navbar() {
  const [authMode, setAuthMode] = useState<"signin" | "register" | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Check login state and admin status on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      setUserEmail(user?.email ?? null);

      // Check if user is admin (pass user to avoid redundant API call)
      const adminStatus = await isAdmin(user);
      setIsUserAdmin(adminStatus);
    };
    fetchUser();

    // ✅ Realtime listener for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;

        setUserEmail(user?.email ?? null);

        // Check admin status when auth state changes (pass user to avoid redundant API call)
        const adminStatus = await isAdmin(user);
        setIsUserAdmin(adminStatus);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setIsUserAdmin(false);
    alert("You've been logged out!");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-black border-b border-border shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Left section - Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo.jpeg"
                  alt="Thread Cart Logo"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/subcategory" className="text-white hover:text-blue-200">
                Catalog
              </Link>
              {isUserAdmin && (
                <Link to="/add_item" className="text-white hover:text-blue-200">
                  Admin Panel
                </Link>
              )}
              <Link to="/help" className="text-white hover:text-blue-200">
                Help
              </Link>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cart Icon - Always visible */}
              <CartIcon />

              {/* Desktop Auth/User Section */}
              <div className="hidden md:flex items-center space-x-4">
                {userEmail ? (
                  <>
                    <Link
                      to="/orders"
                      className="text-white hover:text-blue-200 flex items-center gap-1"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      My Orders
                    </Link>
                    <span className="text-white text-sm max-w-[150px] truncate">{userEmail}</span>
                    <button
                      onClick={handleLogout}
                      className="bg-gray-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-800 text-sm"
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
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-600"
                      onClick={() => setAuthMode("signin")}
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                className="md:hidden text-white p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pb-3 border-t border-gray-700 pt-3">
              <div className="flex flex-col space-y-3">
                {/* Navigation Links */}
                <Link
                  to="/subcategory"
                  className="text-white hover:text-blue-200 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Catalog
                </Link>
                {isUserAdmin && (
                  <Link
                    to="/add_item"
                    className="text-white hover:text-blue-200 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/help"
                  className="text-white hover:text-blue-200 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Help
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-700 my-2"></div>

                {/* Auth/User Section for Mobile */}
                {userEmail ? (
                  <>
                    <Link
                      to="/orders"
                      className="text-white hover:text-blue-200 flex items-center gap-2 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      My Orders
                    </Link>
                    <div className="text-gray-400 text-sm py-1 truncate">
                      Logged in as: {userEmail}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm w-full"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <button
                      className="text-white hover:text-blue-50 py-2 text-left"
                      onClick={() => {
                        setAuthMode("register");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Register
                    </button>
                    <button
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-600 w-full"
                      onClick={() => {
                        setAuthMode("signin");
                        setMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Auth Modal */}
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={() =>
            setAuthMode(authMode === "signin" ? "register" : "signin")
          }
        />
      )}
    </>
  );
}
