import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

const MODULES = [
  { value: "", label: "All Modules" },
  { value: "asset_assignment", label: "Asset Assignment" },
  { value: "asset_disposal", label: "Asset Disposal" },
  { value: "asset_transfer", label: "Asset Transfer" },
  { value: "asset_purchase", label: "Asset Purchase" },
  { value: "maintenance", label: "Maintenance" },
];

// Dono files ke upar yeh helper add karo
// const getAssignedTo = (assetData) => {
//   const type = assetData?.assignmentType || assetData?.toAssignmentType;

//   switch (type) {
//     case "employee":
//       return assetData?.employeeName || assetData?.toEmployeeName || "N/A";
//     case "department":
//       return assetData?.departmentName || assetData?.toDepartmentName
//         ? `Dept: ${assetData?.departmentName || assetData?.toDepartmentName}`
//         : "N/A";
//     case "location":
//       return assetData?.locationName || assetData?.toLocationName
//         ? `Location: ${assetData?.locationName || assetData?.toLocationName}`
//         : "N/A";
//     case "pool":
//       return "Pool (Unassigned)";
//     default:
//       // fallback — jo bhi available ho
//       return (
//         assetData?.employeeName ||
//         assetData?.toEmployeeName ||
//         assetData?.departmentName ||
//         assetData?.toDepartmentName ||
//         assetData?.locationName ||
//         assetData?.toLocationName ||
//         "N/A"
//       );
//   }
// };
// ✅ AB YE KARO — targetName seedha use karo:
const getAssignedTo = (assetData) => {
  // targetName already set hai assetController mein
  if (assetData?.targetName) return assetData.targetName;

  // Fallback — agar purana data ho
  return (
    assetData?.employeeName ||
    assetData?.toEmployeeName ||
    assetData?.departmentName ||
    assetData?.locationName ||
    "N/A"
  );
};

