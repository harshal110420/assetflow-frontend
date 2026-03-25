import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, Bell, Sun, Moon } from "lucide-react";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { connectSocket, disconnectSocket } from "../../services/socket";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/assets": "Asset Management",
  "/maintenance": "Maintenance",
  "/approvals": "Approval Inbox",
  "/approval-templates": "Approval Configuration",
  "/users": "User Management",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const title = PAGE_TITLES[location.pathname] || "AssetFlow";

  // Fetch pending approvals count — YE ALREADY HAI
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { data } = await api.get("/approvals/pending");
        setPendingCount(data.count || 0);
      } catch {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ YE NAYA ADD KARO — bilkul uske baad
  useEffect(() => {
    if (!user?.tenantId) return;

    const socket = connectSocket(user.tenantId);

    socket.on("approval:new", () => {
      // Existing API se fresh count lo
      api
        .get("/approvals/pending")
        .then(({ data }) => setPendingCount(data.count || 0))
        .catch(() => {});
    });

    return () => {
      socket.off("approval:new");
      disconnectSocket();
    };
  }, [user?.tenantId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/assets?search=${encodeURIComponent(search)}`);
  };

  return (
    <header className="app-header">
      <div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          style={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-muted)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent)";
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.background = "var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--bg-card)";
          }}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell with pending approvals count */}
        <button
          onClick={() => navigate("/approvals")}
          style={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            background:
              pendingCount > 0 ? "rgba(0,212,255,0.1)" : "var(--bg-card)",
            border: `1px solid ${pendingCount > 0 ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: pendingCount > 0 ? "var(--accent)" : "var(--text-muted)",
            position: "relative",
          }}
          title={
            pendingCount > 0
              ? `${pendingCount} pending approvals`
              : "No pending approvals"
          }
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--danger)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--bg-primary)",
              }}
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                fontSize: 13,
                fontWeight: 700,
                color: "#050b14",
              }}
            >
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            {true && (
              <div style={{ display: "none" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {user.firstName}
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
            )}
          </div>
        )}
      </div>
    </header>
  );
}
