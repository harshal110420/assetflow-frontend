import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    clearBrandError,
} from "../store/slices/brandSlice";
import { Plus, Edit2, Trash2, Tag, X, Save } from "lucide-react";
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
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Tag size={20} color="var(--accent)" />
                        <h2 className="modal-title">
                            {brand?.id ? "Edit Brand" : "New Brand"}
                        </h2>
                    </div>
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

                {/* Body */}
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

                {/* Footer */}
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
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            "Saving..."
                        ) : (
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

// ── Main Brand Page ───────────────────────────────────────────────────────────
export default function BrandPage() {
    const dispatch = useDispatch();
    const { brands, isLoading, error } = useSelector((s) => s.brands);
    const [showModal, setShowModal] = useState(false);
    const [editBrand, setEditBrand] = useState(null);
    const [search, setSearch] = useState("");
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

    const filtered = brands.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
    );

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

            {/* Search */}
            <div style={{ maxWidth: 320 }}>
                <input
                    className="form-input"
                    placeholder="Search brands..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Loading */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                    <div className="spinner" style={{ width: 28, height: 28 }} />
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 16,
                    }}
                >
                    {filtered.map((brand) => (
                        <div key={brand.id} className="card" style={{ position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 10,
                                            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Tag size={18} color="#050b14" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15 }}>{brand.name}</div>
                                        {brand.description && (
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                                {brand.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
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
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div
                            className="card"
                            style={{
                                textAlign: "center",
                                padding: "48px 20px",
                                color: "var(--text-muted)",
                                gridColumn: "1/-1",
                            }}
                        >
                            <Tag size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>{search ? "No brands match your search" : "No brands yet. Create your first brand!"}</p>
                        </div>
                    )}
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