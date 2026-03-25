import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    ArrowLeft,
    User,
    Package,
    RotateCcw,
    Activity,
    Calendar,
    MapPin,
    Briefcase,
    Clock,
    CheckCircle,
    XCircle,
    UserCheck,
    UserX,
    Tag,
    DollarSign,
    ChevronDown,
    ChevronUp,
    RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Timeline Event Config ─────────────────────────────────────────────────────
const EVENT_CONFIG = {
    EMPLOYEE_CREATED: { icon: UserCheck, color: "#7c3aed", label: "Onboarded" },
    FIRST_ASSET_ASSIGNED: { icon: Package, color: "#00d68f", label: "First Asset" },
    ASSET_ASSIGNED: { icon: Package, color: "#00d68f", label: "Asset Assigned" },
    ASSET_RETURNED: { icon: RotateCcw, color: "#ff8c42", label: "Asset Returned" },
    ASSET_ACTIVE_HOLDING: { icon: CheckCircle, color: "#339af0", label: "Holding" },
    EMPLOYEE_DEACTIVATED: { icon: UserX, color: "#ff4757", label: "Deactivated" },
};

// ── Timeline Event Component (same pattern as AssetDetailPage) ────────────────
function TimelineEvent({ event, isLast }) {
    const [expanded, setExpanded] = useState(false);
    const config = EVENT_CONFIG[event.type] || {
        icon: Activity,
        color: "#64748b",
        label: event.type,
    };
    const Icon = config.icon;

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
            : "—";

    const formatCurrency = (v) =>
        v ? `₹${parseFloat(v).toLocaleString("en-IN")}` : null;

    const renderDetails = () => {
        const d = event.details;
        const rows = [];

        if (event.type === "EMPLOYEE_CREATED") {
            if (d.employeeCode) rows.push({ label: "Employee Code", value: d.employeeCode });
            if (d.designation) rows.push({ label: "Designation", value: d.designation });
            if (d.department) rows.push({ label: "Department", value: d.department });
            if (d.location) rows.push({ label: "Branch", value: d.location });
            if (d.addedBy) rows.push({ label: "Added By", value: d.addedBy });
        }

        if (event.type === "FIRST_ASSET_ASSIGNED" || event.type === "ASSET_ASSIGNED") {
            if (d.assetName) rows.push({ label: "Asset", value: d.assetName });
            if (d.assetCategory) rows.push({ label: "Category", value: d.assetCategory });
            if (d.assetCondition) rows.push({ label: "Condition", value: d.assetCondition });
            if (d.currentValue) rows.push({ label: "Value", value: formatCurrency(d.currentValue) });
            if (d.assignedBy) rows.push({ label: "Assigned By", value: d.assignedBy });
            if (d.purpose) rows.push({ label: "Purpose", value: d.purpose });
            // if (d.expectedReturnDate)
            //     rows.push({
            //         label: "Expected Return",
            //         value: new Date(d.expectedReturnDate).toLocaleDateString("en-IN"),
            //     });
            if (d.conditionAtAssignment)
                rows.push({ label: "Condition at Assignment", value: d.conditionAtAssignment });
        }

        if (event.type === "ASSET_RETURNED") {
            if (d.assetName) rows.push({ label: "Asset", value: d.assetName });
            if (d.conditionAtReturn) rows.push({ label: "Condition on Return", value: d.conditionAtReturn });
            if (d.durationDays !== null && d.durationDays !== undefined)
                rows.push({ label: "Used For", value: `${d.durationDays} days` });
        }

        if (event.type === "ASSET_ACTIVE_HOLDING") {
            if (d.assetName) rows.push({ label: "Asset", value: d.assetName });
            if (d.since)
                rows.push({
                    label: "Since",
                    value: new Date(d.since).toLocaleDateString("en-IN"),
                });
            if (d.daysHeld !== null && d.daysHeld !== undefined)
                rows.push({ label: "Days Held", value: `${d.daysHeld} days` });
            if (d.conditionAtAssignment)
                rows.push({ label: "Condition", value: d.conditionAtAssignment });
        }

        if (event.type === "EMPLOYEE_DEACTIVATED") {
            if (d.deactivatedBy) rows.push({ label: "Deactivated By", value: d.deactivatedBy });
        }

        return rows;
    };

    const details = renderDetails();

    return (
        <div style={{ display: "flex", gap: 0 }}>
            {/* Icon + connector line */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginRight: 16,
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `${config.color}18`,
                        border: `2px solid ${config.color}50`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 0 12px ${config.color}25`,
                        flexShrink: 0,
                    }}
                >
                    <Icon size={18} color={config.color} />
                </div>
                {!isLast && (
                    <div
                        style={{
                            width: 2,
                            flex: 1,
                            minHeight: 24,
                            background: "linear-gradient(to bottom, var(--border), transparent)",
                            margin: "4px 0",
                        }}
                    />
                )}
            </div>

            {/* Event card */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                <div
                    style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: "14px 16px",
                        cursor: details.length > 0 ? "pointer" : "default",
                        transition: "border-color 0.15s",
                    }}
                    onClick={() => details.length > 0 && setExpanded(!expanded)}
                    onMouseEnter={(e) => {
                        if (details.length > 0)
                            e.currentTarget.style.borderColor = `${config.color}50`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    background: `${config.color}15`,
                                    color: config.color,
                                    border: `1px solid ${config.color}30`,
                                }}
                            >
                                {config.label}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{event.title}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                {new Date(event.date).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                            {details.length > 0 && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "var(--text-muted)",
                                        transform: expanded ? "rotate(180deg)" : "none",
                                        transition: "transform 0.2s",
                                        display: "inline-block",
                                    }}
                                >
                                    ▼
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Collapsed preview */}
                    {!expanded && details.length > 0 && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                            {details
                                .slice(0, 2)
                                .map((d) => `${d.label}: ${d.value}`)
                                .join(" · ")}
                            {details.length > 2 && ` · +${details.length - 2} more`}
                        </div>
                    )}

                    {/* Expanded details */}
                    {expanded && details.length > 0 && (
                        <div
                            style={{
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: `1px solid ${config.color}20`,
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                gap: "8px 16px",
                            }}
                        >
                            {details.map((row, i) => (
                                <div key={i}>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "var(--text-muted)",
                                            marginBottom: 2,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {row.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {row.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Current Assets Card ───────────────────────────────────────────────────────
function CurrentAssetCard({ asset }) {
    return (
        <div
            style={{
                padding: "12px 14px",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "rgba(0,212,255,0.08)",
                        border: "1px solid rgba(0,212,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Package size={16} color="var(--accent)" />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{asset.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {asset.assetTag} · {asset.category}
                    </div>
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div
                    style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "rgba(0,214,143,0.1)",
                        color: "var(--success)",
                        border: "1px solid rgba(0,214,143,0.3)",
                        fontWeight: 600,
                    }}
                >
                    {asset.status}
                </div>
                {asset.currentValue && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                        ₹{parseFloat(asset.currentValue).toLocaleString("en-IN")}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/employees/${id}/asset-timeline`);
            setData(res.data.data);
        } catch (err) {
            toast.error("Failed to load employee details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading || !data) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    const { employee, timeline, currentAssets, summary } = data;

    const tabs = [
        { key: "overview", label: "📋 Overview" },
        { key: "timeline", label: "🕐 Asset History" },
    ];

    const tabStyle = (key) => ({
        padding: "10px 20px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        background: activeTab === key ? "var(--accent-glow)" : "transparent",
        color: activeTab === key ? "var(--accent)" : "var(--text-muted)",
        border:
            activeTab === key
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
            {/* ── Header ── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button
                        onClick={() => navigate("/employees")}
                        style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            padding: "8px 12px",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                        }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        {/* Avatar */}
                        <div
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--accent), var(--accent-2, #7c3aed))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#050b14",
                                flexShrink: 0,
                            }}
                        >
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                        </div>

                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 700 }}>{employee.fullName}</h2>
                                <span
                                    style={{
                                        fontSize: 12,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        background: employee.isActive
                                            ? "rgba(0,214,143,0.1)"
                                            : "rgba(255,71,87,0.1)",
                                        color: employee.isActive ? "var(--success)" : "var(--danger)",
                                        fontWeight: 600,
                                        border: `1px solid ${employee.isActive ? "rgba(0,214,143,0.3)" : "rgba(255,71,87,0.3)"}`,
                                    }}
                                >
                                    {employee.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                                {employee.employeeCode && (
                                    <span
                                        style={{
                                            fontFamily: "monospace",
                                            color: "var(--accent)",
                                            background: "var(--accent-glow)",
                                            padding: "1px 7px",
                                            borderRadius: 5,
                                            marginRight: 8,
                                        }}
                                    >
                                        {employee.employeeCode}
                                    </span>
                                )}
                                {employee.designation}
                                {employee.department?.name ? ` · ${employee.department.name}` : ""}
                                {employee.branch?.name ? ` · ${employee.branch.name}` : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-secondary btn-sm"
                    onClick={fetchData}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* ── Current Assets Banner ── */}
            {currentAssets.length > 0 ? (
                <div
                    style={{
                        padding: "12px 18px",
                        background: "rgba(0,214,143,0.07)",
                        border: "1px solid rgba(0,214,143,0.25)",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <CheckCircle size={18} color="var(--success)" />
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                        Currently holding{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                            {currentAssets.length} asset{currentAssets.length > 1 ? "s" : ""}
                        </strong>{" "}
                        —{" "}
                        {currentAssets
                            .map((a) => a.name)
                            .slice(0, 2)
                            .join(", ")}
                        {currentAssets.length > 2 && ` +${currentAssets.length - 2} more`}
                    </span>
                </div>
            ) : (
                <div
                    style={{
                        padding: "12px 18px",
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <Package size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                        No assets currently assigned
                    </span>
                </div>
            )}

            {/* ── Tabs ── */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 12,
                }}
            >
                {tabs.map((t) => (
                    <button key={t.key} style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Personal Info */}
                    <div className="card">
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--text-muted)",
                                marginBottom: 16,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Personal Info
                        </h3>
                        {[
                            { label: "Full Name", value: employee.fullName },
                            { label: "Email", value: employee.email || "—" },
                            { label: "Designation", value: employee.designation || "—" },
                            { label: "Employment Type", value: employee.employmentType || "—" },
                            {
                                label: "Reporting Manager",
                                value: employee.reportingManager
                                    ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName} · ${employee.reportingManager.designation}`
                                    : "—",
                            },
                        ].map((row, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "8px 0",
                                    borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                                    gap: 12,
                                }}
                            >
                                <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>
                                    {row.label}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Org Info */}
                    <div className="card">
                        <h3
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--text-muted)",
                                marginBottom: 16,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Organisation
                        </h3>
                        {[
                            { label: "Department", value: employee.department?.name || "—" },
                            { label: "Branch / Location", value: employee.branch?.name || "—" },
                            {
                                label: "Divisions",
                                value:
                                    employee.divisions?.length > 0
                                        ? employee.divisions.map((d) => d.name).join(", ")
                                        : "—",
                            },
                            {
                                label: "Joined On",
                                value: employee.createdAt
                                    ? new Date(employee.createdAt).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "—",
                            },
                        ].map((row, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "8px 0",
                                    borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                                    gap: 12,
                                }}
                            >
                                <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>
                                    {row.label}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Currently Assigned Assets */}
                    {currentAssets.length > 0 && (
                        <div className="card" style={{ gridColumn: "1 / -1" }}>
                            <h3
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "var(--text-muted)",
                                    marginBottom: 14,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                Currently Assigned Assets ({currentAssets.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {currentAssets.map((asset) => (
                                    <CurrentAssetCard key={asset.id} asset={asset} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Timeline Tab ── */}
            {activeTab === "timeline" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
                    {/* Left: Timeline */}
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Asset History</h3>
                            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                Complete journey · Click any event to expand
                            </p>
                        </div>

                        {timeline.length === 0 ? (
                            <div
                                className="card"
                                style={{
                                    textAlign: "center",
                                    padding: "48px 20px",
                                    color: "var(--text-muted)",
                                }}
                            >
                                <Clock size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                                <p>No history recorded yet.</p>
                            </div>
                        ) : (
                            <div style={{ paddingLeft: 4 }}>
                                {timeline.map((event, i) => (
                                    <TimelineEvent
                                        key={i}
                                        event={event}
                                        isLast={i === timeline.length - 1}
                                    />
                                ))}

                                {/* Current status dot at bottom */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                        marginTop: 8,
                                    }}
                                >
                                    <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
                                        <div
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: "50%",
                                                background: employee.isActive ? "var(--success)" : "var(--danger)",
                                                border: `3px solid ${employee.isActive ? "rgba(0,214,143,0.4)" : "rgba(255,71,87,0.4)"}`,
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: employee.isActive ? "var(--success)" : "var(--danger)",
                                        }}
                                    >
                                        Current Status: {employee.isActive ? "Active" : "Inactive"}
                                        {currentAssets.length > 0 &&
                                            ` — ${currentAssets.length} asset${currentAssets.length > 1 ? "s" : ""} in hand`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Summary sidebar */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Summary card */}
                        <div className="card">
                            <h4
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "var(--text-muted)",
                                    marginBottom: 14,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                Summary
                            </h4>
                            {[
                                { label: "Total Assignments", value: summary.totalAssignments },
                                { label: "Active Assignments", value: summary.activeAssignments },
                                { label: "Returned", value: summary.returnedAssignments },
                                { label: "Unique Assets", value: summary.uniqueAssetsHandled },
                                {
                                    label: "Days Assets Held",
                                    value: `${summary.totalDaysAssetsHeld} days`,
                                },
                                { label: "Total Events", value: summary.totalEvents },
                            ].map((row, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "8px 0",
                                        borderBottom: i < 5 ? "1px solid var(--border)" : "none",
                                    }}
                                >
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                        {row.label}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Currently assigned assets sidebar */}
                        {currentAssets.length > 0 && (
                            <div className="card">
                                <h4
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: "var(--text-muted)",
                                        marginBottom: 14,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    Current Assets ({currentAssets.length})
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {currentAssets.map((asset) => (
                                        <CurrentAssetCard key={asset.id} asset={asset} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}