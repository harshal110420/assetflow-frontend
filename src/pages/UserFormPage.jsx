import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    User, Mail, Lock, Phone, Shield, Building2, Users, MapPin,
} from "lucide-react";
import { createUser, updateUser } from "../store/slices/userSlice";
import { fetchRoles } from "../store/slices/permissionSlice";
import { fetchDepartments } from "../store/slices/departmentSlice";
import { fetchUsers } from "../store/slices/userSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// ── Sidebar sections ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "identity", label: "Identity", icon: User },
    { id: "role", label: "Role & Dept", icon: Shield },
    { id: "reporting", label: "Reporting", icon: Users },
    { id: "locations", label: "Locations", icon: MapPin },
];

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "viewer",
    roleId: "",
    departmentId: "",
    reportingManagerId: "",
    isActive: true,
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UserFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { users } = useSelector((s) => s.users);
    const { roles } = useSelector((s) => s.permissions);
    const { departments } = useSelector((s) => s.departments);

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [isDirty, setIsDirty] = useState(false);

    // Locations state
    const [locations, setLocations] = useState([]);
    const [assignedLocationIds, setAssignedLocationIds] = useState([]);

    // ── Fetch supporting data ─────────────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchRoles());
        dispatch(fetchDepartments());
        dispatch(fetchUsers());

        api.get("/locations")
            .then((res) => setLocations(res.data.data || []))
            .catch(() => { });
    }, [dispatch]);

    // ── Load existing user on edit ────────────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/users/${id}`);
                const u = data.data || data;
                setForm({
                    firstName: u.firstName || "",
                    lastName: u.lastName || "",
                    email: u.email || "",
                    password: "",
                    phone: u.phone || "",
                    role: u.role || "viewer",
                    roleId: u.roleId || "",
                    departmentId: u.departmentId || "",
                    reportingManagerId: u.reportingManagerId || "",
                    isActive: u.isActive !== false,
                });

                // Load assigned locations
                const locRes = await api.get(`/locations/user/${id}`);
                const ids = (locRes.data.data || []).map((l) => l.locationId || l.id);
                setAssignedLocationIds(ids);
            } catch {
                toast.error("Failed to load user");
                navigate("/users");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit, navigate]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setIsDirty(true);
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleRoleChange = (e) => {
        const selected = (roles || []).find((r) => r.id === e.target.value);
        setForm((prev) => ({
            ...prev,
            roleId: selected?.id || "",
            role: selected?.slug || e.target.value,
        }));
        setIsDirty(true);
    };

    const toggleLocation = (locId) => {
        setAssignedLocationIds((prev) =>
            prev.includes(locId) ? prev.filter((lid) => lid !== locId) : [...prev, locId]
        );
        setIsDirty(true);
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!form.firstName.trim()) errs.firstName = "First name is required";
        if (!form.lastName.trim()) errs.lastName = "Last name is required";
        if (!form.email.trim()) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            errs.email = "Enter a valid email address";
        if (!isEdit && !form.password) errs.password = "Password is required";
        if (form.password && form.password.length < 6)
            errs.password = "Password must be at least 6 characters";
        if (form.phone && !/^[\d\s+\-().]{7,20}$/.test(form.phone))
            errs.phone = "Enter a valid phone number";
        if (!form.roleId) errs.roleId = "Role is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) {
            toast.error("Please fix the errors before saving");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (isEdit && !payload.password) delete payload.password;
            if (!payload.reportingManagerId) payload.reportingManagerId = null;
            if (!payload.departmentId) payload.departmentId = null;

            let savedUserId = id;

            if (isEdit) {
                await dispatch(updateUser({ id, ...payload })).unwrap();
                toast.success("User updated successfully!");
            } else {
                const result = await dispatch(createUser(payload)).unwrap();
                savedUserId = result?.id || result?.data?.id;
                toast.success("User created successfully!");
            }

            // Save location assignments
            if (savedUserId) {
                await api.post(`/locations/user/${savedUserId}`, {
                    locationIds: assignedLocationIds,
                });
            }

            setIsDirty(false);
            navigate("/users");
        } catch (err) {
            toast.error(err?.message || err || "Failed to save user");
        } finally {
            setSaving(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const managerOptions = users.filter(
        (u) => u.id !== id && ["admin", "manager"].includes(u.role)
    );

    const activeLocations = locations.filter((l) => l.isActive);

    const breadcrumbs = [
        { label: "Users", path: "/users" },
        { label: isEdit ? "Edit User" : "New User" },
    ];

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    // ── Icon helper for inputs ────────────────────────────────────────────────
    const iconStyle = (top = "50%", offset = "translateY(-50%)") => ({
        position: "absolute", left: 12, top,
        transform: offset,
        color: "var(--text-muted)", pointerEvents: "none",
    });

    const withIcon = (icon, extra = {}) => ({
        paddingLeft: 36,
        ...extra,
    });

    return (
        <FormPageLayout
            title={isEdit ? `Edit: ${form.firstName} ${form.lastName}`.trim() || "User" : "New User"}
            subtitle={isEdit ? "Update user profile, role, and access settings" : "Add a new user to the system"}
            breadcrumbs={breadcrumbs}
            sections={SECTIONS}
            onSave={handleSave}
            onCancel={() => navigate("/users")}
            saving={saving}
            saveLabel={isEdit ? "Update User" : "Create User"}
            isDirty={isDirty}
        >

            {/* ── Section 1: Identity ──────────────────────────────────────── */}
            <FormSection
                id="identity"
                title="Identity"
                subtitle="Basic profile information for this user"
            >
                <FormRow cols={2}>
                    <FormField label="First Name" required error={errors.firstName}>
                        <div style={{ position: "relative" }}>
                            <User size={15} style={iconStyle()} />
                            <input
                                className={`form-input ${errors.firstName ? "input-error" : ""}`}
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="e.g. Rahul"
                                style={withIcon(null, { borderColor: errors.firstName ? "var(--danger)" : undefined })}
                            />
                        </div>
                    </FormField>

                    <FormField label="Last Name" required error={errors.lastName}>
                        <div style={{ position: "relative" }}>
                            <User size={15} style={iconStyle()} />
                            <input
                                className={`form-input ${errors.lastName ? "input-error" : ""}`}
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="e.g. Sharma"
                                style={withIcon(null, { borderColor: errors.lastName ? "var(--danger)" : undefined })}
                            />
                        </div>
                    </FormField>
                </FormRow>

                <FormField label="Email" required error={errors.email}>
                    <div style={{ position: "relative" }}>
                        <Mail size={15} style={iconStyle()} />
                        <input
                            className={`form-input ${errors.email ? "input-error" : ""}`}
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="rahul@company.com"
                            style={withIcon(null, { borderColor: errors.email ? "var(--danger)" : undefined })}
                        />
                    </div>
                </FormField>

                <FormRow cols={2}>
                    <FormField
                        label="Password"
                        required={!isEdit}
                        error={errors.password}
                        hint={isEdit ? "Leave blank to keep current password" : "Minimum 6 characters"}
                    >
                        <div style={{ position: "relative" }}>
                            <Lock size={15} style={iconStyle()} />
                            <input
                                className={`form-input ${errors.password ? "input-error" : ""}`}
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={isEdit ? "Leave blank to keep unchanged" : "Min 6 characters"}
                                style={withIcon(null, { borderColor: errors.password ? "var(--danger)" : undefined })}
                            />
                        </div>
                    </FormField>

                    <FormField label="Phone" error={errors.phone}>
                        <div style={{ position: "relative" }}>
                            <Phone size={15} style={iconStyle()} />
                            <input
                                className={`form-input ${errors.phone ? "input-error" : ""}`}
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                style={withIcon(null, { borderColor: errors.phone ? "var(--danger)" : undefined })}
                            />
                        </div>
                    </FormField>
                </FormRow>
            </FormSection>

            {/* ── Section 2: Role & Department ─────────────────────────────── */}
            <FormSection
                id="role"
                title="Role & Department"
                subtitle="Assign system role and department for this user"
            >
                <FormRow cols={2}>
                    <FormField label="Role" required error={errors.roleId}>
                        <div style={{ position: "relative" }}>
                            <Shield size={15} style={iconStyle()} />
                            <select
                                className={`form-input ${errors.roleId ? "input-error" : ""}`}
                                value={form.roleId || ""}
                                onChange={handleRoleChange}
                                style={withIcon(null, { borderColor: errors.roleId ? "var(--danger)" : undefined })}
                            >
                                <option value="">-- Select Role --</option>
                                {(roles || []).map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </FormField>

                    <FormField label="Department" hint="Optional — used for grouping and filtering">
                        <div style={{ position: "relative" }}>
                            <Building2 size={15} style={iconStyle()} />
                            <select
                                className="form-input"
                                name="departmentId"
                                value={form.departmentId}
                                onChange={handleChange}
                                style={withIcon()}
                            >
                                <option value="">-- Select Department --</option>
                                {(departments || []).map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}{d.division?.name ? ` — ${d.division.name}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </FormField>
                </FormRow>

                {/* Status — edit only */}
                {isEdit && (
                    <FormField label="Account Status">
                        <select
                            className="form-input"
                            name="isActive"
                            value={String(form.isActive)}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, isActive: e.target.value === "true" }))
                            }
                            style={{ maxWidth: 200 }}
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </FormField>
                )}
            </FormSection>

            {/* ── Section 3: Reporting ──────────────────────────────────────── */}
            <FormSection
                id="reporting"
                title="Reporting"
                subtitle="Approval workflow — requests from this user route to their reporting manager"
            >
                <FormField
                    label="Reporting Manager"
                    hint="When this user requests an action, approval goes to their reporting manager automatically."
                >
                    <div style={{ position: "relative" }}>
                        <Users size={15} style={iconStyle()} />
                        <select
                            className="form-input"
                            name="reportingManagerId"
                            value={form.reportingManagerId}
                            onChange={handleChange}
                            style={withIcon()}
                        >
                            <option value="">-- No Reporting Manager --</option>
                            {managerOptions.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.firstName} {u.lastName} ({u.role})
                                    {u.department?.name ? ` · ${u.department.name}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </FormField>
            </FormSection>

            {/* ── Section 4: Locations ──────────────────────────────────────── */}
            <FormSection
                id="locations"
                title="Assigned Locations"
                subtitle="Controls which assets and data this user can see. Admin / Manager roles see all regardless."
            >
                <FormField
                    label="Locations"
                    hint={
                        assignedLocationIds.length === 0
                            ? "No locations assigned — Admin/Manager sees all, others see nothing"
                            : `${assignedLocationIds.length} location(s) assigned`
                    }
                >
                    {activeLocations.length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0", margin: 0 }}>
                            No active locations available. Add locations first.
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                            {activeLocations.map((loc) => {
                                const active = assignedLocationIds.includes(loc.id);
                                return (
                                    <button
                                        key={loc.id}
                                        type="button"
                                        onClick={() => toggleLocation(loc.id)}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                                            background: active ? "var(--accent-glow)" : "transparent",
                                            color: active ? "var(--accent)" : "var(--text-muted)",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {active ? "✓ " : ""}
                                        {loc.name}{loc.code ? ` · ${loc.code}` : ""}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </FormField>
            </FormSection>

        </FormPageLayout>
    );
}