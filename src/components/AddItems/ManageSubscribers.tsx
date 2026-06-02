import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { LEAD_CAPTURE } from "../../utils/constants";

interface Subscriber {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  interests: string[];
  source: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: "active" | "unsubscribed";
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-700" },
  {
    value: "unsubscribed",
    label: "Unsubscribed",
    color: "bg-gray-100 text-gray-600",
  },
] as const;

const interestLabel = (id: string): string =>
  LEAD_CAPTURE.INTERESTS.find((i) => i.id === id)?.label ?? id;

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const csvEscape = (value: string): string => {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const downloadCsv = (rows: Subscriber[]) => {
  const header = [
    "email",
    "name",
    "phone",
    "interests",
    "source",
    "status",
    "page_url",
    "created_at",
  ];
  const lines = rows.map((r) =>
    [
      r.email,
      r.name ?? "",
      r.phone ?? "",
      r.interests.join("; "),
      r.source ?? "",
      r.status,
      r.page_url ?? "",
      r.created_at,
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `threadcart-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function ManageSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [copiedHint, setCopiedHint] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Error fetching subscribers: " + error.message);
    } else {
      setSubscribers((data as Subscriber[]) || []);
    }
    setLoading(false);
  };

  const handleStatusToggle = async (sub: Subscriber) => {
    const newStatus: Subscriber["status"] =
      sub.status === "active" ? "unsubscribed" : "active";

    const { error } = await supabase
      .from("email_subscribers")
      .update({ status: newStatus })
      .eq("id", sub.id);

    if (error) {
      alert("Error updating status: " + error.message);
      return;
    }
    setSubscribers((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s)),
    );
  };

  const handleDelete = async (sub: Subscriber) => {
    const ok = window.confirm(
      `Permanently delete ${sub.email}? This cannot be undone.`,
    );
    if (!ok) return;

    const { error } = await supabase
      .from("email_subscribers")
      .delete()
      .eq("id", sub.id);

    if (error) {
      alert("Error deleting subscriber: " + error.message);
      return;
    }
    setSubscribers((prev) => prev.filter((s) => s.id !== sub.id));
  };

  const filtered =
    filterStatus === "all"
      ? subscribers
      : subscribers.filter((s) => s.status === filterStatus);

  const statusCounts = subscribers.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const copyActiveEmails = async () => {
    const emails = subscribers
      .filter((s) => s.status === "active")
      .map((s) => s.email)
      .join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedHint(true);
      window.setTimeout(() => setCopiedHint(false), 1500);
    } catch {
      alert("Could not copy to clipboard.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 className="text-xl font-semibold">Email Subscribers</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyActiveEmails}
            disabled={!statusCounts.active}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copiedHint ? "Copied!" : "Copy active emails"}
          </button>
          <button
            onClick={() => downloadCsv(filtered)}
            disabled={!filtered.length}
            className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <span className="text-sm text-gray-500">{subscribers.length} total</span>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1 rounded-full text-sm transition ${
            filterStatus === "all"
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({subscribers.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              filterStatus === s.value
                ? "bg-gray-800 text-white"
                : `${s.color} hover:opacity-80`
            }`}
          >
            {s.label} ({statusCounts[s.value] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {filterStatus === "all"
            ? "No subscribers yet."
            : `No ${filterStatus} subscribers.`}
        </p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <div
                key={sub.id}
                className={`border rounded-lg bg-white shadow-sm hover:shadow-md transition ${
                  sub.status === "unsubscribed" ? "opacity-60" : ""
                }`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <a
                          href={`mailto:${sub.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-text-primary hover:underline truncate"
                        >
                          {sub.email}
                        </a>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            sub.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {sub.status}
                        </span>
                        {sub.source && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                            {sub.source}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {sub.name ? `${sub.name} · ` : ""}
                        {sub.phone ? `${sub.phone} · ` : ""}
                        {formatDate(sub.created_at)}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${
                        isExpanded ? "rotate-180" : ""
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

                {isExpanded && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sub.name && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase">
                            Name
                          </label>
                          <p>{sub.name}</p>
                        </div>
                      )}
                      {sub.phone && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase">
                            Phone
                          </label>
                          <p>
                            <a
                              href={`tel:${sub.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {sub.phone}
                            </a>
                          </p>
                        </div>
                      )}
                      {sub.page_url && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase">
                            Signed up from
                          </label>
                          <p className="font-mono text-xs truncate">{sub.page_url}</p>
                        </div>
                      )}
                      {sub.source && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase">
                            Trigger source
                          </label>
                          <p>{sub.source}</p>
                        </div>
                      )}
                    </div>

                    {sub.interests.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">
                          Interests
                        </label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sub.interests.map((i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs"
                            >
                              {interestLabel(i)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {sub.user_agent && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">
                          User agent
                        </label>
                        <p className="font-mono text-xs text-gray-600 break-all">
                          {sub.user_agent}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <button
                        onClick={() => handleStatusToggle(sub)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        {sub.status === "active"
                          ? "Mark Unsubscribed"
                          : "Mark Active"}
                      </button>
                      <button
                        onClick={() => handleDelete(sub)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 pt-1">
                      Last updated: {formatDate(sub.updated_at)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
