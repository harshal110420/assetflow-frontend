import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchDashboardStats } from "../store/slices/assetSlice";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Package,
  CheckCircle,
  Wrench,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  Shield,
  Clock,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const daysLeft = (date) => {
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

const KPICard = ({ icon: Icon, label, value, subtext, color }) => (
  <div className="card" style={{ position: "relative", overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        transform: "translate(30px, -30px)",
      }}
    />
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
        {subtext && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
            {subtext}
          </p>
        )}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${color}35`,
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>
    </div>
  </div>
);

// ── Section Header ────────────────────────────────────────────────────────────

const SectionTitle = ({ title }) => (
  <h3
    style={{
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-primary)",
      margin: 0,
    }}
  >
    {title}
  </h3>
);

// ── Colors ────────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#0891b2",
];

const PRIORITY_COLOR = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#2563eb",
  Low: "#16a34a",
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 13,
      }}
    >
      <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboardStats, isLoading } = useSelector((s) => s.assets);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (isLoading || !dashboardStats) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 120, borderRadius: 16 }}
          />
        ))}
      </div>
    );
  }

  const {
    total = 0,
    active = 0,
    maintenance = 0,
    disposed = 0,
    inactive = 0,
    totalValue = 0,
    warrantyExpiring = 0,
    categoryStats = [],
    statusStats = [],
    assignmentTypeStats = [],
    recentAssets = [],
    pendingApprovals = 0,
    warrantyExpiringAssets = [],
    maintenanceDueSoon = [],
    monthlyTrend = [],
  } = dashboardStats;

  // Category chart data
  const categoryChartData = categoryStats.map((c) => ({
    name: c["category.name"] || c.category || "Unknown",
    value: parseInt(c.count),
  }));

  // Assignment type chart data
  const assignmentChartData = assignmentTypeStats.map((a) => ({
    name:
      a.assignmentType === "pool"
        ? "Unassigned"
        : a.assignmentType?.charAt(0).toUpperCase() +
          a.assignmentType?.slice(1),
    value: parseInt(a.count),
  }));

  // Monthly trend
  const trendData = monthlyTrend.map((m) => ({
    month: m.month,
    Assets: parseInt(m.count),
  }));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* ── Row 1 — Primary KPIs ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        <KPICard
          icon={Package}
          label="Total Assets"
          value={total.toLocaleString("en-IN")}
          subtext="All tracked assets"
          color="#2563eb"
        />
        <KPICard
          icon={CheckCircle}
          label="Active Assets"
          value={active.toLocaleString("en-IN")}
          subtext={`${total ? Math.round((active / total) * 100) : 0}% of total`}
          color="#16a34a"
        />
        <KPICard
          icon={Wrench}
          label="In Maintenance"
          value={maintenance.toLocaleString("en-IN")}
          subtext="Pending service"
          color="#f59e0b"
        />
        <KPICard
          icon={AlertTriangle}
          label="Warranty Expiring"
          value={warrantyExpiring.toLocaleString("en-IN")}
          subtext="Within 30 days"
          color="#ef4444"
        />
        <KPICard
          icon={TrendingUp}
          label="Total Value"
          value={fmt(totalValue)}
          subtext="Current asset value"
          color="#7c3aed"
        />
        <KPICard
          icon={CheckSquare}
          label="Pending Approvals"
          value={pendingApprovals.toLocaleString("en-IN")}
          subtext="Awaiting your action"
          color="#ef4444"
        />
      </div>

      {/* ── Row 2 — Charts ── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}
      >
        {/* Category Pie */}
        <div className="card">
          <SectionTitle title="Assets by Category" />
          {categoryChartData.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 16,
              }}
            >
              No data
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 16,
              }}
            >
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx={60}
                    cy={60}
                    innerRadius={38}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {categoryChartData.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: PIE_COLORS[i % PIE_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{ fontSize: 12, color: "var(--text-secondary)" }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assignment Distribution Bar */}
        <div className="card">
          <SectionTitle title="Assignment Distribution" />
          {assignmentChartData.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 16,
              }}
            >
              No data
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={150}
              style={{ marginTop: 16 }}
            >
              <BarChart data={assignmentChartData} barSize={28}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Assets" radius={[4, 4, 0, 0]}>
                  {assignmentChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Trend Area */}
        <div className="card">
          <SectionTitle title="Monthly Acquisitions" />
          {trendData.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 16,
              }}
            >
              No data
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={150}
              style={{ marginTop: 16 }}
            >
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Assets"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#trendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 3 — Alert Lists ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Warranty Expiring Soon */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <SectionTitle title="Warranty Expiring Soon" />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/assets?filter=warranty")}
            >
              View All
            </button>
          </div>
          {warrantyExpiringAssets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <Shield size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No warranties expiring soon</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {warrantyExpiringAssets.map((asset) => {
                const days = daysLeft(asset.warrantyExpiry);
                const color =
                  days <= 7 ? "#ef4444" : days <= 15 ? "#f59e0b" : "#2563eb";
                return (
                  <div
                    key={asset.id}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {asset.name}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {asset.assetTag}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color,
                          background: `${color}15`,
                          padding: "3px 10px",
                          borderRadius: 20,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {days}d left
                      </span>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 4,
                        }}
                      >
                        {new Date(asset.warrantyExpiry).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short" },
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Maintenance Due Soon */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <SectionTitle title="Maintenance Due Soon" />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/maintenance")}
            >
              View All
            </button>
          </div>
          {maintenanceDueSoon.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <Clock size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No maintenance due this week</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {maintenanceDueSoon.map((m) => {
                const days = daysLeft(m.scheduledDate);
                const pColor = PRIORITY_COLOR[m.priority] || "#2563eb";
                return (
                  <div
                    key={m.id}
                    onClick={() => navigate("/maintenance")}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {m.title}
                      </p>
                      <span
                        style={{
                          fontSize: 11,
                          color: pColor,
                          background: `${pColor}15`,
                          padding: "2px 8px",
                          borderRadius: 20,
                          border: `1px solid ${pColor}30`,
                          marginTop: 4,
                          display: "inline-block",
                        }}
                      >
                        {m.priority}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            days <= 2 ? "#ef4444" : "var(--text-secondary)",
                        }}
                      >
                        {days === 0
                          ? "Today"
                          : days === 1
                            ? "Tomorrow"
                            : `${days}d`}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {new Date(m.scheduledDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4 — Recent Assets Table ── */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <SectionTitle title="Recently Added Assets" />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/assets")}
          >
            View All
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Name</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {recentAssets.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: 32,
                  }}
                >
                  No assets yet.
                </td>
              </tr>
            ) : (
              recentAssets.map((asset) => {
                const assignedTo = asset.assignedToEmployee
                  ? `${asset.assignedToEmployee.firstName} ${asset.assignedToEmployee.lastName}`
                  : asset.assignedToDept?.name
                    ? `Dept: ${asset.assignedToDept.name}`
                    : asset.assignedToLoc?.name
                      ? `Loc: ${asset.assignedToLoc.name}`
                      : "—";
                return (
                  <tr
                    key={asset.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/assets/${asset.id}`)}
                  >
                    <td>
                      <span
                        className="font-mono"
                        style={{ fontSize: 12, color: "var(--accent)" }}
                      >
                        {asset.assetTag}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{asset.name}</td>
                    <td>
                      <span
                        className={`badge badge-${asset.status?.toLowerCase().replace(/ /g, "-")}`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td
                      style={{ color: "var(--text-secondary)", fontSize: 13 }}
                    >
                      {assignedTo}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {fmt(parseFloat(asset.currentValue || 0))}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
