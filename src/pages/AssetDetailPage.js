import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAsset, returnAsset } from "../store/slices/assetSlice";
import { fetchEmployees } from "../store/slices/employeeSlice"; // ✅ fetchUsers → fetchEmployees
import api from "../services/api";
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  X,
  Clock,
  Package,
  Wrench,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShoppingCart,
  Edit3,
  Trash2,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  ArrowRightLeft,
  Archive,
  QrCode,
  Printer,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";
import toast from "react-hot-toast";
import { fetchDepartments } from "../store/slices/departmentSlice";
import { fetchLocations } from "../store/slices/permissionSlice";

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({ asset, employees, departments, locations, onClose }) {
  const [form, setForm] = useState({
    assignmentType: "employee",
    employeeId: "",
    departmentId: "",
    locationId: "",
    purpose: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.assignmentType === "employee" && !form.employeeId)
      return toast.error("Please select an employee");
    if (form.assignmentType === "department" && !form.departmentId)
      return toast.error("Please select a department");
    if (form.assignmentType === "location" && !form.locationId)
      return toast.error("Please select a location");

    setLoading(true);
    try {
      const payload = {
        assignmentType: form.assignmentType,
        purpose: form.purpose,
        notes: form.notes,
      };
      if (form.assignmentType === "employee")
        payload.employeeId = form.employeeId;
      if (form.assignmentType === "department")
        payload.departmentId = form.departmentId;
      if (form.assignmentType === "location")
        payload.locationId = form.locationId;

      const res = await api.post(`/assets/${asset.id}/assign`, payload);
      const msg = res.data?.approvalRequired
        ? `Approval request created! #${res.data.requestNumber}`
        : "Asset assigned successfully!";
      toast.success(msg);
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const TYPE_OPTIONS = [
    {
      value: "employee",
      label: "👤 Employee",
      desc: "Personal use — laptop, phone, etc.",
    },
    {
      value: "department",
      label: "🏢 Department",
      desc: "Shared — printer, projector, etc.",
    },
    {
      value: "location",
      label: "📍 Location / Branch",
      desc: "Fixed at a location — AC, server, etc.",
    },
  ];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">Assign Asset</h2>
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
          {/* Assignment Type Selector */}
          <div className="form-group">
            <label className="form-label">Assignment Type *</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      assignmentType: opt.value,
                      employeeId: "",
                      departmentId: "",
                      locationId: "",
                    }))
                  }
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    textAlign: "left",
                    cursor: "pointer",
                    border: `2px solid ${form.assignmentType === opt.value ? "var(--accent)" : "var(--border)"}`,
                    background:
                      form.assignmentType === opt.value
                        ? "var(--accent-glow)"
                        : "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          form.assignmentType === opt.value
                            ? "var(--accent)"
                            : "var(--text-primary)",
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Dropdown based on type */}
          {form.assignmentType === "employee" && (
            <div className="form-group">
              <label className="form-label">Select Employee *</label>
              <select
                className="form-input"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
                required
              >
                <option value="">-- Select Employee --</option>
                {employees
                  .filter(
                    (emp) => emp.isActive && emp.id !== asset?.assignedToId,
                  )
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                      {emp.employeeCode ? ` (${emp.employeeCode})` : ""}
                      {emp.designation ? ` — ${emp.designation}` : ""}
                      {emp.department?.name ? ` · ${emp.department.name}` : ""}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {form.assignmentType === "department" && (
            <div className="form-group">
              <label className="form-label">Select Department *</label>
              <select
                className="form-input"
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.division?.name ? ` — ${d.division.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.assignmentType === "location" && (
            <div className="form-group">
              <label className="form-label">Select Location / Branch *</label>
              <select
                className="form-input"
                value={form.locationId}
                onChange={(e) =>
                  setForm({ ...form, locationId: e.target.value })
                }
                required
              >
                <option value="">-- Select Location --</option>
                {locations
                  .filter((l) => l.isActive !== false)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.code ? ` (${l.code})` : ""}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Purpose</label>
            <input
              className="form-input"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. Daily work, Conference room use"
            />
          </div>

          {/* {
          form.assignmentType === "employee" && (
            <div className="form-group">
              <label className="form-label">Expected Return Date</label>
              <input
                className="form-input"
                type="date"
                value={form.expectedReturnDate}
                onChange={(e) =>
                  setForm({ ...form, expectedReturnDate: e.target.value })
                }
              />
            </div>
          )} */}

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

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
                  Processing...
                </>
              ) : (
                "Assign Asset"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── QR Print Modal ────────────────────────────────────────────────────────────
function QRPrintModal({ asset, onClose }) {
  const frontendUrl = window.location.origin;
  const scanUrl = `${frontendUrl}/scan/${asset.assetTag}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=500");
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>QR - ${asset.assetTag}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: white; }
        .label { width: 5cm; height: 5cm; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #000; padding: 6px; }
        .company { font-size: 7px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #333; margin-bottom: 4px; }
        .qr-img { width: 2.8cm; height: 2.8cm; }
        .asset-tag { font-size: 8px; font-weight: bold; font-family: monospace; margin-top: 4px; color: #000; }
        .asset-name { font-size: 7px; color: #333; margin-top: 2px; text-align: center; max-width: 4.5cm; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .asset-info { font-size: 6px; color: #666; margin-top: 2px; }
        @media print { @page { size: 5cm 5cm; margin: 0; } body { width: 5cm; height: 5cm; } }
      </style></head><body>
      <div class="label">
        <div class="company">AssetFlow AMS</div>
        <img class="qr-img" src="${asset.qrCode}" alt="QR Code" />
        <div class="asset-tag">${asset.assetTag}</div>
        <div class="asset-name">${asset.name}</div>
        <div class="asset-info">${asset.category.name || "—"}</div>
        <div class="asset-info">${asset.subCategory.name || "—"}</div>
      </div>
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = `QR_${asset.assetTag}.png`;
    link.href = asset.qrCode;
    link.click();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <QrCode size={18} style={{ marginRight: 8 }} />
            QR Code
          </h2>
          <button
            onClick={onClose}
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
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              border: "2px solid var(--border)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 10,
              background: "white",
              gap: 4,
            }}
          >
            <p
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#333",
                textTransform: "uppercase",
              }}
            >
              AssetFlow AMS
            </p>
            {asset.qrCode ? (
              <img
                src={asset.qrCode}
                alt="QR Code"
                style={{ width: 130, height: 130 }}
              />
            ) : (
              <div
                style={{
                  width: 130,
                  height: 130,
                  background: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                No QR
              </div>
            )}
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "monospace",
                color: "#000",
              }}
            >
              {asset.assetTag}
            </p>
            <p
              style={{
                fontSize: 8,
                color: "#333",
                textAlign: "center",
                maxWidth: 160,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {asset.name}
            </p>
          </div>
          <div
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Scan URL:
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--accent)",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {scanUrl}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button
              className="btn btn-secondary"
              onClick={handleDownload}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <QrCode size={14} /> Download
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Printer size={14} /> Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dispose Modal ─────────────────────────────────────────────────────────────
function DisposeModal({ asset, onClose }) {
  const [form, setForm] = useState({
    reason: "",
    disposalMethod: "Scrapped",
    saleAmount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason) return toast.error("Reason required");
    setLoading(true);
    try {
      const res = await api.post(`/assets/${asset.id}/dispose`, form);
      if (res.data.approvalRequired) {
        toast.success(`Disposal request raised! #${res.data.requestNumber}`);
      } else {
        toast.success("Asset disposed successfully!");
      }
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: "var(--danger)" }}>
            <Archive size={18} style={{ marginRight: 8 }} />
            Dispose Asset
          </h2>
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
        <div
          style={{
            padding: "12px 20px 8px",
            background: "rgba(255,71,87,0.08)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <AlertTriangle size={15} color="var(--danger)" />
          <span style={{ fontSize: 12, color: "var(--danger)" }}>
            This action will mark <strong>{asset.assetTag}</strong> as Disposed.
            Approval may be required.
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: 20,
          }}
        >
          <div className="form-group">
            <label className="form-label">Disposal Method *</label>
            <select
              className="form-select"
              value={form.disposalMethod}
              onChange={set("disposalMethod")}
            >
              {[
                "Scrapped",
                "Sold",
                "Donated",
                "Written Off",
                "End of Life",
                "Damaged Beyond Repair",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea
              className="form-input"
              value={form.reason}
              onChange={set("reason")}
              rows={2}
              placeholder="Why is this asset being disposed?"
              required
              style={{ resize: "vertical" }}
            />
          </div>
          {form.disposalMethod === "Sold" && (
            <div className="form-group">
              <label className="form-label">Sale Amount (₹)</label>
              <input
                className="form-input"
                type="number"
                value={form.saleAmount}
                onChange={set("saleAmount")}
                placeholder="0"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Additional Notes</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              placeholder="Any additional notes..."
              style={{ resize: "vertical" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onClose(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <Archive size={14} style={{ marginRight: 4 }} /> Dispose Asset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Transfer Modal ────────────────────────────────────────────────────────────
function TransferModal({ asset, employees, departments, locations, onClose }) {
  const [form, setForm] = useState({
    assignmentType: "employee",
    employeeId: "",
    departmentId: "",
    locationId: "",
    reason: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const TYPE_OPTIONS = [
    {
      value: "employee",
      label: "👤 Employee",
      desc: "Transfer to another employee",
    },
    {
      value: "department",
      label: "🏢 Department",
      desc: "Transfer to a department",
    },
    {
      value: "location",
      label: "📍 Location / Branch",
      desc: "Transfer to another location",
    },
    {
      value: "pool",
      label: "🔄 Return to Pool",
      desc: "Make available for anyone",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.assignmentType === "employee" && !form.employeeId)
      return toast.error("Please select an employee");
    if (form.assignmentType === "department" && !form.departmentId)
      return toast.error("Please select a department");
    if (form.assignmentType === "location" && !form.locationId)
      return toast.error("Please select a location");
    if (!form.reason && form.assignmentType !== "pool")
      return toast.error("Please provide a reason");

    setLoading(true);
    try {
      const payload = {
        assignmentType: form.assignmentType,
        reason: form.reason,
        notes: form.notes,
      };
      if (form.assignmentType === "employee")
        payload.employeeId = form.employeeId;
      if (form.assignmentType === "department")
        payload.departmentId = form.departmentId;
      if (form.assignmentType === "location")
        payload.locationId = form.locationId;

      const res = await api.post(`/assets/${asset.id}/transfer`, payload);
      if (res.data.approvalRequired) {
        toast.success(`Transfer request raised! #${res.data.requestNumber}`);
      } else {
        toast.success("Asset transferred successfully!");
      }
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  // Current assignment display
  const getCurrentHolder = () => {
    if (!asset) return "—";
    if (asset.assignmentType === "employee" && asset.assignedToEmployee)
      return `👤 ${asset.assignedToEmployee.firstName} ${asset.assignedToEmployee.lastName}`;
    if (asset.assignmentType === "department" && asset.assignedToDept)
      return `🏢 ${asset.assignedToDept.name}`;
    if (asset.assignmentType === "location" && asset.assignedToLoc)
      return `📍 ${asset.assignedToLoc.name}`;
    return "🔄 Pool (Unassigned)";
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            <ArrowRightLeft size={18} style={{ marginRight: 8 }} />
            Transfer Asset
          </h2>
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
          {/* Current holder */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
              fontSize: 13,
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                fontWeight: 600,
                display: "block",
                marginBottom: 2,
              }}
            >
              CURRENTLY
            </span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {getCurrentHolder()}
            </span>
          </div>

          {/* Transfer To Type */}
          <div className="form-group">
            <label className="form-label">Transfer To *</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      assignmentType: opt.value,
                      employeeId: "",
                      departmentId: "",
                      locationId: "",
                    }))
                  }
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    textAlign: "left",
                    cursor: "pointer",
                    border: `2px solid ${form.assignmentType === opt.value ? "var(--accent)" : "var(--border)"}`,
                    background:
                      form.assignmentType === opt.value
                        ? "var(--accent-glow)"
                        : "var(--bg-hover)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color:
                        form.assignmentType === opt.value
                          ? "var(--accent)"
                          : "var(--text-primary)",
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic target selector */}
          {form.assignmentType === "employee" && (
            <div className="form-group">
              <label className="form-label">Select Employee *</label>
              <select
                className="form-input"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
                required
              >
                <option value="">-- Select Employee --</option>
                {employees
                  .filter((e) => e.isActive && e.id !== asset?.assignedToId)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                      {emp.employeeCode ? ` (${emp.employeeCode})` : ""}
                      {emp.designation ? ` — ${emp.designation}` : ""}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {form.assignmentType === "department" && (
            <div className="form-group">
              <label className="form-label">Select Department *</label>
              <select
                className="form-input"
                value={form.departmentId}
                onChange={(e) =>
                  setForm({ ...form, departmentId: e.target.value })
                }
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.division?.name ? ` — ${d.division.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.assignmentType === "location" && (
            <div className="form-group">
              <label className="form-label">Select Location *</label>
              <select
                className="form-input"
                value={form.locationId}
                onChange={(e) =>
                  setForm({ ...form, locationId: e.target.value })
                }
                required
              >
                <option value="">-- Select Location --</option>
                {locations
                  .filter((l) => l.isActive !== false)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                      {l.code ? ` (${l.code})` : ""}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {form.assignmentType !== "pool" && (
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <input
                className="form-input"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Why is this asset being transferred?"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              paddingTop: 4,
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
                "Processing..."
              ) : (
                <>
                  <ArrowRightLeft size={14} style={{ marginRight: 4 }} />{" "}
                  Transfer Asset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Return Modal ──────────────────────────────────────────────────────────────
function ReturnModal({ asset, onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    conditionAtReturn: asset?.condition || "Good",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await dispatch(returnAsset({ id: asset.id, ...form }));
      if (result.error) throw new Error(result.payload?.message || "Failed");
      toast.success("Asset returned successfully!");
      onClose(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Return Asset</h2>
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
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div className="form-group">
            <label className="form-label">Condition at Return</label>
            <select
              className="form-input"
              value={form.conditionAtReturn}
              onChange={(e) =>
                setForm({ ...form, conditionAtReturn: e.target.value })
              }
            >
              {["Excellent", "Good", "Fair", "Poor", "Damaged"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Return Notes</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Any observations..."
            />
          </div>
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
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? "Processing..." : "Confirm Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Timeline Event Config ─────────────────────────────────────────────────────
const EVENT_CONFIG = {
  PURCHASED: { icon: ShoppingCart, color: "#7c3aed", label: "Purchased" },
  CREATED: { icon: Package, color: "#00d4ff", label: "Added to System" },
  ASSIGNED: { icon: UserPlus, color: "#00d68f", label: "Assigned" },
  REASSIGNED: { icon: UserPlus, color: "#00d68f", label: "Re-Assigned" },
  RETURNED: { icon: RotateCcw, color: "#ff8c42", label: "Returned" },
  MAINTENANCE: { icon: Wrench, color: "#339af0", label: "Maintenance" },
  UPDATED: { icon: Edit3, color: "#ffb703", label: "Updated" },
  APPROVAL_GRANTED: { icon: CheckCircle, color: "#00d68f", label: "Approved" },
  APPROVAL_REJECTED: { icon: XCircle, color: "#ff4757", label: "Rejected" },
  DISPOSED: { icon: Trash2, color: "#ff4757", label: "Disposed" },
};

function TimelineEvent({ event, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_CONFIG[event.type] || {
    icon: Activity,
    color: "#64748b",
    label: event.type,
  };
  const Icon = config.icon;

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const formatCurrency = (v) =>
    v ? `₹${parseFloat(v).toLocaleString("en-IN")}` : null;

  const renderDetails = () => {
    const d = event.details;
    const rows = [];
    if (event.type === "PURCHASED") {
      if (d.purchasePrice)
        rows.push({
          label: "Purchase Price",
          value: formatCurrency(d.purchasePrice),
        });
      if (d.vendor) rows.push({ label: "Vendor", value: d.vendor });
      if (d.invoiceNumber)
        rows.push({ label: "Invoice #", value: d.invoiceNumber });
      if (d.warrantyExpiry)
        rows.push({
          label: "Warranty Until",
          value: new Date(d.warrantyExpiry).toLocaleDateString("en-IN"),
        });
    }
    if (event.type === "CREATED") {
      if (d.addedBy) rows.push({ label: "Added By", value: d.addedBy });
      if (d.assetTag) rows.push({ label: "Asset Tag", value: d.assetTag });
    }
    if (event.type === "ASSIGNED" || event.type === "REASSIGNED") {
      if (d.assignedTo)
        rows.push({ label: "Assigned To", value: d.assignedTo });
      if (d.assignedToDesignation)
        rows.push({ label: "Designation", value: d.assignedToDesignation }); // ✅ department → designation
      if (d.assignedBy)
        rows.push({ label: "Assigned By", value: d.assignedBy });
      if (d.purpose) rows.push({ label: "Purpose", value: d.purpose });
      // if (d.expectedReturnDate)
      //   rows.push({
      //     label: "Expected Return",
      //     value: new Date(d.expectedReturnDate).toLocaleDateString("en-IN"),
      //   });
      if (d.conditionAtAssignment)
        rows.push({ label: "Condition", value: d.conditionAtAssignment });
    }
    if (event.type === "RETURNED") {
      if (d.returnedBy)
        rows.push({ label: "Returned By", value: d.returnedBy });
      if (d.conditionAtReturn)
        rows.push({ label: "Condition on Return", value: d.conditionAtReturn });
      if (d.durationDays !== null && d.durationDays !== undefined)
        rows.push({ label: "Used For", value: `${d.durationDays} days` });
    }
    if (event.type === "MAINTENANCE") {
      if (d.maintenanceTitle)
        rows.push({ label: "Title", value: d.maintenanceTitle });
      if (d.maintenanceType)
        rows.push({ label: "Type", value: d.maintenanceType });
      if (d.status) rows.push({ label: "Status", value: d.status });
      if (d.technician) rows.push({ label: "Technician", value: d.technician });
      if (d.cost) rows.push({ label: "Cost", value: formatCurrency(d.cost) });
      if (d.completedDate)
        rows.push({
          label: "Completed",
          value: new Date(d.completedDate).toLocaleDateString("en-IN"),
        });
      if (d.vendor) rows.push({ label: "Vendor", value: d.vendor });
    }
    if (event.type === "UPDATED") {
      if (d.updatedBy) rows.push({ label: "Updated By", value: d.updatedBy });
      if (d.changes?.length > 0)
        d.changes.forEach((c) =>
          rows.push({ label: c.field, value: `${c.from} → ${c.to}` }),
        );
    }
    if (
      event.type === "APPROVAL_GRANTED" ||
      event.type === "APPROVAL_REJECTED"
    ) {
      if (d.requestNumber)
        rows.push({ label: "Request #", value: d.requestNumber });
      if (d.requestedBy)
        rows.push({ label: "Requested By", value: d.requestedBy });
      if (d.remarks) rows.push({ label: "Remarks", value: d.remarks });
    }
    if (event.type === "DISPOSED") {
      if (d.disposedBy)
        rows.push({ label: "Disposed By", value: d.disposedBy });
      if (d.notes) rows.push({ label: "Notes", value: d.notes });
    }
    return rows;
  };

  const details = renderDetails();

  return (
    <div style={{ display: "flex", gap: 0 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginRight: 16,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `${config.color}18`,
            border: `2px solid ${config.color}50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 12px ${config.color}25`,
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={config.color} />
        </div>
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              minHeight: 24,
              background:
                "linear-gradient(to bottom, var(--border), transparent)",
              margin: "4px 0",
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            cursor: details.length > 0 ? "pointer" : "default",
            transition: "border-color 0.15s",
          }}
          onClick={() => details.length > 0 && setExpanded(!expanded)}
          onMouseEnter={(e) => {
            if (details.length > 0)
              e.currentTarget.style.borderColor = `${config.color}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: `${config.color}15`,
                  color: config.color,
                  border: `1px solid ${config.color}30`,
                }}
              >
                {config.label}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {event.title}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {new Date(event.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {details.length > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    transform: expanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                    display: "inline-block",
                  }}
                >
                  ▼
                </span>
              )}
            </div>
          </div>
          {!expanded && details.length > 0 && (
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}
            >
              {details
                .slice(0, 2)
                .map((d) => `${d.label}: ${d.value}`)
                .join(" · ")}
              {details.length > 2 && ` · +${details.length - 2} more`}
            </div>
          )}
          {expanded && details.length > 0 && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${config.color}20`,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "8px 16px",
              }}
            >
              {details.map((row, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginBottom: 2,
                      fontWeight: 500,
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentAsset, isLoading } = useSelector((s) => s.assets);
  const { departments } = useSelector((s) => s.departments);
  const { locations } = useSelector((s) => s.permissions);
  const { employees } = useSelector((s) => s.employees); // ✅ users → employees
  const { user: me } = useSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState("overview");
  const [showAssign, setShowAssign] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showDispose, setShowDispose] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAsset(id));
    dispatch(fetchEmployees({ limit: 200, isActive: true }));
    dispatch(fetchDepartments());
    dispatch(fetchLocations()); // ✅ fetchUsers → fetchEmployees
  }, [id, dispatch]);

  const fetchTimeline = async () => {
    setTimelineLoading(true);
    try {
      const { data } = await api.get(`/assets/${id}/timeline`);
      setTimeline(data.data);
    } catch {
      toast.error("Failed to load timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "timeline") fetchTimeline();
  }, [activeTab]);

  const asset = currentAsset;
  const hasActiveAssignment = !!(asset?.Assignments?.length > 0);

  const { can } = usePermission();
  const canManage = can("asset_master", "edit");
  const canDispose = can("asset_master", "delete");

  const statusColor = {
    Active: "var(--success)",
    Inactive: "var(--text-muted)",
    "In Maintenance": "var(--warning)",
    Disposed: "var(--danger)",
    Lost: "var(--danger)",
    Reserved: "var(--info)",
  };

  const conditionColor = {
    Excellent: "#00d68f",
    Good: "#00d4ff",
    Fair: "#ffb703",
    Poor: "#ff8c42",
    Damaged: "#ff4757",
  };

  if (isLoading || !asset) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "📋 Overview" },
    { key: "timeline", label: "🕐 Life History" },
  ];

  const tabStyle = (key) => ({
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    background: activeTab === key ? "var(--accent-glow)" : "transparent",
    color: activeTab === key ? "var(--accent)" : "var(--text-muted)",
    border:
      activeTab === key
        ? "1px solid rgba(0,212,255,0.3)"
        : "1px solid transparent",
  });

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
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate("/assets")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>{asset.name}</h2>
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: `${statusColor[asset.status]}15`,
                  color: statusColor[asset.status],
                  fontWeight: 600,
                  border: `1px solid ${statusColor[asset.status]}30`,
                }}
              >
                {asset.status}
              </span>
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: `${conditionColor[asset.condition]}15`,
                  color: conditionColor[asset.condition],
                  fontWeight: 600,
                  border: `1px solid ${conditionColor[asset.condition]}30`,
                }}
              >
                {asset.condition}
              </span>
            </div>
            {/* <p
              style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}
            >
              {asset.assetTag} · {asset.category.name || "—"}{" "}
              {asset.assetTag} · {asset.subCategory.name || "—"}{" "}
              {asset.brand ? `· ${asset.brand}` : ""} {asset.model || ""}
            </p> */}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowQR(true)}
            title="Print QR Code"
          >
            <QrCode size={15} /> QR Code
          </button>
        </div>

        {canManage && (
          <div style={{ display: "flex", gap: 10 }}>
            {hasActiveAssignment ? (
              <>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowReturn(true)}
                >
                  <UserMinus size={15} /> Return asset
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowTransfer(true)}
                >
                  <ArrowRightLeft size={15} /> Transfer asset
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowAssign(true)}
              >
                <UserPlus size={15} /> Assign asset
              </button>
            )}
            {canDispose && asset.status !== "Disposed" && (
              <button
                className="btn btn-danger"
                style={{ fontSize: 13, marginLeft: 4 }}
                onClick={() => setShowDispose(true)}
              >
                <Archive size={15} /> Dispose asset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Current Assignment Banner */}
      {hasActiveAssignment ? (
        <div
          style={{
            padding: "12px 18px",
            background: "rgba(0,214,143,0.07)",
            border: "1px solid rgba(0,214,143,0.25)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CheckCircle size={18} color="var(--success)" />
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {asset.assignmentType === "employee" &&
              asset.assignedToEmployee && (
                <>
                  Assigned to{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    👤 {asset.assignedToEmployee.firstName}{" "}
                    {asset.assignedToEmployee.lastName}
                  </strong>
                  {asset.assignedToEmployee.designation &&
                    ` · ${asset.assignedToEmployee.designation}`}
                </>
              )}
            {asset.assignmentType === "department" && asset.assignedToDept && (
              <>
                Assigned to{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  🏢 {asset.assignedToDept.name}
                </strong>
              </>
            )}
            {asset.assignmentType === "location" && asset.assignedToLoc && (
              <>
                Assigned to{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  📍 {asset.assignedToLoc.name}
                </strong>
              </>
            )}
          </span>
        </div>
      ) : (
        <div
          style={{
            padding: "12px 18px",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Package size={18} color="var(--text-muted)" />
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
            🔄 In Pool — available for use
          </span>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            style={tabStyle(t.key)}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div className="card">
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Asset Details
            </h3>
            {[
              { label: "Category", value: asset.category?.name || "—" },
              { label: "Sub category", value: asset.subCategory?.name || "—" },
              {
                label: "Brand / Model",
                value:
                  [asset.brand, asset.model].filter(Boolean).join(" ") || "—",
              },
              { label: "Serial Number", value: asset.serialNumber || "—" },
              {
                label: "Physical Location",
                value: asset.locationObj?.name || asset.location || "—",
              },
              { label: "Owning Department", value: asset.department?.name || "—" }, // ✅ object se
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {row.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Financial Details
            </h3>
            {[
              {
                label: "Purchase Price",
                value: asset.purchasePrice
                  ? `₹${parseFloat(asset.purchasePrice).toLocaleString("en-IN")}`
                  : "—",
              },
              {
                label: "Current Value",
                value: asset.currentValue
                  ? `₹${parseFloat(asset.currentValue).toLocaleString("en-IN")}`
                  : "—",
              },
              {
                label: "Purchase Date",
                value: asset.purchaseDate
                  ? new Date(asset.purchaseDate).toLocaleDateString("en-IN")
                  : "—",
              },
              {
                label: "Warranty Expiry",
                value: asset.warrantyExpiry
                  ? new Date(asset.warrantyExpiry).toLocaleDateString("en-IN")
                  : "—",
              },
              {
                label: "Depreciation Rate",
                value: asset.depreciationRate
                  ? `${asset.depreciationRate}% p.a.`
                  : "—",
              },
              { label: "Vendor", value: asset.vendor || "—" },
              { label: "Invoice Number", value: asset.invoiceNumber || "—" },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: i < 6 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {row.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {asset.notes && (
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Notes
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {asset.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div>
          {timelineLoading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 60 }}
            >
              <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
          ) : !timeline ? null : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 280px",
                gap: 20,
              }}
            >
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                    Asset Life History
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Complete journey · Click any event to expand
                  </p>
                </div>
                {timeline.timeline.length === 0 ? (
                  <div
                    className="card"
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Clock
                      size={40}
                      style={{ marginBottom: 12, opacity: 0.4 }}
                    />
                    <p>No history recorded yet.</p>
                  </div>
                ) : (
                  <div style={{ paddingLeft: 4 }}>
                    {timeline.timeline.map((event, i) => (
                      <TimelineEvent
                        key={i}
                        event={event}
                        isLast={i === timeline.timeline.length - 1}
                      />
                    ))}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background:
                              statusColor[timeline.asset.status] ||
                              "var(--accent)",
                            border: `3px solid ${statusColor[timeline.asset.status] || "var(--accent)"}40`,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            statusColor[timeline.asset.status] ||
                            "var(--accent)",
                        }}
                      >
                        Current Status: {timeline.asset.status}
                        {timeline.asset.assignedTo &&
                          ` — ${timeline.asset.assignedTo.firstName} ${timeline.asset.assignedTo.lastName}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div className="card">
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      marginBottom: 14,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Life Summary
                  </h4>
                  {[
                    {
                      label: "Asset Age",
                      value: timeline.summary.ageDays
                        ? `${Math.floor(timeline.summary.ageDays / 365)}y ${Math.floor((timeline.summary.ageDays % 365) / 30)}m`
                        : "—",
                    },
                    {
                      label: "Total Assignments",
                      value: timeline.summary.totalAssignments,
                    },
                    {
                      label: "Days In Use",
                      value: timeline.summary.totalDaysAssigned
                        ? `${timeline.summary.totalDaysAssigned} days`
                        : "0 days",
                    },
                    {
                      label: "Maintenance Count",
                      value: timeline.summary.totalMaintenances,
                    },
                    {
                      label: "Maintenance Cost",
                      value: timeline.summary.totalMaintenanceCost
                        ? `₹${timeline.summary.totalMaintenanceCost.toLocaleString("en-IN")}`
                        : "₹0",
                    },
                    {
                      label: "Total Events",
                      value: timeline.summary.totalEvents,
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom:
                          i < 5 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        {row.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      marginBottom: 14,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Current Holder
                  </h4>
                  {timeline.summary.currentHolder &&
                  timeline.summary.assignmentType !== "pool" ? (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {timeline.summary.currentHolder}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          textTransform: "capitalize",
                        }}
                      >
                        {timeline.summary.assignmentType}
                      </div>
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      🔄 In Pool (Available)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showAssign && (
        <AssignModal
          asset={asset}
          employees={employees}
          departments={departments}
          locations={locations}
          onClose={(r) => {
            setShowAssign(false);
            if (r) {
              dispatch(fetchAsset(id));
              if (activeTab === "timeline") fetchTimeline();
            }
          }}
        />
      )}
      {showReturn && (
        <ReturnModal
          asset={asset}
          onClose={(r) => {
            setShowReturn(false);
            if (r) {
              dispatch(fetchAsset(id));
              if (activeTab === "timeline") fetchTimeline();
            }
          }}
        />
      )}
      {showQR && (
        <QRPrintModal asset={asset} onClose={() => setShowQR(false)} />
      )}
      {showDispose && (
        <DisposeModal
          asset={asset}
          onClose={(r) => {
            setShowDispose(false);
            if (r) {
              dispatch(fetchAsset(id));
              if (activeTab === "timeline") fetchTimeline();
            }
          }}
        />
      )}
      {showTransfer && (
        <TransferModal
          asset={asset}
          employees={employees}
          departments={departments} // ✅ add karo
          locations={locations}
          onClose={(r) => {
            setShowTransfer(false);
            if (r) {
              dispatch(fetchAsset(id));
              if (activeTab === "timeline") fetchTimeline();
            }
          }}
        />
      )}
    </div>
  );
}
