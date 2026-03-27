import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    clearVendorError,
} from "../store/slices/vendorSlice";
import { Plus, Edit2, Trash2, Building2, X, Save, Phone, Mail, User, MapPin, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { usePermission } from "../hooks/usePermission";

// ── Vendor Modal (Create / Edit) ──────────────────────────────────────────────
function VendorModal({ vendor, onClose }) {
    const dispatch = useDispatch();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: vendor?.name || "",
        contactPerson: vendor?.contactPerson || "",
        phone: vendor?.phone || "",
        email: vendor?.email || "",
        address: vendor?.address || "",
    });

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("Vendor name is required");
        setSaving(true);
        try {
            if (vendor?.id) {
                await dispatch(updateVendor({ id: vendor.id, ...form })).unwrap();
                toast.success("Vendor updated successfully!");
            } else {
                await dispatch(createVendor(form)).unwrap();
                toast.success("Vendor created successfully!");
            }
            onClose(true);
        } catch (err) {
            toast.error(err || "Failed to save vendor");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose(false)}
        >
            <div className="modal" style={{ maxWidth: 520, width: "95vw" }}>
                <div className="modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Building2 size={20} color="var(--accent)" />
                        <h2 className="modal-title">
                            {vendor?.id ? "Edit Vendor" : "New Vendor"}
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
                        <label className="form-label">Vendor Name *</label>
                        <input
                            className="form-input"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Tech Supplies Pvt Ltd"
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Contact Person</label>
                            <input
                                className="form-input"
                                name="contactPerson"
                                value={form.contactPerson}
                                onChange={handleChange}
                                placeholder="e.g. Rahul Sharma"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input
                                className="form-input"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="e.g. +91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="e.g. vendor@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                            className="form-input"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Full address"
                            rows={3}
                            style={{ resize: "vertical" }}
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
                                {vendor?.id ? "Update Vendor" : "Create Vendor"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Vendor Page ──────────────────────────────────────────────────────────
export default function VendorPage() {
    const dispatch = useDispatch();
    const { vendors, isLoading, error } = useSelector((s) => s.vendors);
    const [showModal, setShowModal] = useState(false);
    const [editVendor, setEditVendor] = useState(null);
    const [search, setSearch] = useState("");
    const [filterContact, setFilterContact] = useState("all"); // "all" | "with_contact" | "no_contact"
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const { can } = usePermission();

    const canCreate = can("vendors", "new");
    const canEdit = can("vendors", "edit");
    const canDelete = can("vendors", "delete");

    useEffect(() => {
        dispatch(fetchVendors());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearVendorError());
        }
    }, [error, dispatch]);

    const handleDelete = async (vendor) => {
        if (!window.confirm(`Delete vendor "${vendor.name}"?`)) return;
        try {
            await dispatch(deleteVendor(vendor.id)).unwrap();
            toast.success("Vendor deleted");
        } catch (err) {
            toast.error(err || "Failed to delete vendor");
        }
    };

    const handleSort = (col) => {
        if (sortBy === col) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(col);
            setSortDir("asc");
        }
    };

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
        return <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const filtered = vendors
        .filter((v) => {
            const matchSearch =
                v.name.toLowerCase().includes(search.toLowerCase()) ||
                v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
                v.email?.toLowerCase().includes(search.toLowerCase()) ||
                v.phone?.toLowerCase().includes(search.toLowerCase());

            const matchContact =
                filterContact === "all" ||
                (filterContact === "with_contact" && v.contactPerson) ||
                (filterContact === "no_contact" && !v.contactPerson);

            return matchSearch && matchContact;
        })
        .sort((a, b) => {
            const valA = (a[sortBy] || "").toLowerCase();
            const valB = (b[sortBy] || "").toLowerCase();
            if (valA < valB) return sortDir === "asc" ? -1 : 1;
            if (valA > valB) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

    const columns = [
        { key: "name", label: "Vendor Name" },
        { key: "contactPerson", label: "Contact Person" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>Vendor Management</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                        Manage asset vendors and suppliers
                    </p>
                </div>
                {canCreate && (
                    <button
                        className="btn btn-primary"
                        onClick={() => { setEditVendor(null); setShowModal(true); }}
                    >
                        <Plus size={18} /> New Vendor
                    </button>
                )}
            </div>

            {/* Search + Filters */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
                    <Search
                        size={15}
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
                        placeholder="Search by name, contact, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 32 }}
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Filter size={14} style={{ color: "var(--text-muted)" }} />
                    <select
                        className="form-input"
                        value={filterContact}
                        onChange={(e) => setFilterContact(e.target.value)}
                        style={{ width: "auto" }}
                    >
                        <option value="all">All Vendors</option>
                        <option value="with_contact">Has Contact Person</option>
                        <option value="no_contact">No Contact Person</option>
                    </select>
                </div>

                <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: "auto" }}>
                    {filtered.length} vendor{filtered.length !== 1 ? "s" : ""}
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
                                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2, rgba(255,255,255,0.03))" }}>
                                    {columns.map(({ key, label }) => (
                                        <th
                                            key={key}
                                            onClick={() => handleSort(key)}
                                            style={{
                                                padding: "11px 16px",
                                                textAlign: "left",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: "var(--text-muted)",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.04em",
                                                cursor: "pointer",
                                                userSelect: "none",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {label}
                                            <SortIcon col={key} />
                                        </th>
                                    ))}
                                    {(canEdit || canDelete) && (
                                        <th style={{ padding: "11px 16px", width: 90 }} />
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((vendor, i) => (
                                    <tr
                                        key={vendor.id}
                                        style={{
                                            borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                                            transition: "background 0.15s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2, rgba(255,255,255,0.03))")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        {/* Name */}
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 8,
                                                        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Building2 size={15} color="#050b14" />
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>{vendor.name}</span>
                                            </div>
                                        </td>

                                        {/* Contact Person */}
                                        <td style={{ padding: "12px 16px" }}>
                                            {vendor.contactPerson ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                                    <User size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                                    {vendor.contactPerson}
                                                </div>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                                            )}
                                        </td>

                                        {/* Phone */}
                                        <td style={{ padding: "12px 16px" }}>
                                            {vendor.phone ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                                    <Phone size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                                    {vendor.phone}
                                                </div>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                                            )}
                                        </td>

                                        {/* Email */}
                                        <td style={{ padding: "12px 16px" }}>
                                            {vendor.email ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                                                    <Mail size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                                    <a
                                                        href={`mailto:${vendor.email}`}
                                                        style={{ color: "var(--accent)", textDecoration: "none" }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {vendor.email}
                                                    </a>
                                                </div>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                                            )}
                                        </td>

                                        {/* Address */}
                                        <td style={{ padding: "12px 16px", maxWidth: 200 }}>
                                            {vendor.address ? (
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13 }}>
                                                    <MapPin size={12} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
                                                    <span
                                                        style={{
                                                            color: "var(--text-muted)",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            maxWidth: 160,
                                                        }}
                                                        title={vendor.address}
                                                    >
                                                        {vendor.address}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        {(canEdit || canDelete) && (
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                    {canEdit && (
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => { setEditVendor(vendor); setShowModal(true); }}
                                                            title="Edit vendor"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDelete(vendor)}
                                                            title="Delete vendor"
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
                                            colSpan={columns.length + 1}
                                            style={{
                                                textAlign: "center",
                                                padding: "48px 20px",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            <Building2 size={36} style={{ opacity: 0.3, marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
                                            <p>{search || filterContact !== "all" ? "No vendors match your filters" : "No vendors yet. Create your first vendor!"}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <VendorModal
                    vendor={editVendor}
                    onClose={(saved) => {
                        setShowModal(false);
                        setEditVendor(null);
                        if (saved) dispatch(fetchVendors());
                    }}
                />
            )}
        </div>
    );
}