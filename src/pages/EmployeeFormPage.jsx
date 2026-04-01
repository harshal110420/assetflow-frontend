import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    User, Mail, Phone, Briefcase, Building2, Users, MapPin, Calendar, Hash, Layers,
} from "lucide-react";
import { createEmployee, updateEmployee } from "../store/slices/employeeSlice";
import { fetchDepartments } from "../store/slices/departmentSlice";
import { fetchDivisions } from "../store/slices/divisionSlice";
import { fetchLocations } from "../store/slices/permissionSlice";
import { fetchEmployees } from "../store/slices/employeeSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// ── Sidebar sections ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "identity", label: "Identity", icon: User },
    { id: "job", label: "Job Details", icon: Briefcase },
    { id: "reporting", label: "Reporting", icon: Users },
    { id: "divisions", label: "Divisions", icon: Layers },
];

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeCode: "",
    designation: "",
    employmentType: "Full-time",
    departmentId: "",
    locationId: "",
    reportingManagerId: "",
    joiningDate: "",
    leavingDate: "",
    isActive: true,
    divisionIds: [],
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EmployeeFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { employees } = useSelector((s) => s.employees);
    const { departments } = useSelector((s) => s.departments);
    const { divisions } = useSelector((s) => s.divisions);
    const { locations } = useSelector((s) => s.permissions);

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [isDirty, setIsDirty] = useState(false);

    // ── Fetch supporting data ─────────────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchDepartments());
        dispatch(fetchDivisions());
        dispatch(fetchLocations());
        dispatch(fetchEmployees({ limit: 200 }));
    }, [dispatch]);

    // ── Load existing employee on edit ────────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/employees/${id}`);
                const e = data.data || data;
                setForm({
                    firstName: e.firstName || "",
                    lastName: e.lastName || "",
                    email: e.email || "",
                    phone: e.phone || "",
                    employeeCode: e.employeeCode || "",
                    designation: e.designation || "",
                    employmentType: e.employmentType || "Full-time",
                    departmentId: e.departmentId || "",
                    locationId: e.locationId || "",
                    reportingManagerId: e.reportingManagerId || "",
                    joiningDate: e.joiningDate ? e.joiningDate.slice(0, 10) : "",
                    leavingDate: e.leavingDate ? e.leavingDate.slice(0, 10) : "",
                    isActive: e.isActive !== false,
                    divisionIds: e.divisions?.map((d) => d.id) || [],
                });
            } catch {
                toast.error("Failed to load employee");
                navigate("/employees");
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

    const toggleDivision = (divId) => {
        setForm((prev) => ({
            ...prev,
            divisionIds: prev.divisionIds.includes(divId)
                ? prev.divisionIds.filter((d) => d !== divId)
                : [...prev.divisionIds, divId],
        }));
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
        if (form.phone && !/^[\d\s+\-().]{7,20}$/.test(form.phone))
            errs.phone = "Enter a valid phone number";
        if (form.joiningDate && form.leavingDate && form.leavingDate < form.joiningDate)
            errs.leavingDate = "Leaving date cannot be before joining date";
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
            if (!payload.reportingManagerId) payload.reportingManagerId = null;
            if (!payload.departmentId) payload.departmentId = null;
            if (!payload.locationId) payload.locationId = null;
            if (!payload.leavingDate) payload.leavingDate = null;

            if (isEdit) {
                await dispatch(updateEmployee({ id, ...payload })).unwrap();
                toast.success("Employee updated successfully!");
            } else {
                await dispatch(createEmployee(payload)).unwrap();
                toast.success("Employee created successfully!");
            }

            setIsDirty(false);
            navigate("/employees");
        } catch (err) {
            toast.error(err?.message || err || "Failed to save employee");
        } finally {
            setSaving(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const managerOptions = employees.filter(
        (e) => e.id !== id && e.isActive
    );

    const activeLocations = (locations || []).filter((l) => l.isActive !== false);

    const breadcrumbs = [
        { label: "Employees", path: "/employees" },
        { label: isEdit ? "Edit Employee" : "New Employee" },
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
    const iconStyle = () => ({
        position: "absolute", left: 12, top: "50%",
        transform: "translateY(-50%)",
        color: "var(--text-muted)", pointerEvents: "none",
    });

    const withIcon = (extra = {}) => ({ paddingLeft: 36, ...extra });

    return (
        <FormPageLayout
            title={
                isEdit
                    ? `Edit: ${form.firstName} ${form.lastName}`.trim() || "Employee"
                    : "New Employee"
            }
            subtitle={
                isEdit
                    ? "Update employee profile, job details, and assignments"
                    : "Add a new employee to the system"
            }
            breadcrumbs={breadcrumbs}
            sections={SECTIONS}
            onSave={handleSave}
            onCancel={() => navigate("/employees")}
            saving={saving}
            saveLabel={isEdit ? "Update Employee" : "Create Employee"}
            isDirty={isDirty}
        >

            {/* ── Section 1: Identity ──────────────────────────────────────── */}
            <FormSection
                id="identity"
                title="Identity"
                subtitle="Basic contact information for this employee"
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
                                style={withIcon({ borderColor: errors.firstName ? "var(--danger)" : undefined })}
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
                                style={withIcon({ borderColor: errors.lastName ? "var(--danger)" : undefined })}
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
                            style={withIcon({ borderColor: errors.email ? "var(--danger)" : undefined })}
                        />
                    </div>
                </FormField>

                <FormRow cols={2}>
                    <FormField label="Phone" error={errors.phone}>
                        <div style={{ position: "relative" }}>
                            <Phone size={15} style={iconStyle()} />
                            <input
                                className={`form-input ${errors.phone ? "input-error" : ""}`}
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                style={withIcon({ borderColor: errors.phone ? "var(--danger)" : undefined })}
                            />
                        </div>
                    </FormField>

                    <FormField label="Employee Code" hint="Unique identifier (e.g. EMP001)">
                        <div style={{ position: "relative" }}>
                            <Hash size={15} style={iconStyle()} />
                            <input
                                className="form-input"
                                name="employeeCode"
                                value={form.employeeCode}
                                onChange={handleChange}
                                placeholder="EMP001"
                                style={withIcon()}
                            />
                        </div>
                    </FormField>
                </FormRow>
            </FormSection>

            {/* ── Section 2: Job Details ───────────────────────────────────── */}
            <FormSection
                id="job"
                title="Job Details"
                subtitle="Role, department, location, and employment information"
            >
                <FormRow cols={2}>
                    <FormField label="Designation">
                        <div style={{ position: "relative" }}>
                            <Briefcase size={15} style={iconStyle()} />
                            <input
                                className="form-input"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                placeholder="e.g. Production Manager"
                                style={withIcon()}
                            />
                        </div>
                    </FormField>

                    <FormField label="Employment Type">
                        <select
                            className="form-input"
                            name="employmentType"
                            value={form.employmentType}
                            onChange={handleChange}
                        >
                            {EMPLOYMENT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
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

                    <FormField label="Branch / Location">
                        <div style={{ position: "relative" }}>
                            <MapPin size={15} style={iconStyle()} />
                            <select
                                className="form-input"
                                name="locationId"
                                value={form.locationId}
                                onChange={handleChange}
                                style={withIcon()}
                            >
                                <option value="">-- Select Location --</option>
                                {activeLocations.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name}{l.code ? ` (${l.code})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Joining Date">
                        <div style={{ position: "relative" }}>
                            <Calendar size={15} style={iconStyle()} />
                            <input
                                className="form-input"
                                name="joiningDate"
                                type="date"
                                value={form.joiningDate}
                                onChange={handleChange}
                                style={withIcon()}
                            />
                        </div>
                    </FormField>

                    <FormField label="Leaving Date" error={errors.leavingDate} hint="Leave blank if still employed">
                        <div style={{ position: "relative" }}>
                            <Calendar size={15} style={iconStyle()} />
                            <input
                                className={`form-input ${errors.leavingDate ? "input-error" : ""}`}
                                name="leavingDate"
                                type="date"
                                value={form.leavingDate}
                                onChange={handleChange}
                                style={withIcon({ borderColor: errors.leavingDate ? "var(--danger)" : undefined })}
                            />
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
                subtitle="Approval workflow — requests from this employee route to their reporting manager"
            >
                <FormField
                    label="Reporting Manager"
                    hint="When this employee requests an action, approval goes to their reporting manager automatically."
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
                            {managerOptions.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.firstName} {e.lastName}
                                    {e.designation ? ` — ${e.designation}` : ""}
                                    {e.department?.name ? ` · ${e.department.name}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </FormField>
            </FormSection>

            {/* ── Section 4: Divisions ─────────────────────────────────────── */}
            <FormSection
                id="divisions"
                title="Divisions"
                subtitle="Assign one or more divisions. The first selected division will be treated as primary."
            >
                <FormField
                    label="Divisions"
                    hint={
                        form.divisionIds.length === 0
                            ? "No divisions assigned"
                            : `${form.divisionIds.length} division(s) selected · First selected is primary`
                    }
                >
                    {(divisions || []).length === 0 ? (
                        <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0", margin: 0 }}>
                            No divisions available. Add divisions first.
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                            {(divisions || []).map((div) => {
                                const active = form.divisionIds.includes(div.id);
                                const isPrimary = form.divisionIds[0] === div.id && active;
                                return (
                                    <button
                                        key={div.id}
                                        type="button"
                                        onClick={() => toggleDivision(div.id)}
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
                                        {div.name}{isPrimary ? " (Primary)" : ""}
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