import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FileText, Building2, CalendarRange, Package } from "lucide-react";
import { createAmcContract, updateAmcContract } from "../store/slices/amcSlice";
import { fetchAssets } from "../store/slices/assetSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// ── Sidebar Sections ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "contract", label: "Contract Info", icon: FileText },
    { id: "vendor", label: "Vendor", icon: Building2 },
    { id: "dates", label: "Dates & Cost", icon: CalendarRange },
    { id: "assets", label: "Assets", icon: Package },
];

const COVERAGE_TYPES = ["Labor Only", "Parts + Labor", "On-site", "Off-site"];
const FREQUENCIES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "On-Demand"];
const CONTRACT_TYPES = ["AMC", "CMC"];

const EMPTY_FORM = {
    contractNumber: "",
    vendorName: "",
    vendorContact: "",
    vendorEmail: "",
    contractType: "AMC",
    coverageType: "Parts + Labor",
    serviceFrequency: "Yearly",
    startDate: "",
    endDate: "",
    contractCost: "",
    remarks: "",
    documentUrl: "",
    assetIds: [],
};

export default function AmcFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { assets } = useSelector((s) => s.assets);

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [isDirty, setIsDirty] = useState(false);
    const [assetSearch, setAssetSearch] = useState("");

    // ── Load assets dropdown ──────────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchAssets({ limit: 200 }));
    }, [dispatch]);

    // ── Load existing contract on edit ────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/amc/${id}`);
                const c = data.data || data;
                setForm({
                    contractNumber: c.contractNumber || "",
                    vendorName: c.vendorName || "",
                    vendorContact: c.vendorContact || "",
                    vendorEmail: c.vendorEmail || "",
                    contractType: c.contractType || "AMC",
                    coverageType: c.coverageType || "Parts + Labor",
                    serviceFrequency: c.serviceFrequency || "Yearly",
                    startDate: c.startDate || "",
                    endDate: c.endDate || "",
                    contractCost: c.contractCost || "",
                    remarks: c.remarks || "",
                    documentUrl: c.documentUrl || "",
                    assetIds: c.assets?.map((a) => a.id) || [],
                });
            } catch {
                toast.error("Failed to load contract");
                navigate("/amc");
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

    const toggleAsset = (assetId) => {
        setForm((prev) => ({
            ...prev,
            assetIds: prev.assetIds.includes(assetId)
                ? prev.assetIds.filter((id) => id !== assetId)
                : [...prev.assetIds, assetId],
        }));
        setIsDirty(true);
    };

    // ── Validate ──────────────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};
        if (!form.contractNumber.trim()) newErrors.contractNumber = "Contract number is required";
        if (!form.vendorName.trim()) newErrors.vendorName = "Vendor name is required";
        if (!form.startDate) newErrors.startDate = "Start date is required";
        if (!form.endDate) newErrors.endDate = "End date is required";
        if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate))
            newErrors.endDate = "End date must be after start date";
        if (form.vendorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.vendorEmail))
            newErrors.vendorEmail = "Enter a valid email address";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) { toast.error("Please fix the errors before saving"); return; }
        setSaving(true);
        try {
            const payload = { ...form, contractCost: Number(form.contractCost) || 0 };
            if (isEdit) {
                await dispatch(updateAmcContract({ id, ...payload })).unwrap();
                toast.success("Contract updated successfully!");
            } else {
                await dispatch(createAmcContract(payload)).unwrap();
                toast.success("Contract created successfully!");
            }
            setIsDirty(false);
            navigate("/amc");
        } catch (err) {
            toast.error(err || "Failed to save contract");
        } finally {
            setSaving(false);
        }
    };

    // ── Filtered assets for search ────────────────────────────────────────
    const filteredAssets = assets.filter((a) =>
        !assetSearch ||
        a.name?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.assetTag?.toLowerCase().includes(assetSearch.toLowerCase())
    );

    const breadcrumbs = [
        { label: "AMC / CMC", path: "/amc" },
        { label: isEdit ? "Edit Contract" : "New Contract" },
    ];

    // Sections with asset count badge
    const sectionsWithBadge = SECTIONS.map((s) =>
        s.id === "assets" && form.assetIds.length > 0
            ? { ...s, label: `Assets (${form.assetIds.length})` }
            : s
    );

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    return (
        <FormPageLayout
            title={isEdit ? `Edit: ${form.contractNumber || "Contract"}` : "New AMC / CMC Contract"}
            subtitle={isEdit ? "Update contract details, vendor info, and covered assets" : "Create a new AMC or CMC contract and map assets"}
            breadcrumbs={breadcrumbs}
            sections={sectionsWithBadge}
            onSave={handleSave}
            onCancel={() => navigate("/amc")}
            saving={saving}
            saveLabel={isEdit ? "Update Contract" : "Create Contract"}
            isDirty={isDirty}
        >

            {/* ══════════════════════ SECTION 1: CONTRACT INFO ════════════════ */}
            <FormSection
                id="contract"
                title="Contract Information"
                subtitle="Contract number, type, coverage, and service frequency"
            >
                <FormRow cols={2}>
                    <FormField label="Contract Number" required error={errors.contractNumber}>
                        <input
                            className="form-input"
                            name="contractNumber"
                            value={form.contractNumber}
                            onChange={handleChange}
                            placeholder="AMC-2024-001"
                            style={{ borderColor: errors.contractNumber ? "var(--danger)" : undefined }}
                        />
                    </FormField>

                    <FormField label="Contract Type">
                        <select className="form-select" name="contractType" value={form.contractType} onChange={handleChange}>
                            {CONTRACT_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Coverage Type">
                        <select className="form-select" name="coverageType" value={form.coverageType} onChange={handleChange}>
                            {COVERAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </FormField>

                    <FormField label="Service Frequency">
                        <select className="form-select" name="serviceFrequency" value={form.serviceFrequency} onChange={handleChange}>
                            {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                        </select>
                    </FormField>
                </FormRow>

                <FormField label="Document URL" hint="Google Drive, SharePoint, or any document link">
                    <input
                        className="form-input"
                        name="documentUrl"
                        value={form.documentUrl}
                        onChange={handleChange}
                        placeholder="https://drive.google.com/..."
                    />
                </FormField>
            </FormSection>

            {/* ════════════════════════ SECTION 2: VENDOR ═════════════════════ */}
            <FormSection
                id="vendor"
                title="Vendor Details"
                subtitle="Service provider name, contact, and email"
            >
                <FormField label="Vendor Name" required error={errors.vendorName}>
                    <input
                        className="form-input"
                        name="vendorName"
                        value={form.vendorName}
                        onChange={handleChange}
                        placeholder="e.g. Tech Solutions Pvt Ltd"
                        style={{ borderColor: errors.vendorName ? "var(--danger)" : undefined }}
                    />
                </FormField>

                <FormRow cols={2}>
                    <FormField label="Vendor Contact">
                        <input
                            className="form-input"
                            name="vendorContact"
                            value={form.vendorContact}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                        />
                    </FormField>

                    <FormField label="Vendor Email" error={errors.vendorEmail}>
                        <input
                            className="form-input"
                            type="email"
                            name="vendorEmail"
                            value={form.vendorEmail}
                            onChange={handleChange}
                            placeholder="vendor@company.com"
                            style={{ borderColor: errors.vendorEmail ? "var(--danger)" : undefined }}
                        />
                    </FormField>
                </FormRow>
            </FormSection>

            {/* ══════════════════════ SECTION 3: DATES & COST ═════════════════ */}
            <FormSection
                id="dates"
                title="Dates & Cost"
                subtitle="Contract validity period, total cost, and remarks"
            >
                <FormRow cols={2}>
                    <FormField label="Start Date" required error={errors.startDate}>
                        <input
                            className="form-input"
                            type="date"
                            name="startDate"
                            value={form.startDate}
                            onChange={handleChange}
                            style={{ borderColor: errors.startDate ? "var(--danger)" : undefined }}
                        />
                    </FormField>

                    <FormField label="End Date" required error={errors.endDate}>
                        <input
                            className="form-input"
                            type="date"
                            name="endDate"
                            value={form.endDate}
                            onChange={handleChange}
                            style={{ borderColor: errors.endDate ? "var(--danger)" : undefined }}
                        />
                    </FormField>
                </FormRow>

                <FormField label="Contract Cost (₹)">
                    <input
                        className="form-input"
                        type="number"
                        name="contractCost"
                        value={form.contractCost}
                        onChange={handleChange}
                        placeholder="50000"
                        min="0"
                    />
                </FormField>

                <FormField label="Remarks" hint="Additional notes or conditions">
                    <textarea
                        className="form-input"
                        name="remarks"
                        value={form.remarks}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Any additional notes or conditions..."
                        style={{ resize: "vertical" }}
                    />
                </FormField>
            </FormSection>

            {/* ════════════════════════ SECTION 4: ASSETS ═════════════════════ */}
            <FormSection
                id="assets"
                title="Covered Assets"
                subtitle="Select assets covered under this contract"
            >
                {/* Selected count info */}
                <div style={{
                    background: form.assetIds.length > 0 ? "var(--accent-glow)" : "var(--bg-secondary)",
                    border: `1px solid ${form.assetIds.length > 0 ? "rgba(37,99,235,0.3)" : "var(--border)"}`,
                    borderRadius: 8, padding: "10px 14px",
                    fontSize: 12, color: "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <span>
                        {form.assetIds.length > 0
                            ? <><strong style={{ color: "var(--accent)" }}>{form.assetIds.length} asset{form.assetIds.length > 1 ? "s" : ""}</strong> selected for this contract</>
                            : "No assets selected yet — select from the list below"
                        }
                    </span>
                    {form.assetIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => { setForm((p) => ({ ...p, assetIds: [] })); setIsDirty(true); }}
                            style={{ fontSize: 11, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Search */}
                <FormField label="Search Assets">
                    <input
                        className="form-input"
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        placeholder="Search by asset name or tag..."
                    />
                </FormField>

                {/* Asset checklist */}
                <div style={{
                    maxHeight: 280, overflowY: "auto",
                    border: "1px solid var(--border)", borderRadius: 10,
                    display: "flex", flexDirection: "column", gap: 2, padding: 6,
                }}>
                    {filteredAssets.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: 20 }}>
                            No assets found
                        </p>
                    ) : filteredAssets.map((asset) => {
                        const selected = form.assetIds.includes(asset.id);
                        return (
                            <label
                                key={asset.id}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                                    background: selected ? "var(--accent-glow)" : "transparent",
                                    border: `1px solid ${selected ? "var(--accent)" : "transparent"}`,
                                    transition: "all 0.15s",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleAsset(asset.id)}
                                    style={{ accentColor: "var(--accent)", flexShrink: 0 }}
                                />
                                <span style={{
                                    fontSize: 11, fontFamily: "monospace",
                                    color: "var(--accent)", background: "var(--accent-glow)",
                                    padding: "1px 6px", borderRadius: 4, flexShrink: 0,
                                }}>
                                    {asset.assetTag}
                                </span>
                                <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1 }}>
                                    {asset.name}
                                </span>
                                {asset.department?.name && (
                                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                                        {asset.department.name}
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </div>
            </FormSection>

        </FormPageLayout>
    );
}