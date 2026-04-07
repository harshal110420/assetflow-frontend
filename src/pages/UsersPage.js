import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUsers } from "../store/slices/userSlice";
import { fetchRoles } from "../store/slices/permissionSlice";
import { fetchDepartments } from "../store/slices/departmentSlice";
import { Plus, Edit2, UserCheck, Key, Search, Filter } from "lucide-react";
import UserPermissionModal from "../components/permissions/UserPermissionModal";
import { usePermission } from "../hooks/usePermission";

const roleColor = {
  admin: "var(--danger)",
  manager: "var(--warning)",
  technician: "var(--info)",
  viewer: "var(--text-muted)",
};

export default function UsersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users, isLoading } = useSelector((s) => s.users);
  const { departments } = useSelector((s) => s.departments);

  const { can } = usePermission();
  const canCreate = can("users", "new");
  const canEdit = can("users", "edit");

  const [permissionUser, setPermissionUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
    dispatch(fetchDepartments());
  }, [dispatch]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getManagerName = (managerId) => {
    const manager = users.find((u) => u.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : "—";
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : "—";
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const uniqueRoles = [...new Set(users.map((u) => u.role).filter(Boolean))];

  const uniqueDepartments = [
    ...new Set(
      users
        .map((u) => departments.find((d) => d.id === u.departmentId)?.name)
        .filter(Boolean),
    ),
  ];

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.department?.name?.toLowerCase().includes(q);

    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.isActive !== false) ||
      (filterStatus === "inactive" && u.isActive === false);
    const matchDept =
      filterDepartment === "all" ||
      getDepartmentName(u.departmentId) === filterDepartment;

    return matchSearch && matchRole && matchStatus && matchDept;
  });

  // ── Render ────────────────────────────────────────────────────────────────
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
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
            {users.length} user{users.length !== 1 ? "s" : ""} · System users
            only (admins, managers, technicians)
          </p>
        </div>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => navigate("/users/new")}
          >
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="form-input"
            placeholder="Search by name, email, phone, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={13} style={{ color: "var(--text-muted)" }} />
          <select
            className="form-input"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ fontSize: 13, padding: "6px 10px", minWidth: 130 }}
          >
            <option value="all">All Roles</option>
            {uniqueRoles.map((r) => (
              <option key={r} value={r} style={{ textTransform: "capitalize" }}>
                {r}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ fontSize: 13, padding: "6px 10px", minWidth: 120 }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="form-input"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{ fontSize: 13, padding: "6px 10px", minWidth: 150 }}
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: "var(--surface-2, rgba(255,255,255,0.03))",
                  }}
                >
                  {[
                    "User",
                    "Role",
                    "Department",
                    "Reporting Manager",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                  <th style={{ padding: "11px 16px", width: 140 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      transition: "background 0.15s",
                      cursor: canEdit ? "pointer" : "default",
                    }}
                    // onClick={() => canEdit && navigate(`/users/${u.id}/edit`)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--surface-2, rgba(255,255,255,0.03))")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* User */}
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
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

                    {/* Role */}
                    <td style={{ padding: "12px 16px" }}>
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

                    {/* Department */}
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--text-secondary)",
                        fontSize: 13,
                      }}
                    >
                      {getDepartmentName(u.departmentId)}
                    </td>

                    {/* Reporting Manager */}
                    <td style={{ padding: "12px 16px" }}>
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

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        className={`badge ${u.isActive ? "badge-active" : "badge-inactive"}`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        {canEdit && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/users/${u.id}/edit`);
                            }}
                            title="Edit User"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        )}
                        {canEdit && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPermissionUser(u);
                            }}
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <UserCheck
                        size={36}
                        style={{
                          opacity: 0.3,
                          marginBottom: 10,
                          display: "block",
                          margin: "0 auto 10px",
                        }}
                      />
                      <p>
                        {search ||
                        filterRole !== "all" ||
                        filterStatus !== "all" ||
                        filterDepartment !== "all"
                          ? "No users match your search or filters."
                          : "No users found"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions modal stays inline — it's not a form page */}
      {permissionUser && (
        <UserPermissionModal
          userId={permissionUser.id}
          userName={`${permissionUser.firstName} ${permissionUser.lastName}`}
          onClose={() => setPermissionUser(null)}
        />
      )}
    </div>
  );
}
