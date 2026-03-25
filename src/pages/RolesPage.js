import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles } from "../store/slices/permissionSlice";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  X,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { usePermission } from "../hooks/usePermission";

const ACTION_LABELS = {
  view: "View",
  new: "New",
  edit: "Edit",
  delete: "Delete",
  import: "Import",
  export: "Export",
  approve: "Approve",
  reject: "Reject",
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

// ── Role Modal (Create / Edit) ─────────────────────────────────────────────────
function RoleModal({ role, onClose }) {
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [menus, setMenus] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Sare menus fetch karo
        const { data: menusData } = await api.get("/permissions/menus");
        setMenus(menusData.data || []);

        // Agar edit mode hai to existing permissions fetch karo
        if (role?.id) {
          const { data: roleData } = await api.get(
            `/roles/${role.id}/permissions`,
          );
          const permsMap = {};
          roleData.data.permissions.forEach((p) => {
            permsMap[p.menuId] = { ...p.actions };
          });
          setPermissions(permsMap);
        } else {
          // New role — sab false
          const permsMap = {};
          menusData.data.forEach((m) => {
            permsMap[m.id] = {
              view: false,
              new: false,
              edit: false,
              delete: false,
              import: false,
              export: false,
              approve: false,
              reject: false,
            };
          });
          setPermissions(permsMap);
        }
      } catch (err) {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  const toggleAction = (menuId, action, value) => {
    setPermissions((prev) => {
      const updated = {
        ...prev,
        [menuId]: { ...prev[menuId], [action]: value },
      };
      // View off → sab off
      if (action === "view" && !value) {
        Object.keys(updated[menuId]).forEach((a) => {
          updated[menuId][a] = false;
        });
      }
      // Koi action on → view on
      if (action !== "view" && value) {
        updated[menuId].view = true;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Role name required");
    setSaving(true);
    try {
      const permissionsArray = menus
        .map((m) => ({ menuId: m.id, actions: permissions[m.id] || {} }))
        .filter((p) => Object.values(p.actions).some((v) => v === true));

      if (role?.id) {
        await api.put(`/roles/${role.id}`, {
          name,
          description,
          permissions: permissionsArray,
        });
      } else {
        await api.post("/roles", {
          name,
          description,
          permissions: permissionsArray,
        });
      }
      toast.success(`Role ${role?.id ? "updated" : "created"} successfully!`);
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div
        className="modal"
        style={{
          maxWidth: 700,
          width: "95vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={20} color="var(--accent)" />
            <h2 className="modal-title">
              {role?.id ? "Edit Role" : "New Role"}
            </h2>
          </div>
          <button
            onClick={() => onClose(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Name + Description */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div className="form-group">
              <label className="form-label">Role Name *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inventory Manager"
                disabled={role?.isSystem}
              />
              {role?.isSystem && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  System role — name cannot be changed
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role"
              />
            </div>
          </div>

          {/* Permissions Matrix */}
          <div>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}
            >
              Module Permissions
            </h3>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 30,
                }}
              >
                <div className="spinner" style={{ width: 28, height: 28 }} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {menus.map((menu) => {
                  const menuPerms = permissions[menu.id] || {};
                  const hasAccess = Object.values(menuPerms).some(
                    (v) => v === true,
                  );
                  const isExpanded = expandedMenus[menu.id];
                  return (
                    <div
                      key={menu.id}
                      style={{
                        background: hasAccess
                          ? "var(--bg-card)"
                          : "var(--bg-hover)",
                        border: `1px solid ${hasAccess ? "var(--border)" : "transparent"}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: hasAccess
                              ? "var(--text-primary)"
                              : "var(--text-muted)",
                            minWidth: 130,
                          }}
                        >
                          {menu.name}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          {(menu.availableActions || []).map((action) => {
                            const isOn = menuPerms[action] === true;
                            const color = ACTION_COLORS[action] || "#64748b";
                            return (
                              <button
                                key={action}
                                onClick={() =>
                                  toggleAction(menu.id, action, !isOn)
                                }
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: 20,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  background: isOn
                                    ? `${color}20`
                                    : "var(--bg-hover)",
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
              </div>
            )}
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
            flexShrink: 0,
          }}
        >
          <button className="btn btn-secondary" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save size={14} style={{ marginRight: 4 }} />
                {role?.id ? "Update Role" : "Create Role"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Roles Page ────────────────────────────────────────────────────────────
export default function RolesPage() {
  const dispatch = useDispatch();
  const { roles } = useSelector((s) => s.permissions);
  const { user: me } = useSelector((s) => s.auth);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const { can } = usePermission();

  // Permission checks — DB se aata hai, role name se nahi
  const canCreate = can("roles", "new");
  const canEdit = can("roles", "edit");
  const canDelete = can("roles", "delete");

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  const handleDelete = async (role) => {
    if (role.isSystem) return toast.error("System roles cannot be deleted");
    if (
      !window.confirm(
        `Delete role "${role.name}"? Users with this role will lose their permissions.`,
      )
    )
      return;
    try {
      await api.delete(`/roles/${role.id}`);
      toast.success("Role deleted");
      dispatch(fetchRoles());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  if (me?.role !== "admin") {
    return (
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: "48px 20px",
          color: "var(--text-muted)",
        }}
      >
        <Shield size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p>Admin access required</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Role Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
            Define roles and their default permissions
          </p>
        </div>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditRole(null);
              setShowModal(true);
            }}
          >
            <Plus size={18} /> New Role
          </button>
        )}
      </div>

      {/* Roles Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {roles.map((role) => (
          <div key={role.id} className="card" style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={18} color="#050b14" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {role.name}
                  </div>
                  {role.isSystem && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        background: "rgba(0,212,255,0.1)",
                        color: "var(--accent)",
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      SYSTEM
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {canEdit && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditRole(role);
                      setShowModal(true);
                    }}
                    title="Edit permissions"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
                {!role.isSystem && canDelete && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(role)}
                    title="Delete role"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            {role.description && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginBottom: 0,
                }}
              >
                {role.description}
              </p>
            )}
          </div>
        ))}

        {roles.length === 0 && (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--text-muted)",
              gridColumn: "1/-1",
            }}
          >
            <Shield size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No roles yet. Create your first role!</p>
          </div>
        )}
      </div>

      {showModal && (
        <RoleModal
          role={editRole}
          onClose={(saved) => {
            setShowModal(false);
            setEditRole(null);
            if (saved) dispatch(fetchRoles());
          }}
        />
      )}
    </div>
  );
}
