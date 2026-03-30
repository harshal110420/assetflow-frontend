import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Shield, FileText } from "lucide-react";
import { fetchRoles } from "../store/slices/permissionSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import FormPageLayout, { FormSection, FormRow, FormField } from "../components/common/Formpagelayout";

// ── Sidebar sections ──────────────────────────────────────────────────────────
const SECTIONS = [
    { id: "details", label: "Details", icon: FileText },
    { id: "permissions", label: "Permissions", icon: Shield },
];

// ── Action config ─────────────────────────────────────────────────────────────
const ACTION_LABELS = {
    view: "View", new: "New", edit: "Edit", delete: "Delete",
    import: "Import", export: "Export", approve: "Approve", reject: "Reject",
};
const ACTION_COLORS = {
    view: "#00d4ff",
    new: "#00d68f",
    edit: "#ffb703",
    delete: "#ff4757",
    import: "#7c3aed",
    export: "#ff8c42",
    approve: "#00d68f",
    reject: "#ff4757",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RoleFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [menus, setMenus] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [isSystem, setIsSystem] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Load menus + existing role data ───────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data: menusData } = await api.get("/permissions/menus");
                const fetchedMenus = menusData.data || [];
                setMenus(fetchedMenus);

                if (isEdit) {
                    const { data: roleData } = await api.get(`/roles/${id}/permissions`);

                    const role = roleData.data.role;           // ✅ nested se nikaalo
                    const permsFromApi = roleData.data.permissions; // ✅ permissions array

                    setName(role.name || "");
                    setDescription(role.description || "");
                    setIsSystem(role.isSystem || false);

                    // Pehle sab false set karo
                    const permsMap = {};                       // ✅ pehle declare
                    fetchedMenus.forEach((m) => {
                        permsMap[m.id] = {
                            view: false, new: false, edit: false, delete: false,
                            import: false, export: false, approve: false, reject: false,
                        };
                    });

                    // Phir API data se override karo
                    permsFromApi.forEach((p) => {
                        permsMap[p.menuId] = { ...permsMap[p.menuId], ...p.actions };
                    });

                    setPermissions(permsMap);
                } else {
                    // Default all false for new role
                    const permsMap = {};
                    fetchedMenus.forEach((m) => {
                        permsMap[m.id] = {
                            view: false, new: false, edit: false, delete: false,
                            import: false, export: false, approve: false, reject: false,
                        };
                    });
                    setPermissions(permsMap);
                }
            } catch {
                toast.error("Failed to load role data");
                navigate("/roles");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit, navigate]);

    // ── Toggle a single action ────────────────────────────────────────────────
    const toggleAction = (menuId, action, value) => {
        setPermissions((prev) => {
            const updated = { ...prev, [menuId]: { ...prev[menuId], [action]: value } };
            // Turning off "view" clears all
            if (action === "view" && !value) {
                Object.keys(updated[menuId]).forEach((a) => { updated[menuId][a] = false; });
            }
            // Any other action ON auto-enables view
            if (action !== "view" && value) {
                updated[menuId].view = true;
            }
            return updated;
        });
        setIsDirty(true);
    };

    // ── Validate ──────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = "Role name is required";
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
            const permissionsArray = menus
                .map((m) => ({ menuId: m.id, actions: permissions[m.id] || {} }))
                .filter((p) => Object.values(p.actions).some((v) => v === true));

            if (isEdit) {
                await api.put(`/roles/${id}`, { name, description, permissions: permissionsArray });
                toast.success("Role updated successfully!");
            } else {
                await api.post("/roles", { name, description, permissions: permissionsArray });
                toast.success("Role created successfully!");
            }

            dispatch(fetchRoles());
            setIsDirty(false);
            navigate("/roles");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save role");
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbs = [
        { label: "Roles", path: "/roles" },
        { label: isEdit ? "Edit Role" : "New Role" },
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
            title={isEdit ? `Edit: ${name || "Role"}` : "New Role"}
            subtitle={isEdit ? "Update role name and module permissions" : "Create a new role and configure its permissions"}
            breadcrumbs={breadcrumbs}
            sections={SECTIONS}
            onSave={handleSave}
            onCancel={() => navigate("/roles")}
            saving={saving}
            saveLabel={isEdit ? "Update Role" : "Create Role"}
            isDirty={isDirty}
        >

            {/* ── Section 1: Details ───────────────────────────────────────── */}
            <FormSection
                id="details"
                title="Role Details"
                subtitle="Basic information about this role"
            >
                <FormRow cols={2}>
                    <FormField label="Role Name" required error={errors.name}>
                        <div style={{ position: "relative" }}>
                            <Shield size={15} style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }} />
                            <input
                                className={`form-input ${errors.name ? "input-error" : ""}`}
                                value={name}
                                onChange={(e) => { setName(e.target.value); setIsDirty(true); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
                                placeholder="e.g. Inventory Manager"
                                disabled={isSystem}
                                style={{
                                    paddingLeft: 36,
                                    borderColor: errors.name ? "var(--danger)" : undefined,
                                    opacity: isSystem ? 0.6 : 1,
                                }}
                            />
                        </div>
                        {isSystem && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                                System role — name cannot be changed
                            </p>
                        )}
                    </FormField>

                    <FormField label="Description" hint="Brief description of what this role can do">
                        <div style={{ position: "relative" }}>
                            <FileText size={15} style={{
                                position: "absolute", left: 12, top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-muted)", pointerEvents: "none",
                            }} />
                            <input
                                className="form-input"
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                                placeholder="e.g. Manages inventory and stock"
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                    </FormField>
                </FormRow>
            </FormSection>

            {/* ── Section 2: Permissions ───────────────────────────────────── */}
            <FormSection
                id="permissions"
                title="Module Permissions"
                subtitle="Toggle which actions this role can perform in each module"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {menus.map((menu) => {
                        const menuPerms = permissions[menu.id] || {};
                        const hasAccess = Object.values(menuPerms).some((v) => v === true);

                        return (
                            <div
                                key={menu.id}
                                style={{
                                    background: hasAccess ? "var(--bg-card)" : "var(--bg-hover)",
                                    border: `1px solid ${hasAccess ? "var(--border)" : "transparent"}`,
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    transition: "all 0.15s",
                                }}
                            >
                                <div style={{
                                    padding: "10px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 8,
                                }}>
                                    <span style={{
                                        fontSize: 14, fontWeight: 600,
                                        color: hasAccess ? "var(--text-primary)" : "var(--text-muted)",
                                        minWidth: 130,
                                    }}>
                                        {menu.name}
                                    </span>

                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                        {(menu.availableActions || []).map((action) => {
                                            const isOn = menuPerms[action] === true;
                                            const color = ACTION_COLORS[action] || "#64748b";
                                            return (
                                                <button
                                                    key={action}
                                                    type="button"
                                                    onClick={() => toggleAction(menu.id, action, !isOn)}
                                                    style={{
                                                        padding: "3px 10px",
                                                        borderRadius: 20,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        transition: "all 0.15s",
                                                        background: isOn ? `${color}20` : "var(--bg-hover)",
                                                        color: isOn ? color : "var(--text-muted)",
                                                        border: `1px solid ${isOn ? `${color}50` : "var(--border)"}`,
                                                    }}
                                                >
                                                    {ACTION_LABELS[action] || action}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {menus.length === 0 && (
                        <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "16px 0" }}>
                            No menus available. Add menus first.
                        </p>
                    )}
                </div>
            </FormSection>

        </FormPageLayout>
    );
}