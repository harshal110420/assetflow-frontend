import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Filter, RotateCcw, ChevronDown } from "lucide-react";
import {
    fetchAuditLogs,
    loadMoreAuditLogs,
    setFilters,
    resetFilters,
    setSelectedLog,
    clearSelectedLog,
    fetchLogDetail,
} from "../store/slices/auditLogSlice";
import AuditLogDrawer from "../components/AuditLogDrawer";

// ── Constants ─────────────────────────────────────────────────────────────────

const ENTITY_TYPES = [
    "Asset", "Employee", "User", "Department",
    "Location", "Division", "Category", "Maintenance", "ApprovalRequest", "Setting"
];

const ACTIONS = [
    "CREATE", "UPDATE", "DELETE",
    "ASSIGN", "UNASSIGN", "APPROVE", "REJECT",
];

const ACTION_COLORS = {
    CREATE: { bg: "rgba(22,163,74,0.1)", color: "var(--success)" },
    UPDATE: { bg: "rgba(37,99,235,0.1)", color: "var(--accent)" },
    DELETE: { bg: "rgba(239,68,68,0.1)", color: "var(--danger)" },
    ASSIGN: { bg: "rgba(124,58,237,0.1)", color: "#a78bfa" },
    UNASSIGN: { bg: "rgba(100,116,139,0.1)", color: "var(--text-muted)" },
    APPROVE: { bg: "rgba(22,163,74,0.1)", color: "var(--success)" },
    REJECT: { bg: "rgba(239,68,68,0.1)", color: "var(--danger)" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActionBadge({ action }) {
    const style = ACTION_COLORS[action] || {
        bg: "var(--bg-hover)",
        color: "var(--text-muted)",
    };
    return (
        <span
            style={{
                background: style.bg,
                color: style.color,
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.03em",
            }}
        >
            {action}
        </span>
    );
}

function EmptyState({ hasFetched }) {
    if (!hasFetched) {
        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    color: "var(--text-muted)",
                }}
            >
                <Filter size={40} style={{ marginBottom: 16, opacity: 0.4 }} />
                <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                    Apply filters to view audit logs
                </p>
                <p style={{ fontSize: 13 }}>
                    Select date range, entity type, or action and click Run Query
                </p>
            </div>
        );
    }
    return (
        <div
            style={{
                textAlign: "center",
                padding: "80px 20px",
                color: "var(--text-muted)",
            }}
        >
            <p style={{ fontSize: 15 }}>No logs found for the selected filters</p>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditLogs() {
    const dispatch = useDispatch();
    const {
        logs,
        filters,
        pagination,
        loading,
        loadingMore,
        hasFetched,
        selectedLog,
        selectedLogDetail,
        loadingDetail,
    } = useSelector((s) => s.auditLog);

    // Search input local state — debounce ke liye
    const [searchInput, setSearchInput] = useState(filters.search || "");
    const [searchTimer, setSearchTimer] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleFilterChange = (key, value) => {
        dispatch(setFilters({ [key]: value }));
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchInput(val);
        if (searchTimer) clearTimeout(searchTimer);
        const timer = setTimeout(() => {
            dispatch(setFilters({ search: val }));
        }, 500);
        setSearchTimer(timer);
    };

    const handleRunQuery = () => {
        dispatch(fetchAuditLogs(filters));
    };

    const handleReset = () => {
        setSearchInput("");
        dispatch(resetFilters());
    };

    const handleLoadMore = () => {
        dispatch(
            loadMoreAuditLogs({
                filters,
                cursor: pagination.nextCursor,
            })
        );
    };

    const handleRowClick = (log) => {
        dispatch(setSelectedLog(log));
        dispatch(fetchLogDetail(log.id)); // drawer open hote hi detail fetch
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        dispatch(clearSelectedLog());
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{ maxWidth: "100%" }}>

            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                    Audit Logs
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    Track all changes across your organization
                </p>
            </div>

            {/* Filter Bar */}
            <div
                className="card"
                style={{ marginBottom: 20, padding: 20 }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                        gap: 12,
                        marginBottom: 12,
                    }}
                >
                    {/* Entity Type */}
                    <div className="form-group">
                        <label className="form-label">Entity Type</label>
                        <select
                            className="form-select"
                            value={filters.entityType}
                            onChange={(e) => handleFilterChange("entityType", e.target.value)}
                        >
                            <option value="">All Types</option>
                            {ENTITY_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action */}
                    <div className="form-group">
                        <label className="form-label">Action</label>
                        <select
                            className="form-select"
                            value={filters.action}
                            onChange={(e) => handleFilterChange("action", e.target.value)}
                        >
                            <option value="">All Actions</option>
                            {ACTIONS.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="form-group">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                        />
                    </div>

                    {/* Date To */}
                    <div className="form-group">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                        />
                    </div>

                    {/* Search */}
                    <div className="form-group">
                        <label className="form-label">Search Description</label>
                        <div style={{ position: "relative" }}>
                            <Search
                                size={14}
                                style={{
                                    position: "absolute",
                                    left: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)",
                                }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Min 3 characters..."
                                value={searchInput}
                                onChange={handleSearchChange}
                                style={{ paddingLeft: 32 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleReset}>
                        <RotateCcw size={14} />
                        Reset
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleRunQuery}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                            <Filter size={14} />
                        )}
                        Run Query
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                        <div className="spinner" style={{ margin: "0 auto" }} />
                    </div>
                ) : logs.length === 0 ? (
                    <EmptyState hasFetched={hasFetched} />
                ) : (
                    <>
                        {/* Result count */}
                        <div
                            style={{
                                padding: "12px 20px",
                                borderBottom: "1px solid var(--border)",
                                fontSize: 13,
                                color: "var(--text-muted)",
                            }}
                        >
                            Showing {logs.length} logs
                            {pagination.hasMore && " — more available"}
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: "auto" }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>Description</th>
                                        <th>User</th>
                                        <th>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            onClick={() => handleRowClick(log)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <td
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--text-muted)",
                                                    whiteSpace: "nowrap",
                                                    fontFamily: "JetBrains Mono, monospace",
                                                }}
                                            >
                                                {new Date(log.createdAt).toLocaleString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td>
                                                <ActionBadge action={log.action} />
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    {log.entityType}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: "var(--text-muted)",
                                                        marginLeft: 6,
                                                        fontFamily: "JetBrains Mono, monospace",
                                                    }}
                                                >
                                                    #{log.entityId.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    maxWidth: 300,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    fontSize: 13,
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                {log.description || "—"}
                                            </td>
                                            <td style={{ fontSize: 13 }}>
                                                {log.user
                                                    ? `${log.user.firstName} ${log.user.lastName}`
                                                    : "System"}
                                            </td>
                                            <td
                                                style={{
                                                    fontSize: 11,
                                                    color: "var(--text-muted)",
                                                    fontFamily: "JetBrains Mono, monospace",
                                                }}
                                            >
                                                {log.ipAddress || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Load More */}
                        {pagination.hasMore && (
                            <div
                                style={{
                                    padding: 16,
                                    textAlign: "center",
                                    borderTop: "1px solid var(--border)",
                                }}
                            >
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <span className="spinner" style={{ width: 14, height: 14 }} />
                                    ) : (
                                        <ChevronDown size={14} />
                                    )}
                                    Load More
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Side Drawer */}
            <AuditLogDrawer
                open={drawerOpen}
                log={selectedLog}
                detail={selectedLogDetail}
                loading={loadingDetail}
                onClose={handleDrawerClose}
            />
        </div>
    );
}