import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    Package, DollarSign, Settings, FileText,
    Plus, Trash2,
    IndianRupee,
} from "lucide-react";
import { createAsset, updateAsset } from "../store/slices/assetSlice";
import { fetchCategories, fetchSubCategories } from "../store/slices/categroySlice";
import { fetchDepartments } from "../store/slices/departmentSlice";
import { fetchBrands } from "../store/slices/brandSlice";
import { fetchVendors } from "../store/slices/vendorSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// ── Sidebar Sections ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "basic", label: "Basic Info", icon: Package },
    { id: "financial", label: "Financial", icon: IndianRupee },
    { id: "configuration", label: "Configuration", icon: Settings },
    { id: "details", label: "Details", icon: FileText },
];

const STATUSES = ["Active", "Inactive", "In Maintenance", "Disposed", "Lost", "Reserved"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Damaged"];

const WARRANTY_DURATIONS = [
    { label: "1 Month", months: 1 },
    { label: "3 Months", months: 3 },
    { label: "6 Months", months: 6 },
    { label: "9 Months", months: 9 },
    { label: "1 Year", months: 12 },
    { label: "18 Months", months: 18 },
    { label: "2 Years", months: 24 },
    { label: "3 Years", months: 36 },
];

// ── Config Suggestions (same as AssetModal) ───────────────────────────────────
const CONFIG_SUGGESTIONS = {
    default: [{ key: "Internet Access", value: "Yes" }, { key: "Network Type", value: "WiFi" }],
    laptop: [{ key: "OS", value: "Windows 11" }, { key: "Office Suite", value: "Microsoft 365" }, { key: "Antivirus", value: "Seqrite" }, { key: "Internet Access", value: "Yes" }, { key: "Network Type", value: "WiFi" }],
    desktop: [{ key: "OS", value: "Windows 11" }, { key: "Office Suite", value: "Microsoft 365" }, { key: "Antivirus", value: "Seqrite" }, { key: "Internet Access", value: "Yes" }, { key: "Network Type", value: "LAN" }],
    mobile: [{ key: "OS", value: "Android 14" }, { key: "SIM", value: "Airtel" }, { key: "Data Plan", value: "Active" }, { key: "Internet Access", value: "Yes" }],
    server: [{ key: "OS", value: "Ubuntu 22.04" }, { key: "RAM Config", value: "32 GB" }, { key: "Storage Config", value: "1 TB SSD" }, { key: "Internet Access", value: "Yes" }, { key: "Network Type", value: "LAN" }],
    printer: [{ key: "Driver", value: "Installed" }, { key: "Network Printer", value: "Yes" }, { key: "Paper Size", value: "A4" }],
    vehicle: [{ key: "Fuel Type", value: "Diesel" }, { key: "Insurance", value: "Active" }, { key: "RC", value: "Active" }],
    ac: [{ key: "Tonnage", value: "1.5 Ton" }, { key: "AMC Plan", value: "Active" }],
};

function getSuggestions(categoryName = "", subCategoryName = "") {
    const name = (subCategoryName || categoryName || "").toLowerCase();
    if (name.includes("laptop")) return CONFIG_SUGGESTIONS.laptop;
    if (name.includes("desktop")) return CONFIG_SUGGESTIONS.desktop;
    if (name.includes("mobile") || name.includes("phone")) return CONFIG_SUGGESTIONS.mobile;
    if (name.includes("server")) return CONFIG_SUGGESTIONS.server;
    if (name.includes("printer")) return CONFIG_SUGGESTIONS.printer;
    if (name.includes("vehicle") || name.includes("car") || name.includes("bike")) return CONFIG_SUGGESTIONS.vehicle;
    if (name.includes("ac") || name.includes("air")) return CONFIG_SUGGESTIONS.ac;
    return CONFIG_SUGGESTIONS.default;
}

// ── parseCustomFields helper ──────────────────────────────────────────────────
function parseCustomFields(cf) {
    if (!cf) return [];
    if (typeof cf === "string") { try { cf = JSON.parse(cf); } catch { return []; } }
    if (typeof cf === "object" && !Array.isArray(cf))
        return Object.entries(cf).map(([key, value]) => ({ key, value: String(value) }));
    if (Array.isArray(cf)) return cf;
    return [];
}

// ── ConfigurationSection (inline, no separate component needed) ───────────────
function ConfigurationSection({ configFields, setConfigFields, categoryName, subCategoryName }) {
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const suggestions = getSuggestions(categoryName, subCategoryName);

    const handleAdd = () => {
        const key = newKey.trim();
        if (!key) return toast.error("Field name is required");
        if (configFields.some((f) => f.key.toLowerCase() === key.toLowerCase()))
            return toast.error("This field already exists");
        setConfigFields((prev) => [...prev, { key, value: newValue.trim() }]);
        setNewKey(""); setNewValue("");
    };

    const handleSuggestion = (sug) => {
        if (configFields.some((f) => f.key.toLowerCase() === sug.key.toLowerCase()))
            return toast.error(`"${sug.key}" already added`);
        setConfigFields((prev) => [...prev, { ...sug }]);
    };

    return (
        <FormSection
            id="configuration"
            title="Configuration"
            subtitle="Software, network, and hardware details for this asset"
        >
            {/* Info note */}
            <div style={{
                background: "var(--accent-glow)",
                border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: 8, padding: "10px 14px",
                fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
            }}>
                💡 Add any configuration details — OS, Software, Network, License, etc.
                These will appear on the Asset Handover Letter PDF.{" "}
                All fields are <strong style={{ color: "var(--accent)" }}>optional</strong>.
            </div>

            {/* Quick Add suggestions */}
            {suggestions.length > 0 && (
                <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                        Quick Add
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {suggestions.map((sug) => {
                            const alreadyAdded = configFields.some((f) => f.key.toLowerCase() === sug.key.toLowerCase());
                            return (
                                <button
                                    key={sug.key}
                                    type="button"
                                    onClick={() => handleSuggestion(sug)}
                                    disabled={alreadyAdded}
                                    style={{
                                        padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                                        cursor: alreadyAdded ? "not-allowed" : "pointer",
                                        border: "1px solid var(--border)",
                                        background: alreadyAdded ? "var(--bg-hover)" : "var(--bg-secondary)",
                                        color: alreadyAdded ? "var(--text-muted)" : "var(--text-primary)",
                                        opacity: alreadyAdded ? 0.5 : 1, transition: "all 0.15s",
                                    }}
                                >
                                    {alreadyAdded ? "✓ " : "+ "}{sug.key}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Existing fields */}
            {configFields.length > 0 && (
                <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                        Configuration Fields ({configFields.length})
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {configFields.map((field, i) => (
                            <div key={i} style={{
                                display: "grid", gridTemplateColumns: "1fr 1.5fr auto",
                                gap: 8, alignItems: "center",
                                background: "var(--bg-secondary)", border: "1px solid var(--border)",
                                borderRadius: 8, padding: "8px 12px",
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {field.key}
                                </span>
                                <input
                                    className="form-input"
                                    value={field.value}
                                    onChange={(e) => setConfigFields((prev) => prev.map((f, idx) => idx === i ? { ...f, value: e.target.value } : f))}
                                    placeholder="Enter value..."
                                    style={{ fontSize: 13, padding: "6px 10px" }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => setConfigFields((prev) => prev.filter((_, idx) => idx !== i))}
                                    style={{ padding: "6px 8px" }}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add custom field */}
            <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    Add Custom Field
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: 8, alignItems: "center" }}>
                    <input
                        className="form-input"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="Field name (e.g. OS)"
                        style={{ fontSize: 13 }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                    />
                    <input
                        className="form-input"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Value (e.g. Windows 11)"
                        style={{ fontSize: 13 }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                    />
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleAdd}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px" }}
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    Press Enter or click Add. Examples: OS, Antivirus, WiFi, AMC Plan...
                </p>
            </div>

            {/* Empty state */}
            {configFields.length === 0 && (
                <div style={{
                    textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13,
                    border: "1px dashed var(--border)", borderRadius: 10,
                }}>
                    No configuration added yet. Use Quick Add or add custom fields above.
                </div>
            )}
        </FormSection>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSET FORM PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AssetFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { categories, subCategories } = useSelector((s) => s.categories);
    const { departments } = useSelector((s) => s.departments);
    const { brands } = useSelector((s) => s.brands);
    const { vendors } = useSelector((s) => s.vendors);

    const [form, setForm] = useState({
        name: "",
        categoryId: "",
        subCategoryId: "",
        description: "",
        brandId: "",
        vendorId: "",
        model: "",
        serialNumber: "",
        status: "Active",
        condition: "Good",
        locationId: "",
        departmentId: "",
        purchaseDate: "",
        purchasePrice: "",
        currentValue: "",
        warrantyExpiry: "",
        notes: "",
    });

    const [configFields, setConfigFields] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [isDirty, setIsDirty] = useState(false);
    const [locations, setLocations] = useState([]);

    // ── Load dropdowns ────────────────────────────────────────────────────
    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchSubCategories());
        dispatch(fetchDepartments());
        dispatch(fetchBrands());
        dispatch(fetchVendors());
        api.get("/locations").then((res) => setLocations(res.data.data || [])).catch(() => { });
    }, [dispatch]);

    // ── Load existing asset on edit ───────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/assets/${id}`);
                const a = data.data || data;
                setForm({
                    name: a.name || "",
                    categoryId: a.categoryId?.toString() || a.category?.id?.toString() || "",
                    subCategoryId: a.subCategoryId?.toString() || a.subCategory?.id?.toString() || "",
                    description: a.description || "",
                    brandId: a.brandId || "",
                    vendorId: a.vendorId || "",
                    model: a.model || "",
                    serialNumber: a.serialNumber || "",
                    status: a.status || "Active",
                    condition: a.condition || "Good",
                    locationId: a.locationId?.toString() || "",
                    departmentId: a.departmentId?.toString() || "",
                    purchaseDate: a.purchaseDate ? a.purchaseDate.split("T")[0] : "",
                    purchasePrice: a.purchasePrice || "",
                    currentValue: a.currentValue || "",
                    warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.split("T")[0] : "",
                    notes: a.notes || "",
                });
                setConfigFields(parseCustomFields(a.customFields));
            } catch {
                toast.error("Failed to load asset");
                navigate("/assets");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit, navigate]);

    // ── SubCategory reset when category changes ───────────────────────────
    useEffect(() => {
        if (!form.categoryId) { setForm((f) => ({ ...f, subCategoryId: "" })); return; }
        if (!subCategories.length) return;
        const matchingSubs = subCategories.filter((s) => s.categoryId.toString() === form.categoryId.toString());
        const stillValid = matchingSubs.some((s) => s.id.toString() === form.subCategoryId.toString());
        if (!stillValid) setForm((f) => ({ ...f, subCategoryId: "" }));
    }, [form.categoryId, subCategories]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setIsDirty(true);
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleWarrantyDuration = (months) => {
        if (!months) return;
        const base = form.purchaseDate ? new Date(form.purchaseDate) : new Date();
        base.setMonth(base.getMonth() + months);
        base.setDate(base.getDate() - 1);
        const yyyy = base.getFullYear();
        const mm = String(base.getMonth() + 1).padStart(2, "0");
        const dd = String(base.getDate()).padStart(2, "0");
        setForm((f) => ({ ...f, warrantyExpiry: `${yyyy}-${mm}-${dd}` }));
        setIsDirty(true);
    };

    // ── Validate ──────────────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = "Asset name is required";
        if (!form.categoryId) newErrors.categoryId = "Category is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) { toast.error("Please fix the errors before saving"); return; }

        const customFields = configFields.length > 0
            ? configFields.reduce((acc, { key, value }) => {
                if (key.trim()) acc[key.trim()] = value.trim();
                return acc;
            }, {})
            : null;

        setSaving(true);
        try {
            const payload = { ...form, customFields };
            if (isEdit) {
                await dispatch(updateAsset({ id, ...payload })).unwrap();
                toast.success("Asset updated successfully!");
            } else {
                await dispatch(createAsset(payload)).unwrap();
                toast.success("Asset created successfully!");
            }
            setIsDirty(false);
            navigate("/assets");
        } catch (err) {
            toast.error(err || "Failed to save asset");
        } finally {
            setSaving(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────
    const selectedCategory = categories.find((c) => c.id.toString() === form.categoryId.toString());
    const selectedSubCategory = subCategories.find((s) => s.id.toString() === form.subCategoryId.toString());

    const filteredSubs = subCategories.filter(
        (s) => s.categoryId.toString() === form.categoryId.toString() && s.isActive
    );

    const breadcrumbs = [
        { label: "Assets", path: "/assets" },
        { label: isEdit ? "Edit Asset" : "New Asset" },
    ];

    // ── Sections with config badge ────────────────────────────────────────
    const sectionsWithBadge = SECTIONS.map((s) =>
        s.id === "configuration" && configFields.length > 0
            ? { ...s, label: `Configuration (${configFields.length})` }
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
            title={isEdit ? `Edit: ${form.name || "Asset"}` : "New Asset"}
            subtitle={isEdit ? "Update asset details, configuration, and financial info" : "Register a new asset in AssetFlow"}
            breadcrumbs={breadcrumbs}
            sections={sectionsWithBadge}
            onSave={handleSave}
            onCancel={() => navigate("/assets")}
            saving={saving}
            saveLabel={isEdit ? "Update Asset" : "Create Asset"}
            isDirty={isDirty}
        >

            {/* ══════════════════════════ SECTION 1: BASIC INFO ════════════════ */}
            <FormSection
                id="basic"
                title="Basic Information"
                subtitle="Asset name, category, brand, and physical details"
            >
                <FormRow cols={2}>
                    <FormField label="Asset Name" required error={errors.name}>
                        <input
                            className={`form-input ${errors.name ? "input-error" : ""}`}
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. MacBook Pro 16"
                            style={{ borderColor: errors.name ? "var(--danger)" : undefined }}
                        />
                    </FormField>

                    <FormField label="Category" required error={errors.categoryId}>
                        <select
                            className="form-select"
                            name="categoryId"
                            value={form.categoryId}
                            onChange={handleChange}
                            style={{ borderColor: errors.categoryId ? "var(--danger)" : undefined }}
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id.toString()}>{c.name}</option>
                            ))}
                        </select>
                    </FormField>
                </FormRow>

                {form.categoryId && (
                    <FormField label="Sub Category">
                        <select
                            className="form-select"
                            name="subCategoryId"
                            value={form.subCategoryId}
                            onChange={handleChange}
                        >
                            <option value="">-- Select Sub Category --</option>
                            {filteredSubs.map((s) => (
                                <option key={s.id} value={s.id.toString()}>{s.name}</option>
                            ))}
                        </select>
                        {filteredSubs.length === 0 && (
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                                No subcategories for this category
                            </span>
                        )}
                    </FormField>
                )}

                <FormRow cols={2}>
                    <FormField label="Brand">
                        <select className="form-select" name="brandId" value={form.brandId} onChange={handleChange}>
                            <option value="">-- Select Brand --</option>
                            {brands.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Model">
                        <input
                            className="form-input"
                            name="model"
                            value={form.model}
                            onChange={handleChange}
                            placeholder="e.g. MacBook Pro M3 16"
                        />
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Serial Number">
                        <input
                            className="form-input"
                            name="serialNumber"
                            value={form.serialNumber}
                            onChange={handleChange}
                            placeholder="SN-XXXXX"
                        />
                    </FormField>

                    <FormField label="Status">
                        <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Condition">
                        <select className="form-select" name="condition" value={form.condition} onChange={handleChange}>
                            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </FormField>

                    <FormField label="Physical Location">
                        <select className="form-select" name="locationId" value={form.locationId} onChange={handleChange}>
                            <option value="">-- Select Location --</option>
                            {locations.filter((l) => l.isActive).map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name}{l.code ? ` (${l.code})` : ""}
                                </option>
                            ))}
                        </select>
                    </FormField>
                </FormRow>

                <FormField label="Owning Department">
                    <select className="form-select" name="departmentId" value={form.departmentId} onChange={handleChange}>
                        <option value="">-- Select Department --</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}{d.code ? ` (${d.code})` : ""}{d.division?.name ? ` — ${d.division.name}` : ""}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Description">
                    <textarea
                        className="form-input"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Asset description..."
                        style={{ resize: "vertical" }}
                    />
                </FormField>
            </FormSection>

            {/* ══════════════════════════ SECTION 2: FINANCIAL ════════════════ */}
            <FormSection
                id="financial"
                title="Financial Details"
                subtitle="Purchase info, valuation, warranty, and vendor"
            >
                <FormRow cols={2}>
                    <FormField label="Purchase Date">
                        <input
                            className="form-input"
                            type="date"
                            name="purchaseDate"
                            value={form.purchaseDate}
                            onChange={handleChange}
                        />
                    </FormField>

                    <FormField label="Purchase Price (₹)">
                        <input
                            className="form-input"
                            type="number"
                            name="purchasePrice"
                            value={form.purchasePrice}
                            onChange={handleChange}
                            placeholder="1999.99"
                            min="0"
                            step="0.01"
                        />
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Current Value (₹)">
                        <input
                            className="form-input"
                            type="number"
                            name="currentValue"
                            value={form.currentValue}
                            onChange={handleChange}
                            placeholder="1500.00"
                            min="0"
                            step="0.01"
                        />
                    </FormField>

                    <FormField
                        label="Warranty Expiry"
                        hint="Select a duration to auto-fill, or enter date manually"
                    >
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                                className="form-select"
                                defaultValue=""
                                onChange={(e) => handleWarrantyDuration(e.target.value ? Number(e.target.value) : null)}
                                style={{ flex: "0 0 140px" }}
                            >
                                <option value="">Duration…</option>
                                {WARRANTY_DURATIONS.map((d) => (
                                    <option key={d.label} value={d.months}>{d.label}</option>
                                ))}
                                <option value="">Custom</option>
                            </select>
                            <span style={{ color: "var(--text-muted)" }}>→</span>
                            <input
                                className="form-input"
                                type="date"
                                name="warrantyExpiry"
                                value={form.warrantyExpiry}
                                onChange={handleChange}
                                style={{ flex: 1 }}
                            />
                        </div>
                    </FormField>
                </FormRow>

                <FormField label="Vendor">
                    <select className="form-select" name="vendorId" value={form.vendorId} onChange={handleChange}>
                        <option value="">-- Select Vendor --</option>
                        {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.name}{v.contactPerson ? ` — ${v.contactPerson}` : ""}
                            </option>
                        ))}
                    </select>
                </FormField>
            </FormSection>

            {/* ══════════════════════ SECTION 3: CONFIGURATION ════════════════ */}
            <ConfigurationSection
                configFields={configFields}
                setConfigFields={(val) => { setConfigFields(val); setIsDirty(true); }}
                categoryName={selectedCategory?.name || ""}
                subCategoryName={selectedSubCategory?.name || ""}
            />

            {/* ══════════════════════════ SECTION 4: DETAILS ══════════════════ */}
            <FormSection
                id="details"
                title="Additional Details"
                subtitle="Internal notes and extra information"
            >
                <FormField label="Notes" hint="Special instructions, maintenance history, or any relevant info">
                    <textarea
                        className="form-input"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={7}
                        placeholder="Additional notes, special instructions, or relevant information..."
                        style={{ resize: "vertical" }}
                    />
                </FormField>
            </FormSection>

        </FormPageLayout>
    );
}