import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Access Denied
        </h2>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. This area is restricted to
          administrators only.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
