import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchDivisions, createDivision, updateDivision, deleteDivision,
} from "../store/slices/divisionSlice";
import { Plus, Edit2, Trash2, X, GitBranch } from "lucide-react";
import toast from "react-hot-toast";
import { usePermission } from "../hooks/usePermission";

// ── Division Modal ────────────────────────────────────────────────────────────
function DivisionModal({ division, onClose }) {
    const dispatch = useDispatch();
    const isEdit = !!division;
    const [form, setForm] = useState({
        name: division?.name || "",
        code: division?.code || "",
        description: division?.description || "",
        isActive: division?.isActive !== false,
    });
    const [loading, setLoading] = useState(false);
    const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name) return toast.error("Division name required");
        setLoading(true);
        try {
            const action = isEdit
                ? updateDivision({ id: division.id, ...form })
                : createDivision(form);
            const result = await dispatch(action);
            if (result.error) throw new Error(result.payload?.message || "Failed");
            toast.success(isEdit ? "Division updated!" : "Division created!");
            onClose(true);
        } catch (err) {
            toast.error(err.message || "Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
            <div className="modal" style={{ maxWidth: 480 }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? "Edit Division" : "Add Division"}</h2>
                    <button onClick={() => onClose(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Division Name *</label>
                            <input className="form-input" value={form.name} onChange={set("name")} required placeholder="e.g. Ice Cream" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code</label>
                            <input className="form-input" value={form.code} onChange={set("code")} placeholder="e.g. ICE" style={{ textTransform: "uppercase" }} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-input" value={form.description} onChange={set("description")} rows={2} placeholder="Brief description..." style={{ resize: "vertical" }} />
                    </div>
                    {isEdit && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-input" value={form.isActive}
                                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === "true" }))}>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DivisionsPage() {
    const dispatch = useDispatch();
    const { divisions, isLoading } = useSelector((s) => s.divisions);
    const { user: me } = useSelector((s) => s.auth);
    const [showModal, setShowModal] = useState(false);
    const [editDivision, setEditDivision] = useState(null);
    const { can } = usePermission();
    useEffect(() => { dispatch(fetchDivisions()); }, [dispatch]);

    const handleDelete = async (id) => {
        if (!window.confirm("Deactivate this division?")) return;
        const result = await dispatch(deleteDivision(id));
        if (!result.error) toast.success("Division deactivated");
        else toast.error("Failed");
    };

    const handleClose = (refresh) => {
        setShowModal(false);
        setEditDivision(null);
        if (refresh) dispatch(fetchDivisions());
    };

    const isAdmin = me?.role === "admin";

    const canCreate = can("divisions", "new");
    const canEdit = can("divisions", "edit");
    const canDelete = can("divisions", "delete");


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>Divisions</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{divisions.length} divisions · Ice Cream, Snacks, Bakery, Dairy</p>
                </div>
                {canCreate && (
                    <button className="btn btn-primary" onClick={() => { setEditDivision(null); setShowModal(true); }}>
                        <Plus size={16} /> Add Division
                    </button>
                )}
            </div>

            {/* Cards Grid */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : divisions.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <GitBranch size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>No divisions found</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {divisions.map((div) => (
                        <div key={div.id} className="card" style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-glow)", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <GitBranch size={20} color="var(--accent)" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 16 }}>{div.name}</div>
                                        {div.code && (
                                            <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 6px", borderRadius: 4 }}>{div.code}</span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: div.isActive ? "rgba(0,214,143,0.1)" : "rgba(255,71,87,0.1)", color: div.isActive ? "var(--success)" : "var(--danger)", border: `1px solid ${div.isActive ? "rgba(0,214,143,0.3)" : "rgba(255,71,87,0.3)"}`, fontWeight: 600 }}>
                                    {div.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            {div.description && (
                                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>{div.description}</p>
                            )}

                            {/* Departments under this division */}
                            {div.departments?.length > 0 && (
                                <div style={{ marginBottom: 14 }}>
                                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                        Departments ({div.departments.length})
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {div.departments.map((d) => (
                                            <span key={d.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                                                {d.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(canEdit || canDelete) && (
                                <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditDivision(div); setShowModal(true); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                        <Edit2 size={13} /> Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(div.id)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <DivisionModal division={editDivision} onClose={handleClose} />
            )}
        </div>
    );
}