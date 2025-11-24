import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

export default function ConfirmEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the session to check if user is confirmed
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          setStatus("success");
          setMessage("Email confirmed successfully! Redirecting to home...");

          // Redirect to home after 2 seconds
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Unable to confirm email. Please try again or contact support.");
        }
      } catch (error) {
        console.error("Confirmation error:", error);
        setStatus("error");
        setMessage("An error occurred during confirmation. Please try again.");
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 animate-pulse">
              <svg
                className="w-8 h-8 text-blue-500 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Confirming Your Email
            </h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Email Confirmed!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Confirmation Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition"
            >
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
