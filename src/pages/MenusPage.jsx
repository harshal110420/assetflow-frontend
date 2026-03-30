import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Menu as MenuIcon, GripVertical, Search } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const ALL_ACTIONS = [
    { key: "view", label: "View", color: "var(--accent)" },
    { key: "new", label: "New", color: "var(--success)" },
    { key: "edit", label: "Edit", color: "var(--warning)" },
    { key: "delete", label: "Delete", color: "var(--danger)" },
    { key: "import", label: "Import", color: "var(--accent-2)" },
    { key: "export", label: "Export", color: "#ff8c42" },
    { key: "print", label: "Print", color: "var(--info)" },
    { key: "approve", label: "Approve", color: "var(--info)" },
    { key: "reject", label: "Reject", color: "var(--info)" },
];

const SYSTEM_SLUGS = [
    "dashboard", "asset_master", "maintenance", "approvals",
    "reports", "users", "roles", "locations", "settings",
];

function ActionBadge({ action }) {
    const a = ALL_ACTIONS.find((x) => x.key === action);
    if (!a) return (
        <span style={{ background: "var(--bg-hover)", color: "var(--text-muted)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
            {action}
        </span>
    );
    return (
        <span style={{ background: "var(--bg-hover)", color: a.color, border: "1px solid var(--border)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
            {a.label}
        </span>
    );
}

function DynamicIcon({ name, size = 16, color = "currentColor" }) {
    const [Icon, setIcon] = useState(null);
    useEffect(() => {
        let cancelled = false;
        import("lucide-react").then((mod) => {
            if (!cancelled) setIcon(() => mod[name] || mod["Package"]);
        });
        return () => { cancelled = true; };
    }, [name]);
    if (!Icon) return <span style={{ width: size, height: size, display: "inline-block" }} />;
    return <Icon size={size} color={color} />;
}

export default function MenusPage() {
    const navigate = useNavigate();

    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/menus");
            setMenus(res.data.data || []);
        } catch {
            toast.error("Failed to load menus");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (menu) => {
        if (!window.confirm(`Delete menu "${menu.name}"? This cannot be undone.`)) return;
        setDeleting(menu.id);
        try {
            await api.delete(`/menus/${menu.id}`);
            toast.success("Menu deleted");
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete");
        } finally {
            setDeleting(null);
        }
    };

    const filtered = menus.filter((m) => {
        const q = search.toLowerCase();
        return (
            m.name?.toLowerCase().includes(q) ||
            m.slug?.toLowerCase().includes(q) ||
            m.icon?.toLowerCase().includes(q)
        );
    });

    const stats = [
        { label: "Total", value: menus.length, color: "var(--accent)", bg: "var(--accent-glow)" },
        { label: "Active", value: menus.filter((m) => m.isActive).length, color: "var(--success)", bg: "rgba(0,214,143,0.1)" },
        { label: "System", value: menus.filter((m) => SYSTEM_SLUGS.includes(m.slug)).length, color: "var(--warning)", bg: "rgba(255,183,3,0.1)" },
        { label: "Custom", value: menus.filter((m) => !SYSTEM_SLUGS.includes(m.slug)).length, color: "var(--info)", bg: "rgba(51,154,240,0.1)" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>Menu Management</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                        Define menus and their available actions — reflected across all role & user permission modals
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate("/menus/new")}>
                    <Plus size={17} /> New Menu
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {stats.map((s) => (
                    <div key={s.label} className="card" style={{ padding: "16px 20px" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</p>
                        <p style={{ color: s.color, fontSize: 30, fontWeight: 700, marginTop: 4 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 360 }}>
                    <Search size={14} style={{
                        position: "absolute", left: 10, top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)", pointerEvents: "none",
                    }} />
                    <input
                        className="form-input"
                        placeholder="Search by name, slug, or icon..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 32 }}
                    />
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {filtered.length} menu{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--surface-2, rgba(255,255,255,0.03))", borderBottom: "1px solid var(--border)" }}>
                                {["Order", "Menu Name", "Slug", "Icon", "Available Actions", "Status", "Type", ""].map((h) => (
                                    <th key={h} style={{
                                        padding: "11px 16px", textAlign: "left",
                                        fontSize: 12, fontWeight: 600,
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase", letterSpacing: "0.04em",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(8)].map((_, j) => (
                                            <td key={j} style={{ padding: 16 }}>
                                                <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.map((menu, i) => {
                                const isSystem = SYSTEM_SLUGS.includes(menu.slug);
                                return (
                                    <tr
                                        key={menu.id}
                                        style={{
                                            borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                                            transition: "background 0.15s",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => navigate(`/menus/${menu.id}/edit`)}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2, rgba(255,255,255,0.03))")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        {/* Order */}
                                        <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: 13 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                <GripVertical size={13} color="var(--border)" />
                                                {menu.order}
                                            </div>
                                        </td>

                                        {/* Name */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 34, height: 34, borderRadius: 8,
                                                    background: "var(--bg-hover)", border: "1px solid var(--border)",
                                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                }}>
                                                    <DynamicIcon name={menu.icon || "Package"} size={15} color="var(--accent)" />
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{menu.name}</span>
                                            </div>
                                        </td>

                                        {/* Slug */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <code style={{
                                                background: "var(--bg-hover)", color: "var(--accent)",
                                                padding: "3px 8px", borderRadius: 5, fontSize: 12,
                                                border: "1px solid var(--border)",
                                            }}>
                                                {menu.slug}
                                            </code>
                                        </td>

                                        {/* Icon name */}
                                        <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>
                                            {menu.icon}
                                        </td>

                                        {/* Available Actions */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                {(menu.availableActions || []).map((a) => <ActionBadge key={a} action={a} />)}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                background: menu.isActive ? "rgba(0,214,143,0.12)" : "var(--bg-hover)",
                                                color: menu.isActive ? "var(--success)" : "var(--text-muted)",
                                                border: `1px solid ${menu.isActive ? "rgba(0,214,143,0.3)" : "var(--border)"}`,
                                            }}>
                                                {menu.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        {/* Type */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                background: isSystem ? "rgba(255,183,3,0.1)" : "rgba(51,154,240,0.1)",
                                                color: isSystem ? "var(--warning)" : "var(--info)",
                                                border: `1px solid ${isSystem ? "rgba(255,183,3,0.25)" : "rgba(51,154,240,0.25)"}`,
                                            }}>
                                                {isSystem ? "System" : "Custom"}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/menus/${menu.id}/edit`); }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                {!isSystem && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(menu); }}
                                                        disabled={deleting === menu.id}
                                                        title="Delete"
                                                        style={{ opacity: deleting === menu.id ? 0.5 : 1 }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                                        <MenuIcon size={36} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
                                        {search ? "No menus match your search." : "No menus found"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}