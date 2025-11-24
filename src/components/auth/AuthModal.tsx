import { useState } from "react";
import supabase from "../../utils/supabase";

interface AuthModalProps {
  mode: "signin" | "register";
  onClose: () => void;
  onSwitchMode: () => void;
}

export default function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrorMsg(error instanceof Error ? error.message : "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        // ✅ Login logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        alert("✅ Signed in successfully!");
        console.log("User:", data.user);
        onClose();
      } else {
        // ✅ Register logic
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm-email`,
            data: {
              full_name: formData.name,
              phone: formData.phone,
            },
          },
        });

        if (error) throw error;

        console.log("User:", data.user);
        setRegistrationSuccess(true);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        {registrationSuccess ? (
          // Registration Success View
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Check Your Email!
            </h2>
            <p className="text-gray-600 mb-2">
              We've sent a confirmation email to:
            </p>
            <p className="text-gray-900 font-semibold mb-6">{formData.email}</p>
            <p className="text-gray-600 mb-8 text-sm">
              Click the confirmation link in the email to activate your account.
              If you don't see it, check your spam folder.
            </p>
            <button
              onClick={onClose}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition"
            >
              Got it!
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-400"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-400"
                required
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-400"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-400"
            required
          />

          {mode === "register" && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-400"
              required
            />
          )}

          {errorMsg && (
            <p className="text-sm text-center text-red-500">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
          >
            {loading
              ? mode === "signin"
                ? "Signing In..."
                : "Registering..."
              : mode === "signin"
              ? "Sign In"
              : "Register"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <span
                onClick={onSwitchMode}
                className="text-red-500 cursor-pointer hover:underline"
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                onClick={onSwitchMode}
                className="text-red-500 cursor-pointer hover:underline"
              >
                Sign In
              </span>
            </>
          )}
        </p>
        </>
        )}
      </div>
    </div>
  );
}
