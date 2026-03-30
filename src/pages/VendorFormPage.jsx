import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Building2, User, Phone, Mail, MapPin, Info } from "lucide-react";
import { createVendor, updateVendor } from "../store/slices/vendorSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// Sidebar sections config
const SECTIONS = [
    { id: "basic-info", label: "Basic Info", icon: Building2 },
];

// Initial empty form state
const EMPTY_FORM = {
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
};

export default function VendorFormPage() {
    const { id } = useParams();           // present only on edit route
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [isDirty, setIsDirty] = useState(false);

    // Load existing vendor data on edit
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/vendors/${id}`);
                const v = data.data || data;
                setForm({
                    name: v.name || "",
                    contactPerson: v.contactPerson || "",
                    phone: v.phone || "",
                    email: v.email || "",
                    address: v.address || "",
                });
            } catch {
                toast.error("Failed to load vendor");
                navigate("/vendors");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setIsDirty(true);
        // clear error on change
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    // Validate and return true if valid
    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Vendor name is required";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            newErrors.email = "Enter a valid email address";
        if (form.phone && !/^[\d\s+\-().]{7,20}$/.test(form.phone))
            newErrors.phone = "Enter a valid phone number";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error("Please fix the errors before saving");
            return;
        }
        setSaving(true);
        try {
            if (isEdit) {
                await dispatch(updateVendor({ id, ...form })).unwrap();
                toast.success("Vendor updated successfully!");
            } else {
                await dispatch(createVendor(form)).unwrap();
                toast.success("Vendor created successfully!");
            }
            setIsDirty(false);
            navigate("/vendors");
        } catch (err) {
            toast.error(err || "Failed to save vendor");
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbs = [
        { label: "Vendors", path: "/vendors" },
        { label: isEdit ? "Edit Vendor" : "New Vendor" },
    ];

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    return (
        <FormPageLayout
            title={isEdit ? `Edit: ${form.name || "Vendor"}` : "New Vendor"}
            subtitle={isEdit ? "Update vendor details and contact information" : "Add a new vendor or supplier to AssetFlow"}
            breadcrumbs={breadcrumbs}
            sections={SECTIONS}
            onSave={handleSave}
            onCancel={() => navigate("/vendors")}
            saving={saving}
            saveLabel={isEdit ? "Update Vendor" : "Create Vendor"}
            isDirty={isDirty}
        >
            {/* ── Section 1: Basic Info ──────────────────────────────────── */}
            <FormSection
                id="basic-info"
                title="Basic Information"
                subtitle="Primary identification details for this vendor"
            >
                <FormField
                    label="Vendor Name"
                    required
                    error={errors.name}
                    hint="Company or supplier official name"
                >
                    <div style={{ position: "relative" }}>
                        <Building2
                            size={15}
                            style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }}
                        />
                        <input
                            className={`form-input ${errors.name ? "input-error" : ""}`}
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Tech Supplies Pvt Ltd"
                            style={{ paddingLeft: 36, borderColor: errors.name ? "var(--danger)" : undefined }}
                        />
                    </div>
                </FormField>

                <FormField label="Contact Person" hint="Primary point of contact at this vendor">
                    <div style={{ position: "relative" }}>
                        <User
                            size={15}
                            style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }}
                        />
                        <input
                            className="form-input"
                            name="contactPerson"
                            value={form.contactPerson}
                            onChange={handleChange}
                            placeholder="e.g. Rahul Sharma"
                            style={{ paddingLeft: 36 }}
                        />
                    </div>
                </FormField>

                <FormField label="Phone" error={errors.phone}>
                    <div style={{ position: "relative" }}>
                        <Phone
                            size={15}
                            style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }}
                        />
                        <input
                            className="form-input"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            style={{ paddingLeft: 36, borderColor: errors.phone ? "var(--danger)" : undefined }}
                        />
                    </div>
                </FormField>

                <FormField label="Email" error={errors.email}>
                    <div style={{ position: "relative" }}>
                        <Mail
                            size={15}
                            style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }}
                        />
                        <input
                            className="form-input"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="vendor@example.com"
                            style={{ paddingLeft: 36, borderColor: errors.email ? "var(--danger)" : undefined }}
                        />
                    </div>
                </FormField>

                <FormField label="Full Address" hint="Street, city, state, PIN code">
                    <div style={{ position: "relative" }}>
                        <MapPin
                            size={15}
                            style={{
                                position: "absolute", left: 12, top: 14,
                                color: "var(--text-muted)", pointerEvents: "none",
                            }}
                        />
                        <textarea
                            className="form-input"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="e.g. 42, Industrial Area, Nagpur - 440001, Maharashtra"
                            rows={4}
                            style={{ paddingLeft: 36, resize: "vertical", lineHeight: 1.6 }}
                        />
                    </div>
                </FormField>
            </FormSection>

            {/* ── Section 2: Contact ─────────────────────────────────────── */}
          
        </FormPageLayout>
    );
}