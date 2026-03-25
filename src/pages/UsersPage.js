import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, createUser, updateUser } from "../store/slices/userSlice";
import { fetchRoles } from "../store/slices/permissionSlice";
import { fetchDepartments } from "../store/slices/departmentSlice"; // ✅ naya
import { Plus, Edit2, UserCheck, X, Key } from "lucide-react";
import UserPermissionModal from "../components/permissions/UserPermissionModal";
import toast from "react-hot-toast";

const roleColor = {
  admin: "var(--danger)",
  manager: "var(--warning)",
  technician: "var(--info)",
  viewer: "var(--text-muted)",
};

// ── User Modal ────────────────────────────────────────────────────────────────
function UserModal({ user, allUsers, roles, departments, onClose }) {
  // ✅ departments prop
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "viewer",
    roleId: user?.roleId || "",
    departmentId: user?.departmentId || "", // ✅ department string → departmentId
    phone: user?.phone || "",
    reportingManagerId: user?.reportingManagerId || "",
    isActive: user?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [assignedLocationIds, setAssignedLocationIds] = useState([]);

  useEffect(() => {
    api
      .get("/locations")
      .then((res) => setLocations(res.data.data || []))
      .catch(() => {});
    if (user?.id) {
      api
        .get(`/locations/user/${user.id}`)
        .then((res) => {
          const ids = (res.data.data || []).map((l) => l.locationId || l.id);
          setAssignedLocationIds(ids);
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const toggleLocation = (locId) => {
    setAssignedLocationIds((prev) =>
      prev.includes(locId)
        ? prev.filter((id) => id !== locId)
        : [...prev, locId],
    );
  };

  const set = (f) => (e) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleRoleChange = (e) => {
    const selected = (roles || []).find((r) => r.id === e.target.value);
    setForm((prev) => ({
      ...prev,
      roleId: selected?.id || "",
      role: selected?.slug || e.target.value,
    }));
  };

  const managerOptions = allUsers.filter(
    (u) => u.id !== user?.id && ["admin", "manager"].includes(u.role),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (user && !payload.password) delete payload.password;
      if (!payload.reportingManagerId) payload.reportingManagerId = null;
      if (!payload.departmentId) payload.departmentId = null; // ✅

      const action = user
        ? updateUser({ id: user.id, ...payload })
        : createUser(payload);

      const result = await dispatch(action);
      if (result.error) throw new Error(result.payload?.message || "Failed");

      const savedUserId =
        user?.id || result.payload?.id || result.payload?.data?.id;
      if (savedUserId) {
        await api.post(`/locations/user/${savedUserId}`, {
          locationIds: assignedLocationIds,
        });
      }
      toast.success(user ? "User updated!" : "User created!");
      onClose(true);
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">{user ? "Edit User" : "Add New User"}</h2>
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

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Name Row */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                className="form-input"
                value={form.firstName}
                onChange={set("firstName")}
                required
                placeholder="Rahul"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                className="form-input"
                value={form.lastName}
                onChange={set("lastName")}
                required
                placeholder="Sharma"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              placeholder="rahul@company.com"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">
              Password{" "}
              {user ? (
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  (leave blank to keep current)
                </span>
              ) : (
                "*"
              )}
            </label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={set("password")}
              required={!user}
              placeholder={
                user ? "Leave blank to keep unchanged" : "Min 6 characters"
              }
            />
          </div>

          {/* Role + Department */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                className="form-input"
                value={form.roleId || ""}
                onChange={handleRoleChange}
              >
                <option value="">-- Select Role --</option>
                {(roles || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Department string → Department dropdown */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-input"
                value={form.departmentId}
                onChange={set("departmentId")}
              >
                <option value="">-- Select Department --</option>
                {(departments || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.division?.name ? ` — ${d.division.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Reporting Manager */}
          <div className="form-group">
            <label className="form-label">
              Reporting Manager
              <span
                style={{
                  fontSize: 11,
                  color: "var(--accent)",
                  marginLeft: 8,
                  fontWeight: 400,
                }}
              >
                ⚡ Used in approval workflow
              </span>
            </label>
            <select
              className="form-input"
              value={form.reportingManagerId}
              onChange={set("reportingManagerId")}
            >
              <option value="">-- No Reporting Manager --</option>
              {managerOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.role})
                  {u.department?.name ? ` · ${u.department.name}` : ""}
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 4,
                display: "block",
              }}
            >
              When this user requests an action, approval goes to their
              reporting manager automatically.
            </span>
          </div>

          {/* Location Assignment */}
          <div className="form-group">
            <label className="form-label">
              Assigned Locations
              <span
                style={{
                  fontSize: 11,
                  color: "var(--accent)",
                  marginLeft: 8,
                  fontWeight: 400,
                }}
              >
                🏭 Controls which assets this user can see
              </span>
            </label>
            {locations.filter((l) => l.isActive).length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  padding: "8px 0",
                }}
              >
                No locations available. Add locations first.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                {locations
                  .filter((l) => l.isActive)
                  .map((loc) => {
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
                          background: active
                            ? "var(--accent-glow)"
                            : "transparent",
                          color: active ? "var(--accent)" : "var(--text-muted)",
                          transition: "all 0.15s",
                        }}
                      >
                        {active ? "✓ " : ""}
                        {loc.name}
                        {loc.code ? ` · ${loc.code}` : ""}
                      </button>
                    );
                  })}
              </div>
            )}
            <p
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}
            >
              {assignedLocationIds.length === 0
                ? "No locations assigned — Admin/Manager sees all, others see nothing"
                : `${assignedLocationIds.length} location(s) assigned`}
            </p>
          </div>

          {/* Status (edit only) */}
          {user && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: e.target.value === "true",
                  }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onClose(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />{" "}
                  Saving...
                </>
              ) : user ? (
                "Update User"
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const dispatch = useDispatch();
  const { users, isLoading } = useSelector((s) => s.users);
  const { user: me } = useSelector((s) => s.auth);
  const { roles } = useSelector((s) => s.permissions);
  const { departments } = useSelector((s) => s.departments); // ✅ naya
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [permissionUser, setPermissionUser] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
    dispatch(fetchDepartments()); // ✅ departments load karo
  }, [dispatch]);

  const handleEdit = (u) => {
    setEditUser(u);
    setShowModal(true);
  };
  const handleAdd = () => {
    setEditUser(null);
    setShowModal(true);
  };
  const handleClose = (refresh) => {
    setShowModal(false);
    setEditUser(null);
    if (refresh) dispatch(fetchUsers());
  };

  const getManagerName = (managerId) => {
    const manager = users.find((u) => u.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : "—";
  };

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
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>User Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {users.length} user{users.length !== 1 ? "s" : ""} · System users
            only (admins, managers, technicians)
          </p>
        </div>
        {me?.role === "admin" && (
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div
            style={{ padding: 40, display: "flex", justifyContent: "center" }}
          >
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <UserCheck size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No users found</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Reporting Manager</th>
                <th>Status</th>
                {me?.role === "admin" && (
                  <th style={{ paddingRight: 20 }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, var(--accent), var(--accent-2))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#050b14",
                          flexShrink: 0,
                        }}
                      >
                        {u.firstName?.[0]}
                        {u.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {u.firstName} {u.lastName}
                        </div>
                        <div
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        color: roleColor[u.role],
                        background: `${roleColor[u.role]}15`,
                        padding: "3px 10px",
                        borderRadius: 12,
                        border: `1px solid ${roleColor[u.role]}30`,
                      }}
                    >
                      {u.role}
                    </span>
                  </td>

                  {/* ✅ Department object se naam */}
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {u.department?.name || "—"}
                  </td>

                  <td>
                    {u.reportingManagerId ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--accent)",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {getManagerName(u.reportingManagerId)}
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Not set
                      </span>
                    )}
                  </td>

                  <td>
                    <span
                      className={`badge ${u.isActive ? "badge-active" : "badge-inactive"}`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {me?.role === "admin" && (
                    <td style={{ paddingRight: 20 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(u)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          title="Edit User"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPermissionUser(u)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "var(--accent)",
                            borderColor: "rgba(0,212,255,0.3)",
                          }}
                          title="Manage Permissions"
                        >
                          <Key size={13} /> Permissions
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {permissionUser && (
        <UserPermissionModal
          userId={permissionUser.id}
          userName={permissionUser.firstName + " " + permissionUser.lastName}
          onClose={() => setPermissionUser(null)}
        />
      )}

      {showModal && (
        <UserModal
          user={editUser}
          allUsers={users}
          roles={roles}
          departments={departments} // ✅ pass karo
          onClose={handleClose}
        />
      )}
    </div>
  );
}
