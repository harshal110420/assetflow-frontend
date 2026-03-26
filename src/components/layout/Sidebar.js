import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { resetUserPermissions } from "../../store/slices/permissionSlice";
import { toggleSidebar } from "../../store/slices/uiSlice";
import { usePermission } from "../../hooks/usePermission";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Users,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckSquare,
  Shield,
  Menu as MenuIcon,
  UserCheck,
  GitBranch,
  Briefcase,
  Layers,
  DatabaseIcon,
  DatabaseZapIcon,
} from "lucide-react";

// ── Sidebar Sections ──────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    section: null, // No label — top level
    items: [
      {
        to: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        slug: "dashboard",
      },
    ],
  },
  {
    section: "Transactions",
    items: [
      { to: "/assets", icon: Package, label: "Assets", slug: "asset_master" },
      {
        to: "/maintenance",
        icon: Wrench,
        label: "Maintenance",
        slug: "maintenance",
      },
      {
        to: "/approvals",
        icon: CheckSquare,
        label: "Approvals",
        slug: "approvals",
      },
      {
        to: "/amc",
        icon: Wrench,
        label: "AMC service",
        slug: "amc",
      },
    ],
  },
  {
    section: "Masters",
    items: [
      {
        to: "/employees",
        icon: UserCheck,
        label: "Employees",
        slug: "employees",
      },
      {
        to: "/divisions",
        icon: GitBranch,
        label: "Divisions",
        slug: "divisions",
      },
      {
        to: "/departments",
        icon: Briefcase,
        label: "Departments",
        slug: "departments",
      },
      {
        to: "/category",
        icon: Layers,
        label: "Category",
        slug: "category",
      },
      { to: "/locations", icon: MapPin, label: "Locations", slug: "locations" },
    ],
  },
  {
    section: "Analytics",
    items: [
      { to: "/reports", icon: BarChart3, label: "Reports", slug: "reports" },
    ],
  },
  {
    section: "Admin",
    items: [
      {
        to: "/users",
        icon: Users,
        label: "Users",
        slug: "users",
        adminOnly: false,
      },
      {
        to: "/roles",
        icon: Shield,
        label: "Roles",
        slug: "roles",
        adminOnly: false,
      },
      {
        to: "/menus",
        icon: MenuIcon,
        label: "Menus",
        slug: "menus",
        adminOnly: true,
      },
      {
        to: "/approval-templates",
        icon: Shield,
        label: "Approval Config",
        slug: null,
        adminOnly: true,
      },
      {
        to: "/settings",
        icon: Settings,
        label: "Settings",
        slug: "settings",
        adminOnly: false,
      },
      {
        to: "/audit-logs",
        icon: DatabaseIcon,
        label: "Audit logs",
        slug: "audit_logs",
        adminOnly: false,
      },
      {
        to: "/bulk-import",
        icon: DatabaseZapIcon,
        label: "Bulk Import",
        slug: "bulk_import",
        adminOnly: false,
      },
    ],
  },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user } = useSelector((s) => s.auth);
  const { canView, isAdmin, permissionsLoaded } = usePermission();

  const handleLogout = () => {
    dispatch(resetUserPermissions());
    dispatch(logout());
    navigate("/login");
  };

  const isItemVisible = (item) => {
    if (item.adminOnly) return isAdmin;
    if (!item.slug) return true;
    return canView(item.slug);
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: sidebarOpen ? "var(--sidebar-width)" : "70px",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "15.5px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 68,
        }}
      >
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
            flexShrink: 0,
            boxShadow: "0 0 20px var(--accent-glow)",
          }}
        >
          <Zap size={20} color="#050b14" fill="#050b14" />
        </div>
        {sidebarOpen && (
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              AssetFlow
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Enterprise AMS
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Shimmer while loading */}
        {!permissionsLoaded && !isAdmin
          ? [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: 38,
                  borderRadius: 10,
                  background: "var(--bg-hover)",
                  margin: "2px 0",
                  animation: "pulse 1.5s ease infinite",
                }}
              />
            ))
          : NAV_SECTIONS.map((section, sIdx) => {
              const visibleItems = section.items.filter(isItemVisible);
              if (visibleItems.length === 0) return null;

              return (
                <div key={sIdx} style={{ marginBottom: 4 }}>
                  {/* Section Label */}
                  {section.section && sidebarOpen && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "10px 12px 4px",
                        userSelect: "none",
                      }}
                    >
                      {section.section}
                    </div>
                  )}

                  {/* Divider line when collapsed */}
                  {section.section && !sidebarOpen && sIdx > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: "var(--border)",
                        margin: "6px 8px",
                      }}
                    />
                  )}

                  {/* Nav Items */}
                  {visibleItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      title={!sidebarOpen ? label : undefined}
                      style={({ isActive }) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        borderRadius: 9,
                        color: isActive
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                        background: isActive
                          ? "var(--accent-glow)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(0,212,255,0.2)"
                          : "1px solid transparent",
                        textDecoration: "none",
                        transition: "all 0.15s",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        marginBottom: 1,
                      })}
                      onMouseEnter={(e) => {
                        const style = e.currentTarget.style;
                        if (style.background !== "var(--accent-glow)") {
                          style.background = "var(--bg-hover)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const style = e.currentTarget.style;
                        if (style.background !== "var(--accent-glow)") {
                          style.background = "transparent";
                        }
                      }}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      {sidebarOpen && (
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {label}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              );
            })}
      </nav>

      {/* ── User + Logout + Toggle ────────────────────────────────────────────── */}
      <div
        style={{ padding: "10px 8px", borderTop: "1px solid var(--border)" }}
      >
        {/* User Info */}
        {sidebarOpen && user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              marginBottom: 6,
              background: "var(--bg-hover)",
              borderRadius: 10,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
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
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.firstName} {user.lastName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "capitalize",
                }}
              >
                {user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={!sidebarOpen ? "Logout" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "9px 12px",
            borderRadius: 9,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 0.15s",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,71,87,0.1)";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {sidebarOpen && <span>Logout</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: 7,
            borderRadius: 9,
            marginTop: 4,
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: "var(--text-muted)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>
    </div>
  );
}
