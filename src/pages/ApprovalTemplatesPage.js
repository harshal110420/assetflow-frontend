import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const MODULES = [
  { value: "asset_assignment", label: "Asset Assignment" },
  { value: "asset_disposal", label: "Asset Disposal" },
  { value: "asset_purchase", label: "Asset Purchase Request" },
  { value: "maintenance", label: "Maintenance" },
  { value: "asset_transfer", label: "Asset Transfer" },
];

const APPROVER_TYPES = [
  { value: "specific_user", label: "Specific User (Fixed Person)" },
  { value: "role", label: "Role Based (Anyone with that role)" },
  {
    value: "reporting_manager",
    label: "Requester's Reporting Manager (Dynamic)",
  },
];

const ROLES = ["admin", "manager", "technician", "viewer"];

const CONDITION_OPERATORS = [">", "<", ">=", "<=", "=", "!="];

const emptyStep = {
  stepName: "",
  approverType: "reporting_manager",
  approverValue: "",
  isConditional: false,
  conditionField: "",
  conditionOperator: ">",
  conditionValue: "",
  isOptional: false,
  autoApproveHours: 0,
};

// ── Step Builder ──────────────────────────────────────────────────────────────
function StepRow({ step, index, onChange, onRemove, users }) {
  const [showCondition, setShowCondition] = useState(step.isConditional);

  const update = (field, value) => onChange(index, { ...step, [field]: value });

  return (
    <div
      style={{
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent)",
            background: "var(--accent-glow)",
            padding: "4px 12px",
            borderRadius: 20,
            border: "1px solid rgba(0,212,255,0.2)",
          }}
        >
          Step {index + 1}
        </span>
        <button
          onClick={() => onRemove(index)}
          style={{
            background: "rgba(255,71,87,0.1)",
            border: "1px solid rgba(255,71,87,0.3)",
            borderRadius: 8,
            padding: "4px 10px",
            cursor: "pointer",
            color: "var(--danger)",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Trash2 size={13} /> Remove
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Step Name */}
        <div className="form-group">
          <label className="form-label">Step Name *</label>
          <input
            className="form-input"
            value={step.stepName}
            onChange={(e) => update("stepName", e.target.value)}
            placeholder="e.g. HOD Approval, IT Head Review"
          />
        </div>

        {/* Approver Type */}
        <div className="form-group">
          <label className="form-label">Approver Type *</label>
          <select
            className="form-input"
            value={step.approverType}
            onChange={(e) => update("approverType", e.target.value)}
          >
            {APPROVER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Approver Value — shown only for specific_user or role */}
        {step.approverType === "specific_user" && (
          <div className="form-group">
            <label className="form-label">Select User *</label>
            <select
              className="form-input"
              value={step.approverValue}
              onChange={(e) => update("approverValue", e.target.value)}
            >
              <option value="">-- Select User --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {step.approverType === "role" && (
          <div className="form-group">
            <label className="form-label">Select Role *</label>
            <select
              className="form-input"
              value={step.approverValue}
              onChange={(e) => update("approverValue", e.target.value)}
            >
              <option value="">-- Select Role --</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {step.approverType === "reporting_manager" && (
          <div className="form-group">
            <label className="form-label">Approver</label>
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(0,212,255,0.05)",
                border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--accent)",
              }}
            >
              ✓ Auto-resolved: Requester's direct reporting manager
            </div>
          </div>
        )}

        {/* Auto-approve hours */}
        <div className="form-group">
          <label className="form-label">Auto-approve after (hours)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            value={step.autoApproveHours}
            onChange={(e) =>
              update("autoApproveHours", parseInt(e.target.value) || 0)
            }
            placeholder="0 = disabled"
          />
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 4,
              display: "block",
            }}
          >
            Set 0 to disable auto-approval
          </span>
        </div>
      </div>

      {/* Optional toggle */}
      <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <input
            type="checkbox"
            checked={step.isOptional}
            onChange={(e) => update("isOptional", e.target.checked)}
          />
          Optional step (workflow continues even if rejected)
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <input
            type="checkbox"
            checked={step.isConditional}
            onChange={(e) => {
              update("isConditional", e.target.checked);
              setShowCondition(e.target.checked);
            }}
          />
          Add condition (skip step if condition not met)
        </label>
      </div>

      {/* Condition Builder */}
      {step.isConditional && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: "rgba(255,183,3,0.05)",
            border: "1px solid rgba(255,183,3,0.2)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--warning)",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            ⚡ CONDITION — This step runs only when:
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 10,
              alignItems: "end",
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Field</label>
              <select
                className="form-input"
                value={step.conditionField}
                onChange={(e) => update("conditionField", e.target.value)}
              >
                <option value="">Select field...</option>
                <option value="currentValue">Asset Current Value (₹)</option>
                <option value="purchasePrice">Purchase Price (₹)</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Operator</label>
              <select
                className="form-input"
                value={step.conditionOperator}
                onChange={(e) => update("conditionOperator", e.target.value)}
              >
                {CONDITION_OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Value</label>
              <input
                className="form-input"
                value={step.conditionValue}
                onChange={(e) => update("conditionValue", e.target.value)}
                placeholder="e.g. 50000"
              />
            </div>
          </div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}
          >
            Example: If field = "currentValue", operator = "&gt;", value =
            "50000" → step runs only when asset value &gt; ₹50,000
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template Form Modal ───────────────────────────────────────────────────────
function TemplateModal({ template, users, onClose }) {
  const isEdit = !!template?.id;
  const [form, setForm] = useState({
    name: template?.name || "",
    description: template?.description || "",
    module: template?.module || "asset_assignment",
    isActive: template?.isActive !== false,
    steps: template?.ApprovalTemplateSteps?.length
      ? template.ApprovalTemplateSteps.map((s) => ({
          stepName: s.stepName,
          approverType: s.approverType,
          approverValue: s.approverValue || "",
          isConditional: s.isConditional,
          conditionField: s.conditionField || "",
          conditionOperator: s.conditionOperator || ">",
          conditionValue: s.conditionValue || "",
          isOptional: s.isOptional,
          autoApproveHours: s.autoApproveHours || 0,
        }))
      : [{ ...emptyStep }],
  });
  const [loading, setLoading] = useState(false);

  const addStep = () =>
    setForm((f) => ({ ...f, steps: [...f.steps, { ...emptyStep }] }));
  const removeStep = (i) =>
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  const updateStep = (i, step) =>
    setForm((f) => {
      const steps = [...f.steps];
      steps[i] = step;
      return { ...f, steps };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting template form =>", form);
    if (!form.name || !form.module)
      return toast.error("Name and module are required");
    if (form.steps.length === 0)
      return toast.error("At least one step is required");
    for (const s of form.steps) {
      if (!s.stepName) return toast.error("All steps must have a name");
      if (s.approverType === "specific_user" && !s.approverValue)
        return toast.error('Please select a user for "Specific User" steps');
      if (s.approverType === "role" && !s.approverValue)
        return toast.error('Please select a role for "Role Based" steps');
    }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/approval-templates/${template.id}`, form);
        toast.success("Template updated!");
      } else {
        await api.post("/approval-templates", form);
        toast.success("Template created!");
      }
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div
        className="modal"
        style={{ maxWidth: 780, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div
          className="modal-header"
          style={{
            position: "sticky",
            top: 0,
            background: "var(--bg-card)",
            zIndex: 10,
          }}
        >
          <h2 className="modal-title">
            {isEdit ? "Edit" : "Create"} Approval Template
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
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* Basic Info */}
          <div
            style={{
              background: "var(--bg-hover)",
              borderRadius: 12,
              padding: 16,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 600,
                marginBottom: 14,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Template Info
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="form-group">
                <label className="form-label">Template Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Asset Assignment Approval"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Module *</label>
                <select
                  className="form-input"
                  value={form.module}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, module: e.target.value }))
                  }
                >
                  {MODULES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Brief description of this approval workflow..."
                />
              </div>
              {isEdit && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        isActive: e.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  Approval Chain
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Steps are executed in order — top to bottom
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addStep}
              >
                <Plus size={14} /> Add Step
              </button>
            </div>

            {form.steps.map((step, i) => (
              <StepRow
                key={i}
                step={step}
                index={i}
                onChange={updateStep}
                onRemove={removeStep}
                users={users}
              />
            ))}

            {form.steps.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "28px",
                  background: "var(--bg-hover)",
                  borderRadius: 12,
                  border: "2px dashed var(--border)",
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                No steps yet. Click "Add Step" to build your approval chain.
              </div>
            )}
          </div>

          {/* Flow preview */}
          {form.steps.length > 0 && (
            <div
              style={{
                padding: 14,
                background: "rgba(0,212,255,0.03)",
                border: "1px solid rgba(0,212,255,0.15)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--accent)",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                WORKFLOW PREVIEW
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    padding: "4px 10px",
                    background: "var(--bg-hover)",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                  }}
                >
                  Request Created
                </span>
                {form.steps.map((s, i) => (
                  <React.Fragment key={i}>
                    <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
                      →
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: "var(--accent-glow)",
                        color: "var(--accent)",
                        border: "1px solid rgba(0,212,255,0.2)",
                      }}
                    >
                      {s.stepName || `Step ${i + 1}`}
                      {s.isConditional && " ⚡"}
                      {s.isOptional && " (optional)"}
                    </span>
                  </React.Fragment>
                ))}
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  →
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--success)",
                    padding: "4px 10px",
                    background: "rgba(0,214,143,0.1)",
                    borderRadius: 20,
                    border: "1px solid rgba(0,214,143,0.3)",
                  }}
                >
                  ✓ Approved
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
              position: "sticky",
              bottom: 0,
              background: "var(--bg-card)",
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
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Template"
              ) : (
                "Create Template"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApprovalTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([
        api.get("/approval-templates"),
        api.get("/users"),
      ]);
      setTemplates(tRes.data.data || []);
      setUsers(uRes.data.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    try {
      await api.delete(`/approval-templates/${id}`);
      toast.success("Template deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const moduleLabel = (val) =>
    MODULES.find((m) => m.value === val)?.label || val;

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
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            Approval Configuration
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Define approval workflows for each module
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditTemplate(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Info Banner */}
      <div
        style={{
          padding: 14,
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: 10,
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        <strong style={{ color: "var(--accent)" }}>💡 How it works:</strong>{" "}
        Create one template per module (e.g. "Asset Assignment"). When that
        action is triggered, the approval chain starts automatically. If no
        template is set for a module, the action executes directly without
        approval.
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : templates.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "60px 20px" }}
        >
          <Shield
            size={52}
            color="var(--accent)"
            style={{ marginBottom: 16, opacity: 0.4 }}
          />
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>
            No Templates Configured
          </h3>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            Create your first approval workflow template to get started.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditTemplate(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Create First Template
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="card"
              style={{ padding: 0, overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setExpandedId(expandedId === tmpl.id ? null : tmpl.id)
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: tmpl.isActive
                        ? "var(--accent-glow)"
                        : "var(--bg-hover)",
                      border: `1px solid ${tmpl.isActive ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Shield
                      size={20}
                      color={
                        tmpl.isActive ? "var(--accent)" : "var(--text-muted)"
                      }
                    />
                  </div>
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 15 }}>
                        {tmpl.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: tmpl.isActive
                            ? "rgba(0,214,143,0.1)"
                            : "rgba(255,71,87,0.1)",
                          color: tmpl.isActive
                            ? "var(--success)"
                            : "var(--danger)",
                          fontWeight: 600,
                          border: `1px solid ${tmpl.isActive ? "rgba(0,214,143,0.3)" : "rgba(255,71,87,0.3)"}`,
                        }}
                      >
                        {tmpl.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {moduleLabel(tmpl.module)} ·{" "}
                      {tmpl.ApprovalTemplateSteps?.length || 0} step(s)
                      {tmpl.description && ` · ${tmpl.description}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTemplate(tmpl);
                      setModalOpen(true);
                    }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tmpl.id);
                    }}
                    style={{
                      background: "rgba(255,71,87,0.1)",
                      border: "1px solid rgba(255,71,87,0.3)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      cursor: "pointer",
                      color: "var(--danger)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                  {expandedId === tmpl.id ? (
                    <ChevronUp size={16} color="var(--text-muted)" />
                  ) : (
                    <ChevronDown size={16} color="var(--text-muted)" />
                  )}
                </div>
              </div>

              {expandedId === tmpl.id &&
                tmpl.ApprovalTemplateSteps?.length > 0 && (
                  <div
                    style={{
                      padding: "0 20px 20px",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        margin: "14px 0 10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Approval Chain
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {tmpl.ApprovalTemplateSteps.sort(
                        (a, b) => a.stepOrder - b.stepOrder,
                      ).map((step, i) => (
                        <div
                          key={step.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "var(--accent-glow)",
                              border: "1px solid rgba(0,212,255,0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--accent)",
                              flexShrink: 0,
                            }}
                          >
                            {step.stepOrder}
                          </div>
                          <div
                            style={{
                              flex: 1,
                              padding: "8px 14px",
                              background: "var(--bg-hover)",
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {step.stepName}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                marginTop: 3,
                              }}
                            >
                              {
                                APPROVER_TYPES.find(
                                  (t) => t.value === step.approverType,
                                )?.label
                              }
                              {step.approverValue && ` — ${step.approverValue}`}
                              {step.isConditional && (
                                <span
                                  style={{
                                    color: "var(--warning)",
                                    marginLeft: 8,
                                  }}
                                >
                                  ⚡ Conditional: {step.conditionField}{" "}
                                  {step.conditionOperator} {step.conditionValue}
                                </span>
                              )}
                              {step.isOptional && (
                                <span
                                  style={{
                                    color: "var(--text-muted)",
                                    marginLeft: 8,
                                  }}
                                >
                                  (optional)
                                </span>
                              )}
                              {step.autoApproveHours > 0 && (
                                <span
                                  style={{
                                    color: "var(--accent)",
                                    marginLeft: 8,
                                  }}
                                >
                                  ⏱ Auto-approve after {step.autoApproveHours}h
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <TemplateModal
          template={editTemplate}
          users={users}
          onClose={(refresh) => {
            setModalOpen(false);
            setEditTemplate(null);
            if (refresh) fetchData();
          }}
        />
      )}
    </div>
  );
}
