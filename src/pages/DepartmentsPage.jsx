import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchDepartments, createDepartment, updateDepartment, deleteDepartment,
} from "../store/slices/departmentSlice";
import { fetchDivisions } from "../store/slices/divisionSlice";
import { Plus, Edit2, Trash2, X, Briefcase, Search } from "lucide-react";
import toast from "react-hot-toast";

// ── Department Modal ──────────────────────────────────────────────────────────
function DepartmentModal({ department, divisions, onClose }) {
    const dispatch = useDispatch();
    const isEdit = !!department;
    const [form, setForm] = useState({
        name: department?.name || "",
        code: department?.code || "",
        divisionId: department?.divisionId || "",
        description: department?.description || "",
        isActive: department?.isActive !== false,
    });
    const [loading, setLoading] = useState(false);
    const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.divisionId) return toast.error("Name and division are required");
        setLoading(true);
        try {
            const action = isEdit
                ? updateDepartment({ id: department.id, ...form })
                : createDepartment(form);
            const result = await dispatch(action);
            if (result.error) throw new Error(result.payload?.message || "Failed");
            toast.success(isEdit ? "Department updated!" : "Department created!");
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
                    <h2 className="modal-title">{isEdit ? "Edit Department" : "Add Department"}</h2>
                    <button onClick={() => onClose(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Department Name *</label>
                            <input className="form-input" value={form.name} onChange={set("name")} required placeholder="e.g. IC - Production" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code</label>
                            <input className="form-input" value={form.code} onChange={set("code")} placeholder="e.g. IC-PROD" style={{ textTransform: "uppercase" }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Division *</label>
                        <select className="form-select" value={form.divisionId} onChange={set("divisionId")} required>
                            <option value="">-- Select Division --</option>
                            {divisions.filter((d) => d.isActive !== false).map((d) => (
                                <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ""}</option>
                            ))}
                        </select>
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
export default function DepartmentsPage() {
    const dispatch = useDispatch();
    const { departments, isLoading } = useSelector((s) => s.departments);
    const { divisions } = useSelector((s) => s.divisions);
    const { user: me } = useSelector((s) => s.auth);
    const [showModal, setShowModal] = useState(false);
    const [editDept, setEditDept] = useState(null);
    const [filterDivision, setFilterDivision] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        dispatch(fetchDepartments({ divisionId: filterDivision || undefined }));
        dispatch(fetchDivisions());
    }, [dispatch, filterDivision]);

    const handleDelete = async (id) => {
        if (!window.confirm("Deactivate this department?")) return;
        const result = await dispatch(deleteDepartment(id));
        if (!result.error) toast.success("Department deactivated");
        else toast.error("Failed");
    };

    const handleClose = (refresh) => {
        setShowModal(false);
        setEditDept(null);
        if (refresh) dispatch(fetchDepartments({ divisionId: filterDivision || undefined }));
    };

    const isAdmin = me?.role === "admin";

    const filtered = search
        ? departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.code?.toLowerCase().includes(search.toLowerCase()))
        : departments;

    // Group by division for better display
    const grouped = divisions.reduce((acc, div) => {
        const depts = filtered.filter((d) => d.divisionId === div.id);
        if (depts.length > 0) acc[div.id] = { division: div, departments: depts };
        return acc;
    }, {});

    // Departments without a matching division in the list
    const ungrouped = filtered.filter((d) => !divisions.find((div) => div.id === d.divisionId));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>Departments</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{departments.length} departments across {divisions.length} divisions</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => { setEditDept(null); setShowModal(true); }}>
                        <Plus size={16} /> Add Department
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 180px" }}>
                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments..." style={{ paddingLeft: 32 }} />
                    </div>
                    <select className="form-input" style={{ width: "auto" }} value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)}>
                        <option value="">All Divisions</option>
                        {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {(search || filterDivision) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(""); setFilterDivision(""); }}>Clear</button>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                    <Briefcase size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>No departments found</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Grouped by Division */}
                    {Object.values(grouped).map(({ division, departments: depts }) => (
                        <div key={division.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                            {/* Division Header */}
                            <div style={{ padding: "14px 20px", background: "var(--bg-hover)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>{division.name}</span>
                                {division.code && <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>({division.code})</span>}
                                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>{depts.length} department{depts.length !== 1 ? "s" : ""}</span>
                            </div>

                            {/* Department Rows */}
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 20 }}>Name</th>
                                        <th>Code</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        {isAdmin && <th style={{ paddingRight: 20 }}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {depts.map((dept) => (
                                        <tr key={dept.id}>
                                            <td style={{ paddingLeft: 20 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <Briefcase size={14} color="var(--text-muted)" />
                                                    <span style={{ fontWeight: 500, fontSize: 13 }}>{dept.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {dept.code && (
                                                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--info)", background: "rgba(0,212,255,0.08)", padding: "2px 8px", borderRadius: 4 }}>{dept.code}</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 200 }}>
                                                {dept.description || "—"}
                                            </td>
                                            <td>
                                                <span className={`badge ${dept.isActive ? "badge-active" : "badge-inactive"}`}>
                                                    {dept.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td style={{ paddingRight: 20 }}>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditDept(dept); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                            <Edit2 size={13} /> Edit
                                                        </button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept.id)}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {/* Ungrouped departments (agar division list mein nahi hain) */}
                    {ungrouped.length > 0 && (
                        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: "14px 20px", background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-muted)" }}>Other</span>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 20 }}>Name</th>
                                        <th>Code</th>
                                        <th>Status</th>
                                        {isAdmin && <th style={{ paddingRight: 20 }}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ungrouped.map((dept) => (
                                        <tr key={dept.id}>
                                            <td style={{ paddingLeft: 20, fontWeight: 500, fontSize: 13 }}>{dept.name}</td>
                                            <td>{dept.code || "—"}</td>
                                            <td><span className={`badge ${dept.isActive ? "badge-active" : "badge-inactive"}`}>{dept.isActive ? "Active" : "Inactive"}</span></td>
                                            {isAdmin && (
                                                <td style={{ paddingRight: 20 }}>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditDept(dept); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 4 }}><Edit2 size={13} /> Edit</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept.id)}><Trash2 size={13} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <DepartmentModal department={editDept} divisions={divisions} onClose={handleClose} />
            )}
        </div>
    );
}