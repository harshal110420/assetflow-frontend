import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu as MenuIcon, Hash, Layers, Settings } from "lucide-react";
import { ToggleLeft, ToggleRight } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// ── Sidebar sections ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "basic", label: "Basic Info", icon: MenuIcon },
    { id: "actions", label: "Actions", icon: Settings },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const ALL_ACTIONS = [
    { key: "view", label: "View", color: "var(--accent)" },
    { key: "new", label: "New", color: "var(--success)" },
    { key: "edit", label: "Edit", color: "var(--warning)" },
    { key: "delete", label: "Delete", color: "var(--danger)" },
    { key: "import", label: "Import", color: "var(--accent-2)" },
    { key: "export", label: "Export", color: "#ff8c42" },
    { key: "print", label: "Print", color: "var(--info)" },
    { key: "approve", label: "Approve", color: "var(--info)" },
    { key: "reject", label: "Reject", color: "var(--info)" },
];

const ICON_OPTIONS = [
    "LayoutDashboard", "Package", "Wrench", "CheckSquare", "BarChart2", "Users",
    "Shield", "MapPin", "Settings", "FileText", "Database", "DatabaseZapIcon", "DatabaseIcon", "Bell", "Calendar",
    "Truck", "Monitor", "Smartphone", "Laptop", "Server", "Cpu", "HardDrive",
    "Clipboard", "ClipboardList", "FolderOpen", "Archive", "Tag", "Layers",
    "PieChart", "TrendingUp", "DollarSign", "ShoppingCart", "Tool", "AlertCircle",
];

const SYSTEM_SLUGS = [
    "dashboard", "asset_master", "maintenance", "approvals",
    "reports", "users", "roles", "locations", "settings",
];

