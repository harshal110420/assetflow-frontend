import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "../store/slices/maintenanceSlice";
import { fetchEmployees } from "../store/slices/employeeSlice"; // ✅ naya
import {
  Plus,
  Wrench,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { usePermission } from "../hooks/usePermission";
import { useNavigate } from "react-router-dom";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const TYPES = [
  "Preventive",
  "Corrective",
  "Predictive",
  "Emergency",
  "Inspection",
];
const STATUSES = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
  "Overdue",
];

const statusIcon = {
  Scheduled: Calendar,
  "In Progress": Wrench,
  Completed: CheckCircle,
  Cancelled: X,
  Overdue: AlertCircle,
};
const priorityColor = {
  Low: "var(--success)",
  Medium: "var(--info)",
  High: "var(--warning)",
  Critical: "var(--danger)",
};

export default function MaintenancePage() {
  const dispatch = useDispatch();
  const { maintenances, isLoading } = useSelector((s) => s.maintenance);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const { can } = usePermission();
  const navigate = useNavigate();
  useEffect(() => {
    dispatch(fetchMaintenances({ status: statusFilter }));
    dispatch(fetchEmployees({ limit: 200, isActive: true })); // ✅ employees preload
  }, [dispatch, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this maintenance record?")) return;
    const result = await dispatch(deleteMaintenance(id));
    if (!result.error) toast.success("Deleted");
    else toast.error("Failed");
  };

  const canCreate = can("maintenance", "new");
  const canEdit = can("maintenance", "edit");
  const canDelete = can("maintenance", "delete");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        animation: "fadeIn 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            Maintenance Management
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {maintenances.length} maintenance records
          </p>
        </div>
        {canCreate && (
          <button
            className="btn btn-primary"
            onClick={() => navigate("/maintenance/new")}
          >
            <Plus size={18} /> Schedule Maintenance
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {["", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: 13,
              fontWeight: 500,
              background:
                statusFilter === s ? "var(--accent-glow)" : "var(--bg-card)",
              color: statusFilter === s ? "var(--accent)" : "var(--text-muted)",
              border:
                statusFilter === s
                  ? "1px solid rgba(0,212,255,0.3)"
                  : "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div
            style={{ padding: 32, display: "flex", justifyContent: "center" }}
          >
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Asset</th>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Scheduled</th>
                <th>Cost</th>
                <th style={{ paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--text-muted)",
                    }}
                  >
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                maintenances.map((m) => {
                  const StatusIcon = statusIcon[m.status] || Clock;
                  return (
                    <tr key={m.id}>
                      <td style={{ paddingLeft: 20 }}>
                        {m.Asset ? (
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>
                              {m.Asset.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--accent)",
                                fontFamily: "monospace",
                              }}
                            >
                              {m.Asset.assetTag}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{m.title}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            background: "var(--bg-hover)",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: priorityColor[m.priority],
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {m.priority}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <StatusIcon
                            size={14}
                            color={
                              m.status === "Overdue"
                                ? "var(--danger)"
                                : m.status === "Completed"
                                  ? "var(--success)"
                                  : "var(--text-muted)"
                            }
                          />
                          <span
                            style={{
                              fontSize: 13,
                              color:
                                m.status === "Overdue"
                                  ? "var(--danger)"
                                  : "var(--text-secondary)",
                            }}
                          >
                            {m.status}
                          </span>
                        </div>
                      </td>
                      {/* ✅ Technician — Employee data */}
                      <td style={{ fontSize: 13 }}>
                        {m.technician ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {m.technician.firstName} {m.technician.lastName}
                            </div>
                            {m.technician.designation && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                }}
                              >
                                {m.technician.designation}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {m.scheduledDate
                          ? new Date(m.scheduledDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {m.cost > 0 ? `₹${parseFloat(m.cost).toFixed(0)}` : "—"}
                      </td>
                      <td style={{ paddingRight: 20 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {canEdit && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                navigate(`/maintenance/${m.id}/edit`)
                              }
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(m.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
