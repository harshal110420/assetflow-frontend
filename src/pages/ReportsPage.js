import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments } from "../store/slices/departmentSlice";
import { fetchCategories } from "../store/slices/categroySlice";
import {
  FileText,
  FileSpreadsheet,
  Filter,
  Package,
  Wrench,
  UserCheck,
  ShieldAlert,
  TrendingDown,
  Users,
  Search,
  Tag,
  MapPin,
  Settings,
  History,
  Building2,
} from "lucide-react";
import api from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import PageContainer from "../components/layout/PageContainer";

// ═════════════════════════════════════════════════════════════════════════════
// REPORT CONFIG
// ═════════════════════════════════════════════════════════════════════════════
const REPORTS = [
  {
    id: "assets",
    label: "Asset Report",
    icon: Package,
    color: "var(--accent)",
    desc: "Complete asset inventory",
    filters: ["dateRange", "categoryId", "status", "condition", "departmentId"],
  },
  {
    id: "maintenance",
    label: "Maintenance Report",
    icon: Wrench,
    color: "var(--warning)",
    desc: "Maintenance records & costs",
    filters: ["dateRange", "maintenanceStatus", "maintenanceType", "priority"],
  },
  {
    id: "assignments",
    label: "Assignment Report",
    icon: UserCheck,
    color: "var(--success)",
    desc: "Asset assignment history",
    filters: ["dateRange", "assignmentStatus"],
  },
  {
    id: "warranty",
    label: "Warranty Expiry",
    icon: ShieldAlert,
    color: "var(--danger)",
    desc: "Upcoming/expired warranties",
    filters: ["dateRange", "categoryId", "expiringDays"],
  },
  {
    id: "depreciation",
    label: "Depreciation Report",
    icon: TrendingDown,
    color: "#ff8c42",
    desc: "Asset values & depreciation",
    filters: ["dateRange", "categoryId", "status"],
  },
  // ✅ Updated employee-wise with new filters
  {
    id: "employee-wise",
    label: "Employee-wise Assets",
    icon: Users,
    color: "var(--info)",
    desc: "Current & past assets per employee",
    filters: ["dateRange", "divisionId", "departmentId", "showHistory"],
  },
  // ✅ New department-wise
  {
    id: "department-wise",
    label: "Department-wise Assets",
    icon: Building2,
    color: "#8b5cf6",
    desc: "Division → Dept → direct + employee assets",
    filters: [
      "dateRange",
      "divisionId",
      "departmentId",
      "categoryId",
      "status",
    ],
  },
  {
    id: "category-wise",
    label: "Category-wise Assets",
    icon: Tag,
    color: "#a855f7",
    desc: "Asset breakdown by category",
    filters: ["status"],
  },
  {
    id: "location-wise",
    label: "Location-wise Assets",
    icon: MapPin,
    color: "#06b6d4",
    desc: "Asset breakdown by location",
    filters: ["status", "categoryId"],
  },
  {
    id: "configuration",
    label: "Configuration Report",
    icon: Settings,
    color: "#22c55e",
    desc: "Software & config across assets",
    filters: ["categoryId", "assignmentType"],
  },
  {
    id: "assignment-history",
    label: "Assignment History",
    icon: History,
    color: "#f97316",
    desc: "Full assignment history with config snap",
    filters: ["dateRange", "departmentId"],
  },
];

const STATUSES = [
  "Active",
  "Inactive",
  "In Maintenance",
  "Disposed",
  "Lost",
  "Reserved",
];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Damaged"];
const MAINT_STATUS = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
  "Overdue",
];
const MAINT_TYPES = [
  "Preventive",
  "Corrective",
  "Predictive",
  "Emergency",
  "Inspection",
];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const ASSIGN_TYPES = ["employee", "department", "location", "pool"];

// ─── API endpoint map ─────────────────────────────────────────────────────────
const ENDPOINTS = {
  assets: "assets",
  maintenance: "maintenance",
  assignments: "assignments",
  warranty: "warranty",
  depreciation: "depreciation",
  "employee-wise": "employee-wise",
  "department-wise": "department-wise",
  "category-wise": "category-wise",
  "location-wise": "location-wise",
  configuration: "configuration",
  "assignment-history": "assignment-history",
};