// ── Action Modal ──────────────────────────────────────────────────────────────
function ActionModal({ request, onClose }) {
  const [action, setAction] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const actualRequestId = request.ApprovalRequest?.id || request.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action) return toast.error("Please select an action");
    setLoading(true);
    try {
      await api.post(`/approvals/${actualRequestId}/action`, {
        action,
        remarks,
      });
      toast.success(`Request ${action} successfully!`);
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const assetData =
    request.ApprovalRequest?.moduleData || request.moduleData || {};

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Take Action</h2>
          <button
            onClick={() => onClose(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            background: "var(--bg-hover)",
            borderRadius: 10,
            border: "1px solid var(--border)",
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {[
              {
                label: "Request #",
                value:
                  request.ApprovalRequest?.requestNumber ||
                  request.requestNumber,
              },
              {
                label: "Module",
                value: (request.ApprovalRequest?.module || request.module || "")
                  .replace(/_/g, " ")
                  .toUpperCase(),
              },
              { label: "Asset", value: assetData.assetName || "N/A" },
              { label: "Asset Tag", value: assetData.assetTag || "N/A" },
              { label: "Assign To", value: getAssignedTo(assetData) },
              {
                label: "Value",
                value: assetData.currentValue
                  ? `₹${parseFloat(assetData.currentValue).toLocaleString("en-IN")}`
                  : "N/A",
              },
            ].map((item, i) => (
              <div key={i}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          {assetData.purpose && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 2,
                }}
              >
                Purpose
              </div>
              <div style={{ fontSize: 13 }}>{assetData.purpose}</div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div className="form-group">
            <label className="form-label">Your Decision *</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setAction("approved")}
                style={{
                  padding: "14px",
                  borderRadius: 10,
                  border: `2px solid ${action === "approved" ? "var(--success)" : "var(--border)"}`,
                  background:
                    action === "approved"
                      ? "rgba(0,214,143,0.1)"
                      : "var(--bg-hover)",
                  color:
                    action === "approved"
                      ? "var(--success)"
                      : "var(--text-muted)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <CheckCircle size={18} /> Approve
              </button>
              <button
                type="button"
                onClick={() => setAction("rejected")}
                style={{
                  padding: "14px",
                  borderRadius: 10,
                  border: `2px solid ${action === "rejected" ? "var(--danger)" : "var(--border)"}`,
                  background:
                    action === "rejected"
                      ? "rgba(255,71,87,0.1)"
                      : "var(--bg-hover)",
                  color:
                    action === "rejected"
                      ? "var(--danger)"
                      : "var(--text-muted)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <XCircle size={18} /> Reject
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Remarks {action === "rejected" ? "*" : "(optional)"}
            </label>
            <textarea
              className="form-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder={
                action === "rejected"
                  ? "Please provide reason for rejection..."
                  : "Any comments or notes..."
              }
              style={{ resize: "vertical" }}
              required={action === "rejected"}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onClose(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${action === "approved" ? "btn-success" : action === "rejected" ? "btn-danger" : "btn-primary"}`}
              disabled={loading || !action}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />{" "}
                  Processing...
                </>
              ) : (
                `Confirm ${action || "Action"}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Request Detail Card ───────────────────────────────────────────────────────
function RequestCard({ item, isPending, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const request = item.ApprovalRequest || item;
  const assetData = request.moduleData || {};
  const stepName = item.stepName || "";

  const statusColor = {
    pending: "var(--warning)",
    approved: "var(--success)",
    rejected: "var(--danger)",
    cancelled: "var(--text-muted)",
  };

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}
    >
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "10px",
              background: isPending ? "rgba(255,183,3,0.1)" : "var(--bg-hover)",
              border: `1px solid ${isPending ? "rgba(255,183,3,0.3)" : "var(--border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock
              size={20}
              color={isPending ? "var(--warning)" : "var(--text-muted)"}
            />
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {request.requestNumber}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: `${statusColor[request.status]}20`,
                  color: statusColor[request.status],
                  fontWeight: 600,
                  border: `1px solid ${statusColor[request.status]}40`,
                }}
              >
                {(request.status || "pending").toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {(request.module || "").replace(/_/g, " ").toUpperCase()}
              </span>
              {isPending && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--accent)",
                    background: "var(--accent-glow)",
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  Step: {stepName}
                </span>
              )}
            </div>
            <div
              style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}
            >
              {assetData.assetName || "N/A"}
              {assetData.assetTag ? ` · ${assetData.assetTag}` : ""}
              {getAssignedTo(assetData) !== "N/A"
                ? ` · ${getAssignedTo(assetData)}`
                : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {request.createdAt
              ? new Date(request.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : ""}
          </span>
          {isPending && (
            <button
              className="btn btn-primary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction(item);
              }}
            >
              Take Action
            </button>
          )}
          {expanded ? (
            <ChevronUp size={16} color="var(--text-muted)" />
          ) : (
            <ChevronDown size={16} color="var(--text-muted)" />
          )}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            padding: "0 20px 16px",
            borderTop: "1px solid var(--border)",
            marginTop: 4,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginTop: 14,
            }}
          >
            {[
              {
                label: "Requested By",
                value: request.requestedBy
                  ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}`
                  : "N/A",
              },
              {
                label: "Asset Value",
                value: assetData.currentValue
                  ? `₹${parseFloat(assetData.currentValue).toLocaleString("en-IN")}`
                  : "N/A",
              },
              { label: "Assign To", value: getAssignedTo(assetData) },

              { label: "Purpose", value: assetData.purpose || "—" },
              {
                label: "Priority",
                value: (request.priority || "normal").toUpperCase(),
              },
              {
                label: "Requested On",
                value: request.createdAt
                  ? new Date(request.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A",
              },
              {
                label: "Finalized On",
                value: request.finalizedAt
                  ? new Date(request.finalizedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              },
              {
                label: "Remarks",
                value:
                  request.finalRemarks ||
                  assetData.reason ||
                  assetData.notes ||
                  "—",
              },
            ].map((f, i) => (
              <div key={i}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginBottom: 2,
                  }}
                >
                  {f.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</div>
              </div>
            ))}
          </div>

          {request.ApprovalRequestSteps?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                APPROVAL CHAIN
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {request.ApprovalRequestSteps.sort(
                  (a, b) => a.stepOrder - b.stepOrder,
                ).map((step, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        background:
                          step.status === "approved"
                            ? "rgba(0,214,143,0.1)"
                            : step.status === "rejected"
                              ? "rgba(255,71,87,0.1)"
                              : step.status === "pending"
                                ? "rgba(255,183,3,0.1)"
                                : "var(--bg-hover)",
                        color:
                          step.status === "approved"
                            ? "var(--success)"
                            : step.status === "rejected"
                              ? "var(--danger)"
                              : step.status === "pending"
                                ? "var(--warning)"
                                : "var(--text-muted)",
                        border: `1px solid ${step.status === "approved" ? "rgba(0,214,143,0.3)" : step.status === "rejected" ? "rgba(255,71,87,0.3)" : step.status === "pending" ? "rgba(255,183,3,0.3)" : "var(--border)"}`,
                      }}
                    >
                      {step.stepOrder}. {step.stepName}
                      {step.assignedTo && ` (${step.assignedTo.firstName})`}
                      {step.status !== "pending" && ` — ${step.status}`}
                    </div>
                    {i < request.ApprovalRequestSteps.length - 1 && (
                      <span style={{ color: "var(--text-muted)" }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const { user } = useSelector((s) => s.auth);

  const [pendingSteps, setPendingSteps] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionItem, setActionItem] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = !!(
    statusFilter ||
    moduleFilter ||
    fromDate ||
    toDate
  );

  const clearFilters = () => {
    setStatusFilter("");
    setModuleFilter("");
    setFromDate("");
    setToDate("");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (moduleFilter) params.module = moduleFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const [pendingRes, allRes] = await Promise.all([
        api.get("/approvals/pending"),
        api.get("/approvals", { params }),
      ]);
      setPendingSteps(pendingRes.data.data || []);
      setAllRequests(allRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, moduleFilter, fromDate, toDate]);

  const tabStyle = (tab) => ({
    padding: "8px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    background: activeTab === tab ? "var(--accent-glow)" : "transparent",
    color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
    border:
      activeTab === tab
        ? "1px solid rgba(0,212,255,0.3)"
        : "1px solid transparent",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Approval Inbox</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {pendingSteps.length > 0 ? (
              <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                ⚠️ {pendingSteps.length} action(s) pending from you
              </span>
            ) : (
              "✅ No pending approvals"
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowFilters((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: hasActiveFilters ? "var(--accent)" : undefined,
              borderColor: hasActiveFilters ? "rgba(0,212,255,0.4)" : undefined,
            }}
          >
            <Filter size={14} /> Filters
            {hasActiveFilters && (
              <span
                style={{
                  background: "var(--accent)",
                  color: "#050b14",
                  borderRadius: "50%",
                  width: 16,
                  height: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {
                  [statusFilter, moduleFilter, fromDate, toDate].filter(Boolean)
                    .length
                }
              </span>
            )}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card" style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                From Date
              </label>
              <input
                type="date"
                className="form-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ width: 150 }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                To Date
              </label>
              <input
                type="date"
                className="form-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ width: 150 }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Module
              </label>
              <select
                className="form-select"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                style={{ width: 180 }}
              >
                {MODULES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Status
              </label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 140 }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={clearFilters}
                style={{ marginTop: 18 }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {fromDate && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  From: {new Date(fromDate).toLocaleDateString("en-IN")}
                  <button
                    onClick={() => setFromDate("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--accent)",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {toDate && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  To: {new Date(toDate).toLocaleDateString("en-IN")}
                  <button
                    onClick={() => setToDate("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--accent)",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {moduleFilter && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {MODULES.find((m) => m.value === moduleFilter)?.label}
                  <button
                    onClick={() => setModuleFilter("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--accent)",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "var(--accent-glow)",
                    color: "var(--accent)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <button
                    onClick={() => setStatusFilter("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--accent)",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        <button
          style={tabStyle("pending")}
          onClick={() => setActiveTab("pending")}
        >
          Pending My Action{" "}
          {pendingSteps.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "var(--danger)",
                color: "#fff",
                borderRadius: "50%",
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              {pendingSteps.length}
            </span>
          )}
        </button>
        <button style={tabStyle("all")} onClick={() => setActiveTab("all")}>
          All Requests
          {allRequests.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              ({allRequests.length})
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : activeTab === "pending" ? (
        pendingSteps.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: "48px 20px" }}
          >
            <CheckCircle
              size={48}
              color="var(--success)"
              style={{ marginBottom: 16, opacity: 0.6 }}
            />
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>All caught up!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No approvals pending your action.
            </p>
          </div>
        ) : (
          pendingSteps.map((step) => (
            <RequestCard
              key={step.id}
              item={step}
              isPending={true}
              onAction={setActionItem}
            />
          ))
        )
      ) : allRequests.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-muted)",
          }}
        >
          {hasActiveFilters
            ? "No requests match the selected filters."
            : "No requests found."}
        </div>
      ) : (
        allRequests.map((req) => (
          <RequestCard
            key={req.id}
            item={req}
            isPending={false}
            onAction={setActionItem}
          />
        ))
      )}

      {actionItem && (
        <ActionModal
          request={actionItem}
          onClose={(refresh) => {
            setActionItem(null);
            if (refresh) fetchData();
          }}
        />
      )}
    </div>
  );
}
