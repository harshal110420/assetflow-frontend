import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    clearVendorError,
} from "../store/slices/vendorSlice";
import { Plus, Edit2, Trash2, Building2, X, Save, Phone, Mail, User, MapPin } from "lucide-react";
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
                {/* Header */}
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

                {/* Body */}
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Name — mandatory */}
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

                    {/* Contact Person + Phone */}
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

                    {/* Email */}
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

                    {/* Address */}
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

    const filtered = vendors.filter((v) =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
        v.email?.toLowerCase().includes(search.toLowerCase()),
    );

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

            {/* Search */}
            <div style={{ maxWidth: 320 }}>
                <input
                    className="form-input"
                    placeholder="Search by name, contact, email..."
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
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: 16,
                    }}
                >
                    {filtered.map((vendor) => (
                        <div key={vendor.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
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
                                        <Building2 size={18} color="#050b14" />
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{vendor.name}</div>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
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
                            </div>

                            {/* Vendor Details */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {vendor.contactPerson && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                                        <User size={13} />
                                        <span>{vendor.contactPerson}</span>
                                    </div>
                                )}
                                {vendor.phone && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                                        <Phone size={13} />
                                        <span>{vendor.phone}</span>
                                    </div>
                                )}
                                {vendor.email && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                                        <Mail size={13} />
                                        <span>{vendor.email}</span>
                                    </div>
                                )}
                                {vendor.address && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                                        <MapPin size={13} />
                                        <span>{vendor.address}</span>
                                    </div>
                                )}
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
                            <Building2 size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>{search ? "No vendors match your search" : "No vendors yet. Create your first vendor!"}</p>
                        </div>
                    )}
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