// ═════════════════════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════════
const COLUMNS = {
  assets: [
    { key: "assetTag", label: "Asset Tag" },
    { key: "name", label: "Name" },
    {
      key: "category",
      label: "Category",
      render: (r) => r.category?.name || "—",
    },
    {
      key: "subCategory",
      label: "Sub-Category",
      render: (r) => r.subCategory?.name || "—",
    },
    { key: "status", label: "Status" },
    { key: "condition", label: "Condition" },
    {
      key: "department",
      label: "Department",
      render: (r) => r.department?.name || "—",
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (r) =>
        r.assignedToEmployee
          ? `${r.assignedToEmployee.firstName} ${r.assignedToEmployee.lastName}`
          : "—",
    },
    {
      key: "purchasePrice",
      label: "Purchase Price",
      render: (r) =>
        r.purchasePrice
          ? `₹${parseFloat(r.purchasePrice).toLocaleString()}`
          : "—",
    },
    {
      key: "currentValue",
      label: "Current Value",
      render: (r) =>
        r.currentValue
          ? `₹${parseFloat(r.currentValue).toLocaleString()}`
          : "—",
    },
    {
      key: "purchaseDate",
      label: "Purchase Date",
      render: (r) =>
        r.purchaseDate
          ? new Date(r.purchaseDate).toLocaleDateString("en-IN")
          : "—",
    },
    {
      key: "warrantyExpiry",
      label: "Warranty Expiry",
      render: (r) =>
        r.warrantyExpiry
          ? new Date(r.warrantyExpiry).toLocaleDateString("en-IN")
          : "—",
    },
  ],
  maintenance: [
    {
      key: "Asset",
      label: "Asset",
      render: (r) => (r.Asset ? `${r.Asset.assetTag} — ${r.Asset.name}` : "—"),
    },
    { key: "title", label: "Title" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    {
      key: "technician",
      label: "Technician",
      render: (r) =>
        r.technician
          ? `${r.technician.firstName} ${r.technician.lastName}`
          : "—",
    },
    {
      key: "cost",
      label: "Cost",
      render: (r) => `₹${parseFloat(r.cost || 0).toLocaleString()}`,
    },
    {
      key: "scheduledDate",
      label: "Scheduled",
      render: (r) =>
        r.scheduledDate
          ? new Date(r.scheduledDate).toLocaleDateString("en-IN")
          : "—",
    },
    {
      key: "completedDate",
      label: "Completed",
      render: (r) =>
        r.completedDate
          ? new Date(r.completedDate).toLocaleDateString("en-IN")
          : "—",
    },
  ],
  assignments: [
    {
      key: "Asset",
      label: "Asset",
      render: (r) => (r.Asset ? `${r.Asset.assetTag} — ${r.Asset.name}` : "—"),
    },
    {
      key: "category",
      label: "Category",
      render: (r) => r.Asset?.category?.name || "—",
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (r) =>
        r.assignedEmployee
          ? `${r.assignedEmployee.firstName} ${r.assignedEmployee.lastName}`
          : "—",
    },
    {
      key: "designation",
      label: "Designation",
      render: (r) => r.assignedEmployee?.designation || "—",
    },
    {
      key: "department",
      label: "Department",
      render: (r) => r.assignedEmployee?.department?.name || "—",
    },
    { key: "purpose", label: "Purpose" },
    {
      key: "isActive",
      label: "Status",
      render: (r) => (r.isActive ? "Active" : "Returned"),
    },
    {
      key: "assignedAt",
      label: "Assigned At",
      render: (r) =>
        r.assignedAt ? new Date(r.assignedAt).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "returnedAt",
      label: "Returned At",
      render: (r) =>
        r.returnedAt ? new Date(r.returnedAt).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "assignedBy",
      label: "Assigned By",
      render: (r) =>
        r.assignedBy
          ? `${r.assignedBy.firstName} ${r.assignedBy.lastName}`
          : "—",
    },
  ],
  warranty: [
    { key: "assetTag", label: "Asset Tag" },
    { key: "name", label: "Name" },
    {
      key: "category",
      label: "Category",
      render: (r) => r.category?.name || "—",
    },
    { key: "status", label: "Status" },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (r) =>
        r.assignedToEmployee
          ? `${r.assignedToEmployee.firstName} ${r.assignedToEmployee.lastName}`
          : "—",
    },
    {
      key: "warrantyExpiry",
      label: "Warranty Expiry",
      render: (r) => {
        if (!r.warrantyExpiry) return "—";
        const d = new Date(r.warrantyExpiry);
        const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
        const color =
          diff < 0
            ? "var(--danger)"
            : diff < 30
              ? "var(--warning)"
              : "var(--success)";
        return {
          value: d.toLocaleDateString("en-IN"),
          color,
          badge: diff < 0 ? "Expired" : `${diff}d left`,
        };
      },
    },
    { key: "vendor", label: "Vendor" },
    {
      key: "purchaseDate",
      label: "Purchase Date",
      render: (r) =>
        r.purchaseDate
          ? new Date(r.purchaseDate).toLocaleDateString("en-IN")
          : "—",
    },
  ],
  depreciation: [
    { key: "assetTag", label: "Asset Tag" },
    { key: "name", label: "Name" },
    {
      key: "category",
      label: "Category",
      render: (r) => r.category?.name || "—",
    },
    {
      key: "ageYears",
      label: "Age (Yrs)",
      render: (r) => (r.ageYears ? `${r.ageYears} yrs` : "—"),
    },
    {
      key: "purchasePrice",
      label: "Purchase Price",
      render: (r) =>
        r.purchasePrice
          ? `₹${parseFloat(r.purchasePrice).toLocaleString()}`
          : "—",
    },
    {
      key: "currentValue",
      label: "Current Value",
      render: (r) =>
        r.currentValue
          ? `₹${parseFloat(r.currentValue).toLocaleString()}`
          : "—",
    },
    {
      key: "depreciationAmt",
      label: "Depreciation",
      render: (r) =>
        r.depreciationAmt
          ? `₹${parseFloat(r.depreciationAmt).toLocaleString()}`
          : "—",
    },
    {
      key: "depreciationPct",
      label: "Dep %",
      render: (r) => (r.depreciationPct ? `${r.depreciationPct}%` : "—"),
    },
    { key: "status", label: "Status" },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (r) =>
        r.assignedToEmployee
          ? `${r.assignedToEmployee.firstName} ${r.assignedToEmployee.lastName}`
          : "—",
    },
  ],
  // ✅ Updated employee-wise columns
  "employee-wise": [
    { key: "employeeCode", label: "Emp Code" },
    {
      key: "name",
      label: "Employee",
      render: (r) => `${r.firstName} ${r.lastName}`,
    },
    { key: "designation", label: "Designation" },
    {
      key: "department",
      label: "Department",
      render: (r) => r.department?.name || "—",
    },
    {
      key: "division",
      label: "Division",
      render: (r) => r.division?.name || "—",
    },
    {
      key: "location",
      label: "Location",
      render: (r) => r.location?.name || "—",
    },
    { key: "currentAssetCount", label: "Current Assets" },
    { key: "pastAssetCount", label: "Past Assets" },
    {
      key: "currentValue",
      label: "Current Value",
      render: (r) => `₹${parseFloat(r.currentValue || 0).toLocaleString()}`,
    },
  ],
  // ✅ New department-wise columns (flattened)
  "department-wise": [
    { key: "division", label: "Division", render: (r) => r.division || "—" },
    { key: "name", label: "Department" },
    { key: "code", label: "Code" },
    {
      key: "location",
      label: "Location",
      render: (r) => r.location?.name || "—",
    },
    { key: "employeeCount", label: "Employees" },
    { key: "totalAssets", label: "Total Assets" },
    { key: "directAssets", label: "Direct (Dept)" },
    { key: "employeeAssets", label: "Via Employees" },
    {
      key: "totalValue",
      label: "Total Value",
      render: (r) => `₹${parseFloat(r.totalValue || 0).toLocaleString()}`,
    },
    {
      key: "byStatus",
      label: "By Status",
      render: (r) =>
        Object.entries(r.byStatus || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ") || "—",
    },
  ],
  "category-wise": [
    { key: "name", label: "Category" },
    { key: "totalAssets", label: "Total Assets" },
    {
      key: "totalValue",
      label: "Current Value",
      render: (r) => `₹${parseFloat(r.totalValue || 0).toLocaleString()}`,
    },
    {
      key: "totalPurchaseValue",
      label: "Purchase Value",
      render: (r) =>
        `₹${parseFloat(r.totalPurchaseValue || 0).toLocaleString()}`,
    },
    {
      key: "totalDepreciation",
      label: "Depreciation",
      render: (r) =>
        `₹${parseFloat(r.totalDepreciation || 0).toLocaleString()}`,
    },
    {
      key: "depreciationRate",
      label: "Dep Rate",
      render: (r) => (r.depreciationRate ? `${r.depreciationRate}%` : "—"),
    },
    {
      key: "byStatus",
      label: "By Status",
      render: (r) =>
        Object.entries(r.byStatus || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ") || "—",
    },
  ],
  "location-wise": [
    { key: "name", label: "Location" },
    { key: "code", label: "Code" },
    { key: "totalAssets", label: "Total Assets" },
    {
      key: "totalValue",
      label: "Total Value",
      render: (r) => `₹${parseFloat(r.totalValue || 0).toLocaleString()}`,
    },
    {
      key: "byStatus",
      label: "By Status",
      render: (r) =>
        Object.entries(r.byStatus || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ") || "—",
    },
    {
      key: "byCategory",
      label: "By Category",
      render: (r) =>
        Object.entries(r.byCategory || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ") || "—",
    },
  ],
  configuration: [
    { key: "assetTag", label: "Asset Tag" },
    { key: "name", label: "Asset Name" },
    {
      key: "category",
      label: "Category",
      render: (r) => r.category?.name || "—",
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (r) =>
        r.assignedToEmployee
          ? `${r.assignedToEmployee.firstName} ${r.assignedToEmployee.lastName}`
          : "—",
    },
    {
      key: "department",
      label: "Department",
      render: (r) => r.department?.name || "—",
    },
    {
      key: "configFields",
      label: "Configuration",
      render: (r) =>
        (r.configFields || []).map((f) => `${f.key}: ${f.value}`).join(" | ") ||
        "—",
    },
  ],
  "assignment-history": [
    {
      key: "assetTag",
      label: "Asset tag",
      render: (r) => (r.Asset ? r.Asset.assetTag : "—"),
    },
    {
      key: "Asset",
      label: "Asset",
      render: (r) => (r.Asset ? `${r.Asset.assetTag} — ${r.Asset.name}` : "—"),
    },
    {
      key: "category",
      label: "Category",
      render: (r) => r.Asset?.category?.name || "—",
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (r) =>
        r.assignedEmployee
          ? `${r.assignedEmployee.firstName} ${r.assignedEmployee.lastName}`
          : "—",
    },
    {
      key: "department",
      label: "Department",
      render: (r) => r.assignedEmployee?.department?.name || "—",
    },
    {
      key: "isActive",
      label: "Status",
      render: (r) => (r.isActive ? "Active" : "Returned"),
    },
    { key: "conditionAtAssignment", label: "Condition (Assigned)" },
    { key: "conditionAtReturn", label: "Condition (Return)" },
    {
      key: "assignedAt",
      label: "Assigned At",
      render: (r) =>
        r.assignedAt ? new Date(r.assignedAt).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "returnedAt",
      label: "Returned At",
      render: (r) =>
        r.returnedAt ? new Date(r.returnedAt).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "configFields",
      label: "Config Snapshot",
      render: (r) =>
        (r.configFields || []).map((f) => `${f.key}: ${f.value}`).join(" | ") ||
        "No config",
    },
  ],
};

// ─── Cell Renderer ────────────────────────────────────────────────────────────
function CellValue({ col, row }) {
  if (!col.render) return <span>{row[col.key] ?? "—"}</span>;
  const val = col.render(row);
  if (val && typeof val === "object" && val.value) {
    return (
      <span style={{ color: val.color, fontWeight: 600 }}>
        {val.value}
        <span
          style={{
            marginLeft: 6,
            fontSize: 10,
            padding: "1px 6px",
            borderRadius: 10,
            background: `${val.color}22`,
            border: `1px solid ${val.color}44`,
          }}
        >
          {val.badge}
        </span>
      </span>
    );
  }
  return <span>{val ?? "—"}</span>;
}

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCards({ summary, reportId }) {
  if (!summary) return null;
  const cards = [];

  if (reportId === "assets") {
    cards.push(
      { label: "Total Assets", value: summary.total, color: "var(--accent)" },
      {
        label: "Total Value",
        value: `₹${parseFloat(summary.totalValue || 0).toLocaleString()}`,
        color: "var(--success)",
      },
    );
    Object.entries(summary.byStatus || {}).forEach(([k, v]) =>
      cards.push({ label: k, value: v, color: "var(--text-secondary)" }),
    );
  } else if (reportId === "maintenance") {
    cards.push(
      { label: "Total Records", value: summary.total, color: "var(--accent)" },
      {
        label: "Total Cost",
        value: `₹${parseFloat(summary.totalCost || 0).toLocaleString()}`,
        color: "var(--warning)",
      },
    );
  } else if (reportId === "assignments") {
    cards.push(
      { label: "Total", value: summary.total, color: "var(--accent)" },
      { label: "Active", value: summary.active, color: "var(--success)" },
      {
        label: "Returned",
        value: summary.returned,
        color: "var(--text-muted)",
      },
      {
        label: "Active Value",
        value: `₹${parseFloat(summary.totalValue || 0).toLocaleString()}`,
        color: "var(--info)",
      },
    );
  } else if (reportId === "warranty") {
    cards.push(
      { label: "Total", value: summary.total, color: "var(--accent)" },
      { label: "Expired", value: summary.expired, color: "var(--danger)" },
      {
        label: "In 30 days",
        value: summary.expiring30,
        color: "var(--warning)",
      },
      { label: "In 90 days", value: summary.expiring90, color: "var(--info)" },
    );
  } else if (reportId === "depreciation") {
    cards.push(
      { label: "Total Assets", value: summary.total, color: "var(--accent)" },
      {
        label: "Purchase Value",
        value: `₹${parseFloat(summary.totalPurchaseValue || 0).toLocaleString()}`,
        color: "var(--info)",
      },
      {
        label: "Current Value",
        value: `₹${parseFloat(summary.totalCurrentValue || 0).toLocaleString()}`,
        color: "var(--success)",
      },
      {
        label: "Total Depreciation",
        value: `₹${parseFloat(summary.totalDepreciation || 0).toLocaleString()}`,
        color: "var(--danger)",
      },
    );
  } else if (reportId === "employee-wise") {
    // ✅ Updated
    cards.push(
      {
        label: "Employees",
        value: summary.totalEmployees,
        color: "var(--accent)",
      },
      {
        label: "Current Assets",
        value: summary.totalCurrentAssets,
        color: "var(--success)",
      },
      {
        label: "Total Assigned",
        value: summary.totalAssets,
        color: "var(--info)",
      },
      {
        label: "Current Value",
        value: `₹${parseFloat(summary.totalValue || 0).toLocaleString()}`,
        color: "var(--warning)",
      },
    );
  } else if (reportId === "department-wise") {
    // ✅ New
    cards.push(
      {
        label: "Divisions",
        value: summary.totalDivisions,
        color: "var(--accent)",
      },
      {
        label: "Departments",
        value: summary.totalDepartments,
        color: "var(--info)",
      },
      {
        label: "Total Assets",
        value: summary.totalAssets,
        color: "var(--success)",
      },
      {
        label: "Total Value",
        value: `₹${parseFloat(summary.totalValue || 0).toLocaleString()}`,
        color: "var(--warning)",
      },
    );
  } else if (reportId === "category-wise") {
    cards.push(
      {
        label: "Categories",
        value: summary.totalCategories,
        color: "var(--accent)",
      },
      {
        label: "Total Assets",
        value: summary.totalAssets,
        color: "var(--info)",
      },
      {
        label: "Total Value",
        value: `₹${parseFloat(summary.totalValue || 0).toLocaleString()}`,
        color: "var(--success)",
      },
    );
  } else if (reportId === "location-wise") {
    cards.push(
      {
        label: "Locations",
        value: summary.totalLocations,
        color: "var(--accent)",
      },
      {
        label: "Total Assets",
        value: summary.totalAssets,
        color: "var(--info)",
      },
      {
        label: "Total Value",
        value: `₹${parseFloat(summary.totalValue || 0).toLocaleString()}`,
        color: "var(--success)",
      },
    );
  } else if (reportId === "configuration") {
    cards.push(
      {
        label: "Assets with Config",
        value: summary.totalAssets,
        color: "var(--accent)",
      },
      {
        label: "Unique Config Keys",
        value: summary.uniqueConfigKeys,
        color: "var(--success)",
      },
    );
  } else if (reportId === "assignment-history") {
    cards.push(
      { label: "Total", value: summary.total, color: "var(--accent)" },
      { label: "Active", value: summary.active, color: "var(--success)" },
      {
        label: "Returned",
        value: summary.returned,
        color: "var(--text-muted)",
      },
      { label: "With Config", value: summary.withConfig, color: "var(--info)" },
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ padding: "14px 16px" }}>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              margin: 0,
            }}
          >
            {c.label}
          </p>
          <p
            style={{
              color: c.color,
              fontSize: 22,
              fontWeight: 700,
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Label style ─────────────────────────────────────────────────────────────
const labelStyle = {
  fontSize: 11,
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 4,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

// ─── Flatten dept-wise nested data for standard table ────────────────────────
function flattenDeptWise(data) {
  const rows = [];
  data.forEach((div) => {
    (div.departments || []).forEach((dept) => {
      rows.push({ ...dept, division: div.name, divisionCode: div.code });
    });
  });
  return rows;
}

// ═════════════════════════════════════════════════════════════════════════════
// EMPLOYEE-WISE EXPANDABLE TABLE with Asset-level Search (Option B)
// ═════════════════════════════════════════════════════════════════════════════

function EmployeeWiseTable({ data }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // ── Search + filter logic ─────────────────────────────────────────────────
  const q = search.trim().toLowerCase();

  const processed = React.useMemo(() => {
    if (!q) {
      return data.map((emp) => ({
        ...emp,
        _show: true,
        _autoExpand: false,
        _empMatch: false,
        _matchedCurrents: null, // null = show all
        _matchedPasts: null,
      }));
    }

    return data.map((emp) => {
      // Employee-level fields match
      const empMatch =
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
        (emp.employeeCode || "").toLowerCase().includes(q) ||
        (emp.designation || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.department?.name || "").toLowerCase().includes(q) ||
        (emp.division?.name || "").toLowerCase().includes(q) ||
        (emp.location?.name || "").toLowerCase().includes(q);

      // Asset-level match — current
      const matchedCurrents = (emp.currentAssets || []).filter(
        (a) =>
          (a.assetTag || "").toLowerCase().includes(q) ||
          (a.name || "").toLowerCase().includes(q) ||
          (a.category || "").toLowerCase().includes(q) ||
          (a.subCategory || "").toLowerCase().includes(q) ||
          (a.brand || "").toLowerCase().includes(q) ||
          (a.model || "").toLowerCase().includes(q) ||
          (a.serialNumber || "").toLowerCase().includes(q) ||
          (a.status || "").toLowerCase().includes(q) ||
          (a.condition || "").toLowerCase().includes(q),
      );

      // Asset-level match — past
      const matchedPasts = (emp.pastAssets || []).filter(
        (a) =>
          (a.assetTag || "").toLowerCase().includes(q) ||
          (a.name || "").toLowerCase().includes(q) ||
          (a.category || "").toLowerCase().includes(q) ||
          (a.status || "").toLowerCase().includes(q),
      );

      const hasAssetMatch =
        matchedCurrents.length > 0 || matchedPasts.length > 0;
      const show = empMatch || hasAssetMatch;

      return {
        ...emp,
        _show: show,
        _empMatch: empMatch,
        _autoExpand: hasAssetMatch, // auto-expand when asset matched
        _matchedCurrents: hasAssetMatch ? matchedCurrents : null,
        _matchedPasts: hasAssetMatch ? matchedPasts : null,
      };
    });
  }, [data, q]);

  const visibleData = processed.filter((e) => e._show);

  // ── Highlight helper ──────────────────────────────────────────────────────
  const hl = (text, query) => {
    if (!query || !text) return text ?? "—";
    const str = String(text);
    const idx = str.toLowerCase().indexOf(query);
    if (idx === -1) return str;
    return (
      <>
        {str.slice(0, idx)}
        <mark
          style={{
            background: "rgba(251,191,36,0.45)",
            color: "inherit",
            borderRadius: 2,
            padding: "0 1px",
          }}
        >
          {str.slice(idx, idx + query.length)}
        </mark>
        {str.slice(idx + query.length)}
      </>
    );
  };

  // ── Is row expanded? manual OR auto-expand from search ───────────────────
  const isOpen = (emp) => (q && emp._autoExpand) || !!expanded[emp.id];

  // ── Asset row renderer ────────────────────────────────────────────────────
  const renderAssetRow = (asset, ai, type, empId) => {
    const isCurrent = type === "current";

    // Is this specific asset matched by search?
    const matched =
      q &&
      (isCurrent
        ? (asset.assetTag || "").toLowerCase().includes(q) ||
          (asset.name || "").toLowerCase().includes(q) ||
          (asset.category || "").toLowerCase().includes(q) ||
          (asset.brand || "").toLowerCase().includes(q) ||
          (asset.serialNumber || "").toLowerCase().includes(q) ||
          (asset.status || "").toLowerCase().includes(q)
        : (asset.assetTag || "").toLowerCase().includes(q) ||
          (asset.name || "").toLowerCase().includes(q) ||
          (asset.category || "").toLowerCase().includes(q) ||
          (asset.status || "").toLowerCase().includes(q));

    const rowBg = matched
      ? isCurrent
        ? "rgba(0,214,143,0.10)"
        : "rgba(251,191,36,0.10)"
      : isCurrent
        ? "rgba(0,214,143,0.03)"
        : "rgba(255,140,66,0.03)";

    const borderLeft = matched
      ? `3px solid ${isCurrent ? "var(--success)" : "var(--warning)"}`
      : "3px solid transparent";

    return (
      <tr
        key={`${type}-${empId}-${ai}`}
        style={{ background: rowBg, borderLeft }}
      >
        <td colSpan={2} style={{ paddingLeft: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--border)", fontSize: 14 }}>└</span>
            <code
              style={{
                fontSize: 11,
                color: isCurrent ? "var(--accent)" : "var(--text-muted)",
                background: isCurrent
                  ? "var(--accent-glow)"
                  : "var(--bg-hover)",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {hl(asset.assetTag, q)}
            </code>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isCurrent
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              }}
            >
              {hl(asset.name, q)}
            </span>
            {isCurrent && asset.brand && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                ({hl(asset.brand, q)}
                {asset.model ? " " + asset.model : ""})
              </span>
            )}
          </div>
        </td>
        <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {isCurrent ? hl(asset.serialNumber, q) || "—" : "—"}
        </td>
        <td colSpan={2} style={{ fontSize: 11 }}>
          {asset.category && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                background: "var(--bg-hover)",
                padding: "1px 6px",
                borderRadius: 10,
              }}
            >
              {hl(asset.category, q)}
              {asset.subCategory ? ` › ${asset.subCategory}` : ""}
            </span>
          )}
        </td>
        <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {isCurrent
            ? asset.condition || "—"
            : asset.conditionAtReturn || asset.conditionAtAssignment || "—"}
        </td>
        <td style={{ fontSize: 11 }}>
          <span
            style={{
              padding: "1px 8px",
              borderRadius: 20,
              fontSize: 11,
              background: isCurrent ? "rgba(0,214,143,0.1)" : "var(--bg-hover)",
              color: isCurrent ? "var(--success)" : "var(--text-muted)",
            }}
          >
            {isCurrent ? "Active" : "Returned"}
          </span>
        </td>
        <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {asset.assignedAt
            ? new Date(asset.assignedAt).toLocaleDateString("en-IN")
            : "—"}
        </td>
        <td
          style={{
            fontSize: 11,
            color: isCurrent ? "var(--text-muted)" : "var(--warning)",
          }}
        >
          {isCurrent
            ? "—"
            : asset.returnedAt
              ? new Date(asset.returnedAt).toLocaleDateString("en-IN")
              : "—"}
        </td>
        <td
          style={{
            fontSize: 12,
            color: isCurrent ? "var(--success)" : "var(--text-muted)",
          }}
        >
          {isCurrent && asset.currentValue
            ? `₹${parseFloat(asset.currentValue).toLocaleString()}`
            : "—"}
        </td>
      </tr>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Search bar ── */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--bg-secondary)",
        }}
      >
        {/* Input */}
        <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="form-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpanded({}); // reset manual expand on new search
            }}
            placeholder="Search by employee, asset tag, name, category, brand, serial..."
            style={{ paddingLeft: 32, width: "100%", fontSize: 13 }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setExpanded({});
              }}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Result count */}
        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {q
            ? `${visibleData.length} of ${data.length} employees`
            : `${data.length} employees`}
        </span>

        {/* No match */}
        {q && visibleData.length === 0 && (
          <span style={{ fontSize: 12, color: "var(--danger)" }}>
            No results
          </span>
        )}

        {/* Expand / Collapse all — only when not searching */}
        {!q && data.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const all = {};
                data.forEach((e) => {
                  all[e.id] = true;
                });
                setExpanded(all);
              }}
              style={{ fontSize: 11 }}
            >
              Expand All
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setExpanded({})}
              style={{ fontSize: 11 }}
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32, paddingLeft: 16 }} />
              <th>Employee</th>
              <th>Code</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Division</th>
              <th>Location</th>
              <th>Current</th>
              <th>Past</th>
              <th>Current Value</th>
            </tr>
          </thead>
          <tbody>
            {/* No results */}
            {visibleData.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    textAlign: "center",
                    padding: "32px 20px",
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                >
                  No employees match "{search}"
                </td>
              </tr>
            )}

            {visibleData.map((emp) => {
              const open = isOpen(emp);
              const hasAnything =
                emp.currentAssets?.length > 0 || emp.pastAssets?.length > 0;

              // Assets to show in expanded section
              const currentsToShow =
                emp._matchedCurrents !== null
                  ? emp._matchedCurrents
                  : emp.currentAssets || [];
              const pastsToShow =
                emp._matchedPasts !== null
                  ? emp._matchedPasts
                  : emp.pastAssets || [];

              return (
                <React.Fragment key={emp.id}>
                  {/* ── Employee row ── */}
                  <tr
                    style={{
                      cursor: hasAnything ? "pointer" : "default",
                      background:
                        q && emp._empMatch
                          ? "rgba(251,191,36,0.06)"
                          : undefined,
                    }}
                    onClick={() => hasAnything && toggle(emp.id)}
                  >
                    <td style={{ paddingLeft: 16, textAlign: "center" }}>
                      {hasAnything && (
                        <span style={{ fontSize: 11, color: "var(--accent)" }}>
                          {open ? "▼" : "▶"}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {hl(`${emp.firstName} ${emp.lastName}`, q)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {hl(emp.email, q)}
                      </div>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: 11,
                          color: "var(--accent)",
                          background: "var(--accent-glow)",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {hl(emp.employeeCode, q) || "—"}
                      </code>
                    </td>
                    <td
                      style={{ fontSize: 13, color: "var(--text-secondary)" }}
                    >
                      {hl(emp.designation, q) || "—"}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {hl(emp.department?.name, q) || "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {hl(emp.division?.name, q) || "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {hl(emp.location?.name, q) || "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          background: "rgba(0,214,143,0.12)",
                          color: "var(--success)",
                          border: "1px solid rgba(0,214,143,0.3)",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {emp.currentAssetCount}
                      </span>
                    </td>
                    <td>
                      {emp.pastAssetCount > 0 ? (
                        <span
                          style={{
                            background: "rgba(255,140,66,0.12)",
                            color: "var(--warning)",
                            border: "1px solid rgba(255,140,66,0.3)",
                            padding: "2px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {emp.pastAssetCount}
                        </span>
                      ) : (
                        <span
                          style={{ color: "var(--text-muted)", fontSize: 13 }}
                        >
                          0
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--success)",
                      }}
                    >
                      ₹{parseFloat(emp.currentValue || 0).toLocaleString()}
                    </td>
                  </tr>

                  {/* ── Expanded asset rows ── */}
                  {open && (
                    <>
                      {/* Current assets section */}
                      {currentsToShow.length > 0 && (
                        <>
                          <tr style={{ background: "rgba(0,214,143,0.06)" }}>
                            <td
                              colSpan={10}
                              style={{
                                paddingLeft: 40,
                                paddingTop: 5,
                                paddingBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "var(--success)",
                                  background: "rgba(0,214,143,0.15)",
                                  padding: "2px 10px",
                                  borderRadius: 10,
                                  letterSpacing: 0.5,
                                }}
                              >
                                ▸ CURRENTLY ASSIGNED
                                {q &&
                                emp._matchedCurrents !== null &&
                                emp._matchedCurrents.length <
                                  (emp.currentAssets?.length || 0)
                                  ? ` — ${currentsToShow.length} of ${emp.currentAssets?.length} match`
                                  : ` (${currentsToShow.length})`}
                              </span>
                            </td>
                          </tr>
                          {currentsToShow.map((asset, ai) =>
                            renderAssetRow(asset, ai, "current", emp.id),
                          )}
                        </>
                      )}

                      {/* Past assets section */}
                      {pastsToShow.length > 0 && (
                        <>
                          <tr style={{ background: "rgba(255,140,66,0.06)" }}>
                            <td
                              colSpan={10}
                              style={{
                                paddingLeft: 40,
                                paddingTop: 5,
                                paddingBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "var(--warning)",
                                  background: "rgba(255,140,66,0.15)",
                                  padding: "2px 10px",
                                  borderRadius: 10,
                                  letterSpacing: 0.5,
                                }}
                              >
                                ▸ PREVIOUSLY ASSIGNED
                                {q &&
                                emp._matchedPasts !== null &&
                                emp._matchedPasts.length <
                                  (emp.pastAssets?.length || 0)
                                  ? ` — ${pastsToShow.length} of ${emp.pastAssets?.length} match`
                                  : ` (${pastsToShow.length})`}
                              </span>
                            </td>
                          </tr>
                          {pastsToShow.map((asset, ai) =>
                            renderAssetRow(asset, ai, "past", emp.id),
                          )}
                        </>
                      )}

                      {/* No assets */}
                      {currentsToShow.length === 0 &&
                        pastsToShow.length === 0 && (
                          <tr style={{ background: "var(--bg-secondary)" }}>
                            <td
                              colSpan={10}
                              style={{
                                paddingLeft: 48,
                                fontSize: 12,
                                color: "var(--text-muted)",
                                fontStyle: "italic",
                              }}
                            >
                              No assets found
                            </td>
                          </tr>
                        )}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// ═════════════════════════════════════════════════════════════════════════════
// DEPARTMENT-WISE EXPANDABLE TABLE
// ═════════════════════════════════════════════════════════════════════════════
function DepartmentWiseTable({ data }) {
  const [expandedDiv, setExpandedDiv] = useState({});
  const [expandedDept, setExpandedDept] = useState({});

  const toggleDiv = (id) => setExpandedDiv((p) => ({ ...p, [id]: !p[id] }));
  const toggleDept = (id) => setExpandedDept((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 32, paddingLeft: 16 }} />
            <th>Division / Department</th>
            <th>Code</th>
            <th>Location</th>
            <th>Employees</th>
            <th>Direct Assets</th>
            <th>Emp Assets</th>
            <th>Total</th>
            <th>Total Value</th>
            <th>By Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((div) => (
            <React.Fragment key={div.id}>
              {/* ── Division row ── */}
              <tr
                style={{ background: "var(--bg-secondary)", cursor: "pointer" }}
                onClick={() => toggleDiv(div.id)}
              >
                <td style={{ paddingLeft: 16, textAlign: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--accent)",
                      fontWeight: 700,
                    }}
                  >
                    {expandedDiv[div.id] ? "▼" : "▶"}
                  </span>
                </td>
                <td>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        background: "var(--accent-glow)",
                        color: "var(--accent)",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      DIVISION
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      {div.name}
                    </span>
                  </div>
                </td>
                <td>
                  <code
                    style={{
                      fontSize: 11,
                      color: "var(--accent)",
                      background: "var(--accent-glow)",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {div.code || "—"}
                  </code>
                </td>
                <td
                  style={{ color: "var(--text-muted)", fontSize: 12 }}
                  colSpan={2}
                >
                  {div.departmentCount} departments
                </td>
                <td colSpan={2} />
                <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                  {div.totalAssets}
                </td>
                <td style={{ fontWeight: 700, color: "var(--success)" }}>
                  ₹{parseFloat(div.totalValue || 0).toLocaleString()}
                </td>
                <td />
              </tr>

              {/* ── Department rows ── */}
              {expandedDiv[div.id] &&
                (div.departments || []).map((dept) => (
                  <React.Fragment key={dept.id}>
                    <tr
                      style={{
                        cursor: dept.totalAssets > 0 ? "pointer" : "default",
                      }}
                      onClick={() =>
                        dept.totalAssets > 0 && toggleDept(dept.id)
                      }
                    >
                      <td style={{ paddingLeft: 32, textAlign: "center" }}>
                        {dept.totalAssets > 0 && (
                          <span
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {expandedDept[dept.id] ? "▼" : "▶"}
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            paddingLeft: 8,
                          }}
                        >
                          <span
                            style={{ color: "var(--border)", fontSize: 14 }}
                          >
                            └
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {dept.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {dept.code || "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {dept.location?.name || "—"}
                      </td>
                      <td style={{ fontSize: 13 }}>{dept.employeeCount}</td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--info)" }}>
                          {dept.directAssets}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--success)" }}>
                          {dept.employeeAssets}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{dept.totalAssets}</td>
                      <td style={{ color: "var(--success)" }}>
                        ₹{parseFloat(dept.totalValue || 0).toLocaleString()}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {Object.entries(dept.byStatus || {}).map(([k, v]) => (
                          <span key={k} style={{ marginRight: 6 }}>
                            {k}: <strong>{v}</strong>
                          </span>
                        ))}
                      </td>
                    </tr>

                    {/* ── Asset detail rows ── */}
                    {expandedDept[dept.id] && (
                      <>
                        {(dept.directAssetList || []).map((a, ai) => (
                          <tr
                            key={`d-${dept.id}-${ai}`}
                            style={{ background: "rgba(51,154,240,0.05)" }}
                          >
                            <td colSpan={2} style={{ paddingLeft: 64 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    background: "rgba(51,154,240,0.15)",
                                    color: "var(--info)",
                                    padding: "1px 6px",
                                    borderRadius: 10,
                                  }}
                                >
                                  DEPT
                                </span>
                                <code
                                  style={{
                                    fontSize: 11,
                                    color: "var(--accent)",
                                  }}
                                >
                                  {a.assetTag}
                                </code>
                                <span style={{ fontSize: 12 }}>{a.name}</span>
                              </div>
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {a.category || "—"}
                            </td>
                            <td colSpan={3} />
                            <td style={{ fontSize: 11 }}>
                              <span
                                style={{
                                  padding: "1px 8px",
                                  borderRadius: 20,
                                  fontSize: 10,
                                  background:
                                    a.status === "Active"
                                      ? "rgba(0,214,143,0.1)"
                                      : "var(--bg-hover)",
                                  color:
                                    a.status === "Active"
                                      ? "var(--success)"
                                      : "var(--text-muted)",
                                }}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td />
                            <td
                              style={{ fontSize: 12, color: "var(--success)" }}
                            >
                              {a.currentValue
                                ? `₹${parseFloat(a.currentValue).toLocaleString()}`
                                : "—"}
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {a.condition}
                            </td>
                          </tr>
                        ))}

                        {(dept.employeeAssetList || []).map((a, ai) => (
                          <tr
                            key={`e-${dept.id}-${ai}`}
                            style={{ background: "rgba(0,214,143,0.04)" }}
                          >
                            <td colSpan={2} style={{ paddingLeft: 64 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    background: "rgba(0,214,143,0.15)",
                                    color: "var(--success)",
                                    padding: "1px 6px",
                                    borderRadius: 10,
                                  }}
                                >
                                  EMP
                                </span>
                                <code
                                  style={{
                                    fontSize: 11,
                                    color: "var(--accent)",
                                  }}
                                >
                                  {a.assetTag}
                                </code>
                                <span style={{ fontSize: 12 }}>{a.name}</span>
                              </div>
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {a.category || "—"}
                            </td>
                            <td style={{ fontSize: 11 }}>
                              <span
                                style={{ color: "var(--info)", fontSize: 11 }}
                              >
                                👤 {a.assignedTo}
                              </span>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--text-muted)",
                                }}
                              >
                                {a.designation}
                              </div>
                            </td>
                            <td colSpan={2} />
                            <td style={{ fontSize: 11 }}>
                              <span
                                style={{
                                  padding: "1px 8px",
                                  borderRadius: 20,
                                  fontSize: 10,
                                  background:
                                    a.status === "Active"
                                      ? "rgba(0,214,143,0.1)"
                                      : "var(--bg-hover)",
                                  color:
                                    a.status === "Active"
                                      ? "var(--success)"
                                      : "var(--text-muted)",
                                }}
                              >
                                {a.status}
                              </span>
                            </td>
                            <td />
                            <td
                              style={{ fontSize: 12, color: "var(--success)" }}
                            >
                              {a.currentValue
                                ? `₹${parseFloat(a.currentValue).toLocaleString()}`
                                : "—"}
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {a.assignedAt
                                ? new Date(a.assignedAt).toLocaleDateString(
                                    "en-IN",
                                  )
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN REPORTS PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function ReportsPage() {
  const dispatch = useDispatch();
  const { departments } = useSelector((s) => s.departments);
  const { categories } = useSelector((s) => s.categories);

  // ✅ Divisions — local fetch (no slice needed)
  const [divisions, setDivisions] = useState([]);
  useEffect(() => {
    api
      .get("/divisions")
      .then((r) => setDivisions(r.data.data || []))
      .catch(() => {});
  }, []);

  const [activeReport, setActiveReport] = useState("assets");
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchCategories());
  }, [dispatch]);

  const report = REPORTS.find((r) => r.id === activeReport);
  const columns = COLUMNS[activeReport] || [];

  const setFilter = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  // ── Fetch report ──────────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
      const endpoint = ENDPOINTS[activeReport] || activeReport;
      const res = await api.get(`/reports/${endpoint}?${params}`);
      setData(res.data.data || []);
      setSummary(res.data.summary || null);
      setSearched(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }, [activeReport, filters]);

  // ── For department-wise: flatten for standard table/export ────────────────
  const displayData =
    activeReport === "department-wise" ? flattenDeptWise(data) : data;
  const filteredData = tableSearch
    ? displayData.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(tableSearch.toLowerCase()),
      )
    : displayData;

  // ── Cell value as string (export) ─────────────────────────────────────────
  const getCellString = (col, row) => {
    const val = col.render ? col.render(row) : row[col.key];
    if (val && typeof val === "object" && val.value) return val.value;
    return val ?? "";
  };

  // ══════════════════════════════════════════════════════════════════════════
  // EXCEL DOWNLOAD
  // ══════════════════════════════════════════════════════════════════════════
  const downloadExcel = async () => {
    if (!data.length) return toast.error("No data to export");
    setDownloading("excel");
    try {
      const wb = XLSX.utils.book_new();
      const headers = columns.map((c) => c.label);
      const rows = filteredData.map((row) =>
        columns.map((col) => getCellString(col, row)),
      );
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = columns.map((col) => {
        const maxLen = Math.max(
          col.label.length,
          ...filteredData.map(
            (row) => String(getCellString(col, row) || "").length,
          ),
        );
        return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
      });

      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[addr]) continue;
        ws[addr].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
          fill: { fgColor: { rgb: "1E3A8A" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "FFFFFF" } },
            bottom: { style: "thin", color: { rgb: "FFFFFF" } },
            left: { style: "thin", color: { rgb: "FFFFFF" } },
            right: { style: "thin", color: { rgb: "FFFFFF" } },
          },
        };
      }
      for (let R = 1; R <= range.e.r; R++) {
        const isEven = R % 2 === 0;
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) ws[addr] = { t: "s", v: "" };
          ws[addr].s = {
            fill: { fgColor: { rgb: isEven ? "EFF6FF" : "FFFFFF" } },
            font: { sz: 10 },
            alignment: { vertical: "center", wrapText: false },
            border: {
              top: { style: "thin", color: { rgb: "BFDBFE" } },
              bottom: { style: "thin", color: { rgb: "BFDBFE" } },
              left: { style: "thin", color: { rgb: "BFDBFE" } },
              right: { style: "thin", color: { rgb: "BFDBFE" } },
            },
          };
        }
      }
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, ws, report.label.substring(0, 31));

      if (summary) {
        const sRows = [
          ["AssetFlow AMS — " + report.label, ""],
          ["Generated", new Date().toLocaleString("en-IN")],
          ["Total Records", filteredData.length],
          ["", ""],
        ];
        Object.entries(summary).forEach(([k, v]) => {
          if (typeof v === "object") {
            Object.entries(v).forEach(([k2, v2]) =>
              sRows.push([`${k} → ${k2}`, v2]),
            );
          } else sRows.push([k.replace(/([A-Z])/g, " $1").trim(), v]);
        });
        const wsSummary = XLSX.utils.aoa_to_sheet(sRows);
        wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }];
        ["A1", "A2", "A3"].forEach((addr) => {
          if (wsSummary[addr])
            wsSummary[addr].s = {
              font: { bold: true, sz: 11 },
              fill: { fgColor: { rgb: "DBEAFE" } },
            };
        });
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
      }

      XLSX.writeFile(
        wb,
        `${report.label}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success("Excel downloaded!");
    } catch (err) {
      toast.error("Excel download failed: " + err.message);
    } finally {
      setDownloading("");
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PDF DOWNLOAD
  // ══════════════════════════════════════════════════════════════════════════
  const downloadPDF = async () => {
    if (!data.length) return toast.error("No data to export");
    setDownloading("pdf");
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const PW = 297;

      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, PW, 18, "F");
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 18, PW, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("AssetFlow AMS", 12, 11);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(191, 219, 254);
      doc.text(`— ${report.label}`, 52, 11);
      doc.setFontSize(8);
      doc.setTextColor(147, 197, 253);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, PW - 12, 7, {
        align: "right",
      });
      doc.text(`Total Records: ${filteredData.length}`, PW - 12, 13, {
        align: "right",
      });

      let startY = 26;
      if (summary) {
        const sEntries = Object.entries(summary)
          .filter(([, v]) => typeof v !== "object")
          .slice(0, 6);
        if (sEntries.length > 0) {
          doc.setFillColor(239, 246, 255);
          doc.rect(10, 21, PW - 20, 8, "F");
          doc.setDrawColor(191, 219, 254);
          doc.setLineWidth(0.3);
          doc.rect(10, 21, PW - 20, 8, "S");
          const colW = (PW - 20) / sEntries.length;
          sEntries.forEach(([key, val], i) => {
            const x = 12 + i * colW;
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 58, 138);
            doc.text(
              key
                .replace(/([A-Z])/g, " $1")
                .trim()
                .toUpperCase(),
              x,
              25.5,
            );
            doc.setFontSize(8);
            doc.setTextColor(17, 24, 39);
            doc.text(
              typeof val === "number" && val > 9999
                ? `₹${val.toLocaleString()}`
                : String(val),
              x,
              29.5,
            );
          });
          startY = 36;
        }
      }

      autoTable(doc, {
        startY,
        head: [columns.map((c) => c.label)],
        body: filteredData.map((row) =>
          columns.map((col) => getCellString(col, row)),
        ),
        styles: {
          fontSize: 7.5,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          lineColor: [191, 219, 254],
          lineWidth: 0.2,
          overflow: "ellipsize",
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
        },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        bodyStyles: { textColor: [17, 24, 39], fillColor: [255, 255, 255] },
        margin: { top: startY, left: 10, right: 10 },
        tableLineColor: [30, 58, 138],
        tableLineWidth: 0.3,
        didDrawPage: (hookData) => {
          const total = doc.internal.getNumberOfPages();
          const curr = hookData.pageNumber;
          doc.setFillColor(30, 58, 138);
          doc.rect(0, 205, PW, 7, "F");
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(147, 197, 253);
          doc.text("AssetFlow AMS — Confidential", 12, 209.5);
          doc.text(`Page ${curr} of ${total}`, PW - 12, 209.5, {
            align: "right",
          });
          doc.text(
            `${report.label}  |  ${new Date().toLocaleDateString("en-IN")}`,
            PW / 2,
            209.5,
            { align: "center" },
          );
        },
      });

      doc.save(`${report.label}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error("PDF download failed. Try Excel instead.");
    } finally {
      setDownloading("");
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <PageContainer size="md">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          animation: "fadeIn 0.4s ease",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Reports
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                marginTop: 2,
                marginBottom: 0,
              }}
            >
              Generate and download reports in PDF or Excel
            </p>
          </div>
          {searched && data.length > 0 && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={downloadExcel}
                disabled={!!downloading}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <FileSpreadsheet size={15} color="#22c55e" />
                {downloading === "excel" ? "Downloading..." : "Excel"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={downloadPDF}
                disabled={!!downloading}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <FileText size={15} color="var(--danger)" />
                {downloading === "pdf" ? "Downloading..." : "PDF"}
              </button>
            </div>
          )}
        </div>

        {/* ── Report Type Selector ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {REPORTS.map((r) => {
            const Icon = r.icon;
            const active = activeReport === r.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setActiveReport(r.id);
                  setData([]);
                  setSummary(null);
                  setSearched(false);
                  setFilters({});
                  setTableSearch("");
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  border: `1px solid ${active ? r.color : "var(--border)"}`,
                  background: active ? `${r.color}18` : "var(--bg-card)",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <Icon
                    size={15}
                    color={active ? r.color : "var(--text-muted)"}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: active ? r.color : "var(--text-primary)",
                    }}
                  >
                    {r.label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {r.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            {report.filters.includes("dateRange") && (
              <>
                <div>
                  <label style={labelStyle}>From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.from || ""}
                    onChange={(e) => setFilter("from", e.target.value)}
                    style={{ width: 150 }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.to || ""}
                    onChange={(e) => setFilter("to", e.target.value)}
                    style={{ width: 150 }}
                  />
                </div>
              </>
            )}

            {/* ✅ NEW — Division filter */}
            {report.filters.includes("divisionId") && (
              <div>
                <label style={labelStyle}>Division</label>
                <select
                  className="form-select"
                  value={filters.divisionId || ""}
                  onChange={(e) => setFilter("divisionId", e.target.value)}
                  style={{ width: 150 }}
                >
                  <option value="">All Divisions</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code ? `[${d.code}] ` : ""}
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {report.filters.includes("departmentId") && (
              <div>
                <label style={labelStyle}>Department</label>
                <select
                  className="form-select"
                  value={filters.departmentId || ""}
                  onChange={(e) => setFilter("departmentId", e.target.value)}
                  style={{ width: 160 }}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {report.filters.includes("categoryId") && (
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  className="form-select"
                  value={filters.categoryId || ""}
                  onChange={(e) => setFilter("categoryId", e.target.value)}
                  style={{ width: 150 }}
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ""}
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {report.filters.includes("status") && (
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  className="form-select"
                  value={filters.status || ""}
                  onChange={(e) => setFilter("status", e.target.value)}
                  style={{ width: 140 }}
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {report.filters.includes("condition") && (
              <div>
                <label style={labelStyle}>Condition</label>
                <select
                  className="form-select"
                  value={filters.condition || ""}
                  onChange={(e) => setFilter("condition", e.target.value)}
                  style={{ width: 130 }}
                >
                  <option value="">All</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {report.filters.includes("maintenanceStatus") && (
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  className="form-select"
                  value={filters.status || ""}
                  onChange={(e) => setFilter("status", e.target.value)}
                  style={{ width: 140 }}
                >
                  <option value="">All</option>
                  {MAINT_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {report.filters.includes("maintenanceType") && (
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  className="form-select"
                  value={filters.type || ""}
                  onChange={(e) => setFilter("type", e.target.value)}
                  style={{ width: 130 }}
                >
                  <option value="">All</option>
                  {MAINT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {report.filters.includes("priority") && (
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  className="form-select"
                  value={filters.priority || ""}
                  onChange={(e) => setFilter("priority", e.target.value)}
                  style={{ width: 120 }}
                >
                  <option value="">All</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {report.filters.includes("assignmentStatus") && (
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  className="form-select"
                  value={filters.isActive || ""}
                  onChange={(e) => setFilter("isActive", e.target.value)}
                  style={{ width: 130 }}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Returned</option>
                </select>
              </div>
            )}

            {report.filters.includes("expiringDays") && (
              <div>
                <label style={labelStyle}>Expiring Within</label>
                <select
                  className="form-select"
                  value={filters.expiring || ""}
                  onChange={(e) => setFilter("expiring", e.target.value)}
                  style={{ width: 150 }}
                >
                  <option value="">Custom Date Range</option>
                  <option value="30">Next 30 days</option>
                  <option value="60">Next 60 days</option>
                  <option value="90">Next 90 days</option>
                  <option value="180">Next 6 months</option>
                </select>
              </div>
            )}

            {report.filters.includes("assignmentType") && (
              <div>
                <label style={labelStyle}>Assignment Type</label>
                <select
                  className="form-select"
                  value={filters.assignmentType || ""}
                  onChange={(e) => setFilter("assignmentType", e.target.value)}
                  style={{ width: 140 }}
                >
                  <option value="">All</option>
                  {ASSIGN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ✅ NEW — Show History filter (employee-wise only) */}
            {report.filters.includes("showHistory") && (
              <div>
                <label style={labelStyle}>Show History</label>
                <select
                  className="form-select"
                  value={filters.showHistory || "false"}
                  onChange={(e) => setFilter("showHistory", e.target.value)}
                  style={{ width: 160 }}
                >
                  <option value="false">Current Only</option>
                  <option value="true">Current + Past</option>
                </select>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={fetchReport}
              disabled={loading}
              style={{
                marginTop: 18,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />{" "}
                  Loading...
                </>
              ) : (
                <>
                  <Filter size={14} /> Run Report
                </>
              )}
            </button>

            {searched && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilters({});
                  setData([]);
                  setSummary(null);
                  setSearched(false);
                  setTableSearch("");
                }}
                style={{ marginTop: 18 }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Summary Cards ── */}
        {searched && <SummaryCards summary={summary} reportId={activeReport} />}

        {/* ── Results Table ── */}
        {searched && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Table header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {report.label}
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontWeight: 400,
                  }}
                >
                  {filteredData.length} of {displayData.length} records
                </span>
              </span>
              <div style={{ position: "relative" }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  className="form-input"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search in results..."
                  style={{ paddingLeft: 30, width: 200, fontSize: 13 }}
                />
              </div>
            </div>

            {loading ? (
              <div
                style={{
                  padding: 32,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div className="spinner" style={{ width: 32, height: 32 }} />
              </div>
            ) : filteredData.length === 0 ? (
              <div
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <FileText
                  size={40}
                  style={{
                    opacity: 0.3,
                    display: "block",
                    margin: "0 auto 12px",
                  }}
                />
                No records found for selected filters
              </div>
            ) : (
              <>
                {/* ✅ Employee-wise — expandable table */}
                {activeReport === "employee-wise" && (
                  <EmployeeWiseTable data={filteredData} />
                )}

                {/* ✅ Department-wise — expandable tree table */}
                {activeReport === "department-wise" && (
                  <DepartmentWiseTable data={data} />
                )}

                {/* Standard table for all other reports */}
                {activeReport !== "employee-wise" &&
                  activeReport !== "department-wise" && (
                    <div style={{ overflowX: "auto" }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ paddingLeft: 20, width: 40 }}>#</th>
                            {columns.map((col) => (
                              <th key={col.key}>{col.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((row, idx) => (
                            <tr key={row.id || idx}>
                              <td
                                style={{
                                  paddingLeft: 20,
                                  color: "var(--text-muted)",
                                  fontSize: 12,
                                }}
                              >
                                {idx + 1}
                              </td>
                              {columns.map((col) => (
                                <td key={col.key} style={{ fontSize: 13 }}>
                                  <CellValue col={col} row={row} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        {/* ── Empty state ── */}
        {!searched && !loading && (
          <div
            className="card"
            style={{ padding: "48px 20px", textAlign: "center" }}
          >
            <FileText
              size={48}
              style={{
                opacity: 0.2,
                display: "block",
                margin: "0 auto 16px",
                color: "var(--accent)",
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Select a report type, set filters and click{" "}
              <strong style={{ color: "var(--accent)" }}>Run Report</strong>
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
