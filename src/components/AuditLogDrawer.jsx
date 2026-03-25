import React from "react";
import { X, User, Monitor, Clock } from "lucide-react";

// ── Diff Renderer ─────────────────────────────────────────────────────────────

function DiffView({ oldValues, newValues }) {
    if (!oldValues && !newValues) return null;

    const allKeys = Array.from(
        new Set([
            ...Object.keys(oldValues || {}),
            ...Object.keys(newValues || {}),
        ])
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {allKeys.map((key) => {
                const oldVal = oldValues?.[key];
                const newVal = newValues?.[key];
                const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                return (
                    <div
                        key={key}
                        style={{
                            borderRadius: 8,
                            overflow: "hidden",
                            border: `1px solid ${changed ? "var(--border)" : "var(--border-light)"}`,
                            opacity: changed ? 1 : 0.5,
                        }}
                    >
                        {/* Field name */}
                        <div
                            style={{
                                padding: "6px 12px",
                                background: "var(--bg-hover)",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                            }}
                        >
                            {key}
                        </div>

                        {changed ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                {/* Old value */}
                                <div
                                    style={{
                                        padding: "8px 12px",
                                        background: "rgba(239,68,68,0.05)",
                                        borderRight: "1px solid var(--border-light)",
                                        fontSize: 12,
                                        color: "var(--danger)",
                                        fontFamily: "JetBrains Mono, monospace",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {oldVal !== undefined && oldVal !== null
                                        ? String(oldVal)
                                        : <span style={{ opacity: 0.4 }}>empty</span>}
                                </div>
                                {/* New value */}
                                <div
                                    style={{
                                        padding: "8px 12px",
                                        background: "rgba(22,163,74,0.05)",
                                        fontSize: 12,
                                        color: "var(--success)",
                                        fontFamily: "JetBrains Mono, monospace",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {newVal !== undefined && newVal !== null
                                        ? String(newVal)
                                        : <span style={{ opacity: 0.4 }}>empty</span>}
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: "8px 12px",
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    fontFamily: "JetBrains Mono, monospace",
                                }}
                            >
                                {oldVal !== undefined ? String(oldVal) : "—"}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export default function AuditLogDrawer({ open, log, detail, loading, onClose }) {
    if (!open || !log) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(5,11,20,0.5)",
                    zIndex: 200,
                    backdropFilter: "blur(2px)",
                }}
            />

            {/* Drawer panel */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100vh",
                    width: 480,
                    background: "var(--bg-card)",
                    borderLeft: "1px solid var(--border)",
                    zIndex: 201,
                    display: "flex",
                    flexDirection: "column",
                    animation: "slideInRight 0.25s ease",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                    }}
                >
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Log Detail</h3>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            {log.entityType} — {log.action}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-muted)",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Meta info */}
                <div
                    style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <Clock size={14} style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-muted)" }}>
                            {new Date(log.createdAt).toLocaleString("en-IN", {
                                dateStyle: "long",
                                timeStyle: "medium",
                            })}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <User size={14} style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>
                            {log.user
                                ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
                                : "System"}
                        </span>
                    </div>
                    {log.ipAddress && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <Monitor size={14} style={{ color: "var(--text-muted)" }} />
                            <span
                                style={{
                                    color: "var(--text-muted)",
                                    fontFamily: "JetBrains Mono, monospace",
                                    fontSize: 12,
                                }}
                            >
                                {log.ipAddress}
                            </span>
                        </div>
                    )}
                    {log.description && (
                        <p
                            style={{
                                fontSize: 13,
                                color: "var(--text-secondary)",
                                background: "var(--bg-hover)",
                                padding: "8px 12px",
                                borderRadius: 8,
                                marginTop: 4,
                            }}
                        >
                            {log.description}
                        </p>
                    )}
                </div>

                {/* Diff content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", paddingTop: 40 }}>
                            <div className="spinner" style={{ margin: "0 auto" }} />
                            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
                                Loading changes...
                            </p>
                        </div>
                    ) : detail ? (
                        <>
                            {/* Legend */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 16,
                                    marginBottom: 16,
                                    fontSize: 12,
                                    color: "var(--text-muted)",
                                }}
                            >
                                <span style={{ color: "var(--danger)" }}>■ Before</span>
                                <span style={{ color: "var(--success)" }}>■ After</span>
                            </div>
                            <DiffView
                                oldValues={detail.oldValues}
                                newValues={detail.newValues}
                            />
                            {!detail.oldValues && !detail.newValues && (
                                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                    No field changes recorded for this action.
                                </p>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}