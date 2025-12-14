import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "read", label: "Read", color: "bg-yellow-100 text-yellow-700" },
  { value: "replied", label: "Replied", color: "bg-green-100 text-green-700" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-600" },
] as const;

export default function ManageContactSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Error fetching contact submissions");
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("contact_submissions")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: newStatus as ContactSubmission["status"] } : s
        )
      );
    }
  };

  const getStatusStyle = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredSubmissions =
    filterStatus === "all"
      ? submissions
      : submissions.filter((s) => s.status === filterStatus);

  const statusCounts = submissions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Contact Submissions</h3>
        <span className="text-sm text-gray-500">{submissions.length} total</span>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1 rounded-full text-sm transition ${
            filterStatus === "all"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({submissions.length})
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() => setFilterStatus(status.value)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              filterStatus === status.value
                ? "bg-gray-800 text-white"
                : `${status.color} hover:opacity-80`
            }`}
          >
            {status.label} ({statusCounts[status.value] || 0})
          </button>
        ))}
      </div>

      {filteredSubmissions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {filterStatus === "all"
            ? "No contact submissions yet."
            : `No ${filterStatus} submissions.`}
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              className={`border rounded-lg bg-white shadow-sm hover:shadow-md transition ${
                submission.status === "archived" ? "opacity-60" : ""
              }`}
            >
              {/* Header - Always visible */}
              <div
                className="p-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === submission.id ? null : submission.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{submission.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(
                          submission.status
                        )}`}
                      >
                        {submission.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{submission.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(submission.created_at)}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedId === submission.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === submission.id && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Email</label>
                      <p className="text-sm">
                        <a
                          href={`mailto:${submission.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {submission.email}
                        </a>
                      </p>
                    </div>
                    {submission.phone && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Phone</label>
                        <p className="text-sm">
                          <a
                            href={`tel:${submission.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {submission.phone}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase">Message</label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1 whitespace-pre-wrap">
                      {submission.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="text-sm text-gray-600">Status:</label>
                    <select
                      value={submission.status}
                      onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                      className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-gray-400 pt-1">
                    Last updated: {formatDate(submission.updated_at)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
