import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    clearBrandError,
} from "../store/slices/brandSlice";
import { Plus, Edit2, Trash2, Tag, X, Save, Search, Filter, ChevronUp, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { usePermission } from "../hooks/usePermission";

// ── Brand Modal (Create / Edit) ───────────────────────────────────────────────
function BrandModal({ brand, onClose }) {
    const dispatch = useDispatch();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: brand?.name || "",
        description: brand?.description || "",
    });

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("Brand name is required");
        setSaving(true);
        try {
            if (brand?.id) {
                await dispatch(updateBrand({ id: brand.id, ...form })).unwrap();
                toast.success("Brand updated successfully!");
            } else {
                await dispatch(createBrand(form)).unwrap();
                toast.success("Brand created successfully!");
            }
            onClose(true);
        } catch (err) {
            toast.error(err || "Failed to save brand");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose(false)}
        >
            <div className="modal" style={{ maxWidth: 480, width: "95vw" }}>
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Tag size={20} color="var(--accent)" />
                        <h2 className="modal-title">
                            {brand?.id ? "Edit Brand" : "New Brand"}
                        </h2>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="form-group">
                        <label className="form-label">Brand Name *</label>
                        <input
                            className="form-input"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Dell, HP, Samsung"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input
                            className="form-input"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Optional description"
                        />
                    </div>
                </div>

                <div
                    style={{
                        padding: "14px 20px",
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                    }}
                >
                    <button className="btn btn-secondary" onClick={() => onClose(false)}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : (
                            <>
                                <Save size={14} style={{ marginRight: 4 }} />
                                {brand?.id ? "Update Brand" : "Create Brand"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Sort Icon Helper ──────────────────────────────────────────────────────────
function SortIcon({ column, sortConfig }) {
    if (sortConfig.key !== column) {
        return <ChevronUp size={13} style={{ opacity: 0.3 }} />;
    }
    return sortConfig.direction === "asc"
        ? <ChevronUp size={13} style={{ color: "var(--accent)" }} />
        : <ChevronDown size={13} style={{ color: "var(--accent)" }} />;
}

// ── Main Brand Page ───────────────────────────────────────────────────────────
export default function BrandPage() {
    const dispatch = useDispatch();
    const { brands, isLoading, error } = useSelector((s) => s.brands);
    const [showModal, setShowModal] = useState(false);
    const [editBrand, setEditBrand] = useState(null);
    const [search, setSearch] = useState("");
    const [filterDescription, setFilterDescription] = useState("all"); // "all" | "with_desc" | "without_desc"
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const { can } = usePermission();

    const canCreate = can("brands", "new");
    const canEdit = can("brands", "edit");
    const canDelete = can("brands", "delete");

    useEffect(() => {
        dispatch(fetchBrands());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearBrandError());
        }
    }, [error, dispatch]);

    const handleDelete = async (brand) => {
        if (!window.confirm(`Delete brand "${brand.name}"?`)) return;
        try {
            await dispatch(deleteBrand(brand.id)).unwrap();
            toast.success("Brand deleted");
        } catch (err) {
            toast.error(err || "Failed to delete brand");
        }
    };

    const handleSort = (key) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { key, direction: "asc" }
        );
    };

    const filtered = brands
        .filter((b) => {
            const q = search.toLowerCase();
            const matchSearch =
                b.name.toLowerCase().includes(q) ||
                b.description?.toLowerCase().includes(q);

            const matchDesc =
                filterDescription === "all" ||
                (filterDescription === "with_desc" && b.description) ||
                (filterDescription === "without_desc" && !b.description);

            return matchSearch && matchDesc;
        })
        .sort((a, b) => {
            const aVal = (a[sortConfig.key] || "").toLowerCase();
            const bVal = (b[sortConfig.key] || "").toLowerCase();
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

    const thStyle = {
        padding: "10px 14px",
        textAlign: "left",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: "1px solid var(--border)",
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
        background: "var(--surface)",
    };

    const tdStyle = {
        padding: "11px 14px",
        fontSize: 13,
        color: "var(--text)",
        borderBottom: "1px solid var(--border)",
        verticalAlign: "middle",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>Brand Management</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                        Manage asset brands
                    </p>
                </div>
                {canCreate && (
                    <button
                        className="btn btn-primary"
                        onClick={() => { setEditBrand(null); setShowModal(true); }}
                    >
                        <Plus size={18} /> New Brand
                    </button>
                )}
            </div>

            {/* Search + Filters Bar */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {/* Search */}
                <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
                    <Search
                        size={14}
                        style={{
                            position: "absolute",
                            left: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted)",
                            pointerEvents: "none",
                        }}
                    />
                    <input
                        className="form-input"
                        placeholder="Search by name or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 32 }}
                    />
                </div>

                {/* Filter: Description */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Filter size={13} style={{ color: "var(--text-muted)" }} />
                    <select
                        className="form-input"
                        value={filterDescription}
                        onChange={(e) => setFilterDescription(e.target.value)}
                        style={{ fontSize: 13, padding: "6px 10px", minWidth: 160 }}
                    >
                        <option value="all">All Brands</option>
                        <option value="with_desc">With Description</option>
                        <option value="without_desc">Without Description</option>
                    </select>
                </div>

                {/* Result count */}
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                    {filtered.length} brand{filtered.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Table */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                    <div className="spinner" style={{ width: 28, height: 28 }} />
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, width: 50 }}>#</th>
                                    <th style={thStyle} onClick={() => handleSort("name")}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <Tag size={13} /> Brand Name
                                            <SortIcon column="name" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    <th style={thStyle} onClick={() => handleSort("description")}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            Description
                                            <SortIcon column="description" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    {(canEdit || canDelete) && (
                                        <th style={{ ...thStyle, textAlign: "right", cursor: "default", width: 100 }}>Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((brand, idx) => (
                                    <tr
                                        key={brand.id}
                                        style={{
                                            background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover, rgba(255,255,255,0.05))"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)"}
                                    >
                                        <td style={{ ...tdStyle, color: "var(--text-muted)", fontSize: 12 }}>
                                            {idx + 1}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div
                                                    style={{
                                                        width: 30,
                                                        height: 30,
                                                        borderRadius: 8,
                                                        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Tag size={14} color="#050b14" />
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{brand.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, color: "var(--text-muted)" }}>
                                            {brand.description || <span style={{ fontStyle: "italic", opacity: 0.5 }}>No description</span>}
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                    {canEdit && (
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => { setEditBrand(brand); setShowModal(true); }}
                                                            title="Edit brand"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(brand)}
                                                            title="Delete brand"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            style={{
                                                padding: "48px 20px",
                                                textAlign: "center",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            <Tag size={36} style={{ opacity: 0.25, display: "block", margin: "0 auto 10px" }} />
                                            <p>{search ? "No brands match your search or filters." : "No brands yet. Create your first brand!"}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <BrandModal
                    brand={editBrand}
                    onClose={(saved) => {
                        setShowModal(false);
                        setEditBrand(null);
                        if (saved) dispatch(fetchBrands());
                    }}
                />
            )}
        </div>
    );
}