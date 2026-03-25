import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Save, ToggleLeft, ToggleRight } from "lucide-react";
import {
    createSubCategory,
    updateSubCategory,
    clearSubCategoryError,
} from "../store/slices/categroySlice";
import toast from "react-hot-toast";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
    "💻", "🖥️", "🖨️", "📱", "⌨️", "🖱️", "📷", "📹", "🎙️", "🔌",
    "💡", "🔧", "🔩", "🛠️", "🪑", "🚗", "🏢", "📦", "📋", "🗂️",
    "💰", "📊", "🏗️", "🔬", "🧪", "🌐", "📡", "🖲️", "💾", "📀",
];

const COLOR_PRESETS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
    "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#06b6d4",
    "#64748b", "#78716c",
];

const defaultForm = {
    name: "",
    categoryId: "",
    description: "",
    icon: "",
    color: "#6366f1",
    depreciationRate: "",
    usefulLife: "",
    isActive: true,
};

const labelStyle = {
    color: "var(--text-muted)",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    display: "block",
    marginBottom: 6,
};

// ═════════════════════════════════════════════════════════════════════════════
export default function SubCategoryForm({
    initialData = null,
    defaultCategoryId = null,
    onClose,
    onSuccess,
}) {
    const dispatch = useDispatch();
    const { categories } = useSelector((s) => s.categories);

    const isEdit = Boolean(initialData);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    // ── Selected parent for depreciation hint ─────────────────────────────────
    const selectedCat = categories.find((c) => c.id === Number(form.categoryId));

    // ── Pre-fill ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name || "",
                categoryId: initialData.categoryId?.toString() || "",
                description: initialData.description || "",
                icon: initialData.icon || "",
                color: initialData.color || "#6366f1",
                depreciationRate: initialData.depreciationRate ?? "",
                usefulLife: initialData.usefulLife ?? "",
                isActive: initialData.isActive ?? true,
            });
        } else {
            setForm({ ...defaultForm, categoryId: defaultCategoryId?.toString() || "" });
        }
        dispatch(clearSubCategoryError());
    }, [initialData, defaultCategoryId, dispatch]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        if (!form.name.trim()) return "Sub-category name is required.";
        if (!form.categoryId) return "Please select a parent category.";
        if (
            form.depreciationRate !== "" &&
            (isNaN(Number(form.depreciationRate)) ||
                Number(form.depreciationRate) < 0 ||
                Number(form.depreciationRate) > 100)
        )
            return "Depreciation rate must be between 0 and 100.";
        if (
            form.usefulLife !== "" &&
            (isNaN(Number(form.usefulLife)) || Number(form.usefulLife) < 0)
        )
            return "Useful life must be a positive number.";
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const err = validate();
        if (err) return toast.error(err);

        const payload = {
            name: form.name.trim(),
            categoryId: parseInt(form.categoryId),
            description: form.description.trim() || undefined,
            icon: form.icon || undefined,
            color: form.color || undefined,
            // null = inherit from parent (controller: ?? null)
            depreciationRate: form.depreciationRate !== "" ? parseFloat(form.depreciationRate) : null,
            usefulLife: form.usefulLife !== "" ? parseInt(form.usefulLife) : null,
            ...(isEdit && { isActive: form.isActive }),
        };

        setSaving(true);
        try {
            const action = isEdit
                ? dispatch(updateSubCategory({ id: initialData.id, ...payload }))
                : dispatch(createSubCategory(payload));
            const result = await action;
            if (result.error) {
                toast.error(result.payload || "Something went wrong.");
            } else {
                toast.success(isEdit ? "Sub-category updated!" : "Sub-category created!");
                onSuccess?.();
                onClose();
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000, padding: 20,
            }}
        >
            <div
                className="card"
                style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 0, borderRadius: 16 }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "18px 24px", borderBottom: "1px solid var(--border)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: form.color + "22",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                            }}
                        >
                            {form.icon || "🗂️"}
                        </div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                            {isEdit ? "Edit Sub-Category" : "New Sub-Category"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: 6 }}>
                        <X size={16} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Parent Category — Required */}
                    <div>
                        <label style={labelStyle}>Parent Category *</label>
                        <select
                            className="form-input"
                            name="categoryId"
                            value={form.categoryId}
                            onChange={handleChange}
                            style={{ cursor: "pointer" }}
                        >
                            <option value="">— Select Category —</option>
                            {categories
                                .filter((c) => c.isActive)
                                .map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.icon ? `${c.icon} ` : ""}{c.name}
                                    </option>
                                ))}
                        </select>
                        {/* Inherited depreciation hint */}
                        {selectedCat && (
                            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 5 }}>
                                💡 Inherits {selectedCat.depreciationRate}% depreciation from this category if left blank
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label style={labelStyle}>Sub-Category Name *</label>
                        <input
                            className="form-input"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. Laptops"
                            maxLength={100}
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            className="form-input"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Brief description..."
                            rows={2}
                            maxLength={500}
                            style={{ resize: "vertical", minHeight: 60 }}
                        />
                    </div>

                    {/* Icon + Color */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Icon</label>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ width: "100%", justifyContent: "flex-start", gap: 10, fontWeight: 400, fontSize: 14 }}
                                onClick={() => setShowIconPicker((p) => !p)}
                            >
                                <span style={{ fontSize: 18 }}>{form.icon || "🗂️"}</span>
                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                                    {form.icon ? "Change icon" : "Pick icon"}
                                </span>
                            </button>
                            {showIconPicker && (
                                <div
                                    style={{
                                        marginTop: 6, background: "var(--bg-card)", border: "1px solid var(--border)",
                                        borderRadius: 10, padding: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                    }}
                                >
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                                        {ICON_OPTIONS.map((ic) => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => { setForm((p) => ({ ...p, icon: ic })); setShowIconPicker(false); }}
                                                style={{
                                                    padding: 6, borderRadius: 6, cursor: "pointer", fontSize: 18,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: form.icon === ic ? "var(--accent-glow)" : "var(--bg-secondary)",
                                                    border: `1px solid ${form.icon === ic ? "var(--accent)" : "var(--border)"}`,
                                                }}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={labelStyle}>Color</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", paddingTop: 4 }}>
                                {COLOR_PRESETS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, color: c }))}
                                        style={{
                                            width: 22, height: 22, borderRadius: "50%", background: c, padding: 0,
                                            border: form.color === c ? "2px solid var(--text-primary)" : "2px solid transparent",
                                            boxShadow: form.color === c ? "0 0 0 2px var(--bg-card), 0 0 0 4px var(--text-primary)" : "none",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    name="color"
                                    value={form.color}
                                    onChange={handleChange}
                                    style={{
                                        width: 28, height: 28, border: "2px solid var(--border)",
                                        borderRadius: 6, padding: 2, cursor: "pointer", background: "none",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Depreciation + Useful Life */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Depreciation Rate (%/yr)</label>
                            <input
                                className="form-input"
                                name="depreciationRate"
                                type="number"
                                value={form.depreciationRate}
                                onChange={handleChange}
                                placeholder={
                                    selectedCat ? `${selectedCat.depreciationRate} (inherited)` : "Leave blank to inherit"
                                }
                                min={0} max={100} step={0.1}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Useful Life (years)</label>
                            <input
                                className="form-input"
                                name="usefulLife"
                                type="number"
                                value={form.usefulLife}
                                onChange={handleChange}
                                placeholder="Leave blank to inherit"
                                min={0}
                            />
                        </div>
                    </div>

                    {/* isActive toggle — edit only */}
                    {isEdit && (
                        <div
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 16px", background: "var(--bg-secondary)",
                                borderRadius: 10, border: "1px solid var(--border)",
                            }}
                        >
                            <div>
                                <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, margin: 0 }}>
                                    Sub-Category Active
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>
                                    Inactive sub-categories won't appear for non-admins
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                            >
                                {form.isActive
                                    ? <ToggleRight size={32} color="var(--success)" />
                                    : <ToggleLeft size={32} color="var(--text-muted)" />}
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                        <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.6 : 1 }}
                        >
                            <Save size={15} />
                            {saving ? "Saving..." : isEdit ? "Update Sub-Category" : "Create Sub-Category"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}