function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// ── Dynamic icon renderer ─────────────────────────────────────────────────────
function DynamicIcon({ name, size = 16, color = "currentColor" }) {
    const [Icon, setIcon] = useState(null);
    useEffect(() => {
        let cancelled = false;
        import("lucide-react").then((mod) => {
            if (!cancelled) setIcon(() => mod[name] || mod["Package"]);
        });
        return () => { cancelled = true; };
    }, [name]);
    if (!Icon) return <span style={{ width: size, height: size, display: "inline-block" }} />;
    return <Icon size={size} color={color} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MenuFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [icon, setIcon] = useState("Package");
    const [order, setOrder] = useState(99);
    const [selectedActions, setSelectedActions] = useState(["view"]);
    const [isActive, setIsActive] = useState(true);
    const [isSystem, setIsSystem] = useState(false);

    const [iconSearch, setIconSearch] = useState("");
    const [showIconPicker, setShowIconPicker] = useState(false);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [errors, setErrors] = useState({});

    // Auto-slug from name on create
    useEffect(() => {
        if (!isEdit) setSlug(toSlug(name));
    }, [name, isEdit]);

    // ── Load existing menu ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/menus/${id}`);
                const m = data.data || data;
                setName(m.name || "");
                setSlug(m.slug || "");
                setIcon(m.icon || "Package");
                setOrder(m.order ?? 99);
                setSelectedActions(m.availableActions || ["view"]);
                setIsActive(m.isActive !== false);
                setIsSystem(SYSTEM_SLUGS.includes(m.slug));
            } catch {
                toast.error("Failed to load menu");
                navigate("/menus");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit, navigate]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const toggleAction = (key) => {
        setSelectedActions((prev) =>
            prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
        );
        setIsDirty(true);
    };

    const markDirty = () => setIsDirty(true);

    // ── Validate ──────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = "Menu name is required";
        if (!slug.trim()) errs.slug = "Slug is required";
        if (selectedActions.length === 0) errs.actions = "At least one action must be selected";
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
            const payload = {
                name,
                slug,
                icon,
                order: Number(order),
                availableActions: selectedActions,
                isActive,
            };

            if (isEdit) {
                await api.put(`/menus/${id}`, payload);
                toast.success("Menu updated successfully!");
            } else {
                await api.post("/menus", payload);
                toast.success("Menu created successfully!");
            }

            setIsDirty(false);
            navigate("/menus");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save menu");
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbs = [
        { label: "Menus", path: "/menus" },
        { label: isEdit ? "Edit Menu" : "New Menu" },
    ];

    const filteredIcons = ICON_OPTIONS.filter((i) =>
        i.toLowerCase().includes(iconSearch.toLowerCase())
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
            title={isEdit ? `Edit: ${name || "Menu"}` : "New Menu"}
            subtitle={isEdit ? "Update menu details and available actions" : "Add a new menu and configure its available actions"}
            breadcrumbs={breadcrumbs}
            sections={SECTIONS}
            onSave={handleSave}
            onCancel={() => navigate("/menus")}
            saving={saving}
            saveLabel={isEdit ? "Update Menu" : "Create Menu"}
            isDirty={isDirty}
        >

            {/* ── Section 1: Basic Info ────────────────────────────────────── */}
            <FormSection
                id="basic"
                title="Basic Information"
                subtitle="Name, slug, icon and display order for this menu item"
            >
                <FormRow cols={2}>
                    <FormField label="Menu Name" required error={errors.name}>
                        <div style={{ position: "relative" }}>
                            <MenuIcon size={15} style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }} />
                            <input
                                className={`form-input ${errors.name ? "input-error" : ""}`}
                                value={name}
                                onChange={(e) => { setName(e.target.value); markDirty(); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
                                placeholder="e.g. Asset Master"
                                style={{ paddingLeft: 36, borderColor: errors.name ? "var(--danger)" : undefined }}
                            />
                        </div>
                    </FormField>

                    <FormField label="Slug" required error={errors.slug} hint={isSystem ? "System slug — cannot be changed" : "Auto-generated from name, or edit manually"}>
                        <div style={{ position: "relative" }}>
                            <Hash size={15} style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }} />
                            <input
                                className={`form-input ${errors.slug ? "input-error" : ""}`}
                                value={slug}
                                onChange={(e) => { setSlug(e.target.value); markDirty(); if (errors.slug) setErrors((p) => ({ ...p, slug: "" })); }}
                                placeholder="e.g. asset_master"
                                disabled={isSystem}
                                style={{
                                    paddingLeft: 36,
                                    borderColor: errors.slug ? "var(--danger)" : undefined,
                                    opacity: isSystem ? 0.6 : 1,
                                    cursor: isSystem ? "not-allowed" : "text",
                                }}
                            />
                        </div>
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    {/* Icon picker */}
                    <FormField label="Icon" hint="Select an icon to display in the sidebar">
                        <div style={{ position: "relative" }}>
                            <button
                                type="button"
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="btn btn-secondary"
                                style={{ width: "100%", justifyContent: "flex-start", gap: 10, fontWeight: 400, fontSize: 14 }}
                            >
                                <DynamicIcon name={icon} size={16} color="var(--accent)" />
                                <span style={{ color: "var(--text-primary)" }}>{icon}</span>
                            </button>

                            {showIconPicker && (
                                <div style={{
                                    position: "absolute", top: "110%", left: 0, right: 0,
                                    background: "var(--bg-card)", border: "1px solid var(--border)",
                                    borderRadius: 10, zIndex: 10, padding: 12,
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                }}>
                                    <input
                                        className="form-input"
                                        value={iconSearch}
                                        onChange={(e) => setIconSearch(e.target.value)}
                                        placeholder="Search icon..."
                                        style={{ marginBottom: 10, fontSize: 13 }}
                                    />
                                    <div style={{
                                        display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
                                        gap: 6, maxHeight: 180, overflowY: "auto",
                                    }}>
                                        {filteredIcons.map((ic) => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => { setIcon(ic); setShowIconPicker(false); markDirty(); }}
                                                title={ic}
                                                style={{
                                                    padding: 8, borderRadius: 6, cursor: "pointer",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: icon === ic ? "var(--accent-glow)" : "var(--bg-secondary)",
                                                    border: `1px solid ${icon === ic ? "var(--accent)" : "var(--border)"}`,
                                                }}
                                            >
                                                <DynamicIcon name={ic} size={16} color={icon === ic ? "var(--accent)" : "var(--text-muted)"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormField>

                    <FormField label="Display Order" hint="Lower number = appears higher in sidebar">
                        <div style={{ position: "relative" }}>
                            <Layers size={15} style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }} />
                            <input
                                className="form-input"
                                type="number"
                                value={order}
                                onChange={(e) => { setOrder(e.target.value); markDirty(); }}
                                min={1}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                    </FormField>
                </FormRow>

                {/* Active toggle — edit only */}
                {isEdit && (
                    <FormField label="Menu Status">
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", background: "var(--bg-secondary)",
                            borderRadius: 10, border: "1px solid var(--border)",
                        }}>
                            <div>
                                <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, margin: 0 }}>
                                    {isActive ? "Active" : "Inactive"}
                                </p>
                                <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>
                                    Inactive menus won't appear in the sidebar
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setIsActive(!isActive); markDirty(); }}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                            >
                                {isActive
                                    ? <ToggleRight size={32} color="var(--success)" />
                                    : <ToggleLeft size={32} color="var(--text-muted)" />
                                }
                            </button>
                        </div>
                    </FormField>
                )}
            </FormSection>

            {/* ── Section 2: Actions ───────────────────────────────────────── */}
            <FormSection
                id="actions"
                title="Available Actions"
                subtitle="Selected actions will appear as toggleable permissions in Role and User permission modals"
            >
                <FormField label="Actions" required error={errors.actions}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                        {ALL_ACTIONS.map(({ key, label, color }) => {
                            const active = selectedActions.includes(key);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleAction(key)}
                                    style={{
                                        padding: "7px 16px", borderRadius: 8,
                                        cursor: "pointer", fontWeight: 600, fontSize: 13,
                                        border: "1px solid var(--border)",
                                        background: active ? "var(--bg-hover)" : "transparent",
                                        color: active ? color : "var(--text-muted)",
                                        transition: "all 0.15s",
                                        boxShadow: active ? `inset 0 0 0 1px ${color}55` : "none",
                                    }}
                                >
                                    {active && <span style={{ marginRight: 4, fontSize: 11 }}>✓</span>}
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
                        {selectedActions.length} action{selectedActions.length !== 1 ? "s" : ""} selected
                    </p>
                </FormField>
            </FormSection>

        </FormPageLayout>
    );
}