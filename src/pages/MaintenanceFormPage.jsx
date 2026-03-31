import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Wrench, CalendarClock, FileText } from "lucide-react";
import { createMaintenance, updateMaintenance } from "../store/slices/maintenanceSlice";
import { fetchEmployees } from "../store/slices/employeeSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// ── Sidebar Sections ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "basic", label: "Basic Info", icon: Wrench },
    { id: "schedule", label: "Schedule", icon: CalendarClock },
    { id: "details", label: "Details", icon: FileText },
];

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const TYPES = ["Preventive", "Corrective", "Predictive", "Emergency", "Inspection"];
const STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled", "Overdue"];

const EMPTY_FORM = {
    assetId: "",
    type: "Preventive",
    title: "",
    description: "",
    status: "Scheduled",
    priority: "Medium",
    scheduledDate: "",
    cost: "",
    technicianId: "",
    vendor: "",
    notes: "",
};

export default function MaintenanceFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { employees } = useSelector((s) => s.employees);

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [isDirty, setIsDirty] = useState(false);
    const [assets, setAssets] = useState([]);

    // ── Load dropdowns ────────────────────────────────────────────────────
    useEffect(() => {
        api.get("/assets", { params: { limit: 200 } })
            .then((r) => setAssets(r.data.data || []))
            .catch(() => { });
        dispatch(fetchEmployees({ limit: 200, isActive: true }));
    }, [dispatch]);

    // ── Load existing maintenance on edit ─────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/maintenance/${id}`);
                const m = data.data || data;
                setForm({
                    assetId: m.assetId || "",
                    type: m.type || "Preventive",
                    title: m.title || "",
                    description: m.description || "",
                    status: m.status || "Scheduled",
                    priority: m.priority || "Medium",
                    scheduledDate: m.scheduledDate ? m.scheduledDate.split("T")[0] : "",
                    cost: m.cost || "",
                    technicianId: m.technicianId || "",
                    vendor: m.vendor || "",
                    notes: m.notes || "",
                });
            } catch {
                toast.error("Failed to load maintenance record");
                navigate("/maintenance");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit, navigate]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setIsDirty(true);
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    // ── Validate ──────────────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};
        if (!form.assetId) newErrors.assetId = "Asset is required";
        if (!form.title.trim()) newErrors.title = "Title is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) { toast.error("Please fix the errors before saving"); return; }
        setSaving(true);
        try {
            if (isEdit) {
                await dispatch(updateMaintenance({ id, ...form })).unwrap();
                toast.success("Maintenance updated successfully!");
            } else {
                await dispatch(createMaintenance(form)).unwrap();
                toast.success("Maintenance scheduled successfully!");
            }
            setIsDirty(false);
            navigate("/maintenance");
        } catch (err) {
            toast.error(err || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbs = [
        { label: "Maintenance", path: "/maintenance" },
        { label: isEdit ? "Edit Record" : "Schedule Maintenance" },
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
            title={isEdit ? `Edit: ${form.title || "Maintenance"}` : "Schedule Maintenance"}
            subtitle={isEdit ? "Update maintenance record details" : "Create a new maintenance record for an asset"}
            breadcrumbs={breadcrumbs}
            sections={SECTIONS}
            onSave={handleSave}
            onCancel={() => navigate("/maintenance")}
            saving={saving}
            saveLabel={isEdit ? "Update Record" : "Schedule"}
            isDirty={isDirty}
        >

            {/* ══════════════════════════ SECTION 1: BASIC INFO ════════════════ */}
            <FormSection
                id="basic"
                title="Basic Information"
                subtitle="Asset, type, priority, and current status"
            >
                <FormField label="Asset" required error={errors.assetId}>
                    <select
                        className="form-select"
                        name="assetId"
                        value={form.assetId}
                        onChange={handleChange}
                        style={{ borderColor: errors.assetId ? "var(--danger)" : undefined }}
                    >
                        <option value="">-- Select Asset --</option>
                        {assets.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name} ({a.assetTag})
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Title" required error={errors.title}>
                    <input
                        className="form-input"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="e.g. Annual maintenance check"
                        style={{ borderColor: errors.title ? "var(--danger)" : undefined }}
                    />
                </FormField>

                <FormRow cols={2}>
                    <FormField label="Type">
                        <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                            {TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </FormField>

                    <FormField label="Priority">
                        <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                        </select>
                    </FormField>
                </FormRow>

                <FormField label="Status">
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </FormField>

                <FormField label="Description">
                    <textarea
                        className="form-input"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe the maintenance work..."
                        style={{ resize: "vertical" }}
                    />
                </FormField>
            </FormSection>

            {/* ══════════════════════════ SECTION 2: SCHEDULE ═════════════════ */}
            <FormSection
                id="schedule"
                title="Schedule & Cost"
                subtitle="Dates, technician assignment, vendor, and estimated cost"
            >
                <FormRow cols={2}>
                    <FormField label="Scheduled Date">
                        <input
                            className="form-input"
                            type="date"
                            name="scheduledDate"
                            value={form.scheduledDate}
                            onChange={handleChange}
                        />
                    </FormField>

                    <FormField label="Estimated Cost (₹)">
                        <input
                            className="form-input"
                            type="number"
                            name="cost"
                            value={form.cost}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />
                    </FormField>
                </FormRow>

                <FormField label="Technician (Employee)" hint="Internal employee assigned to this maintenance">
                    <select className="form-select" name="technicianId" value={form.technicianId} onChange={handleChange}>
                        <option value="">-- Select Technician (optional) --</option>
                        {employees
                            .filter((e) => e.isActive)
                            .map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName}
                                    {emp.employeeCode ? ` (${emp.employeeCode})` : ""}
                                    {emp.designation ? ` — ${emp.designation}` : ""}
                                </option>
                            ))}
                    </select>
                </FormField>

                <FormField label="Vendor" hint="External service provider, if any">
                    <input
                        className="form-input"
                        name="vendor"
                        value={form.vendor}
                        onChange={handleChange}
                        placeholder="e.g. Dell Service Center"
                    />
                </FormField>
            </FormSection>

            {/* ══════════════════════════ SECTION 3: DETAILS ══════════════════ */}
            <FormSection
                id="details"
                title="Additional Notes"
                subtitle="Internal remarks or extra information"
            >
                <FormField label="Notes" hint="Any special instructions, observations, or follow-up actions">
                    <textarea
                        className="form-input"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={7}
                        placeholder="Additional notes, observations, or follow-up actions..."
                        style={{ resize: "vertical" }}
                    />
                </FormField>
            </FormSection>

        </FormPageLayout>
    );
}