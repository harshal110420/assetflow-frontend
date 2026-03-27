import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategories,
  fetchSubCategories,
} from "../../store/slices/categroySlice";
import { createAsset, updateAsset } from "../../store/slices/assetSlice";
import { fetchDepartments } from "../../store/slices/departmentSlice";
import { fetchBrands } from "../../store/slices/brandSlice";
import { fetchVendors } from "../../store/slices/vendorSlice";
import { X, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUSES = [
  "Active",
  "Inactive",
  "In Maintenance",
  "Disposed",
  "Lost",
  "Reserved",
];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Damaged"];

// ─── Config type suggestions per category keyword ─────────────────────────────
// Ye sirf suggestions hain — user koi bhi key likh sakta hai
const CONFIG_SUGGESTIONS = {
  default: [
    { key: "Internet Access", value: "Yes" },
    { key: "Network Type", value: "WiFi" },
  ],
  laptop: [
    { key: "OS", value: "Windows 11" },
    { key: "Office Suite", value: "Microsoft 365" },
    { key: "Antivirus", value: "Seqrite" },
    { key: "Internet Access", value: "Yes" },
    { key: "Network Type", value: "WiFi" },
  ],
  desktop: [
    { key: "OS", value: "Windows 11" },
    { key: "Office Suite", value: "Microsoft 365" },
    { key: "Antivirus", value: "Seqrite" },
    { key: "Internet Access", value: "Yes" },
    { key: "Network Type", value: "LAN" },
  ],
  mobile: [
    { key: "OS", value: "Android 14" },
    { key: "SIM", value: "Airtel" },
    { key: "Data Plan", value: "Active" },
    { key: "Internet Access", value: "Yes" },
  ],
  server: [
    { key: "OS", value: "Ubuntu 22.04" },
    { key: "RAM Config", value: "32 GB" },
    { key: "Storage Config", value: "1 TB SSD" },
    { key: "Internet Access", value: "Yes" },
    { key: "Network Type", value: "LAN" },
  ],
  printer: [
    { key: "Driver", value: "Installed" },
    { key: "Network Printer", value: "Yes" },
    { key: "Paper Size", value: "A4" },
  ],
  vehicle: [
    { key: "Fuel Type", value: "Diesel" },
    { key: "Insurance", value: "Active" },
    { key: "RC", value: "Active" },
  ],
  ac: [
    { key: "Tonnage", value: "1.5 Ton" },
    { key: "AMC Plan", value: "Active" },
  ],
};

// Get suggestions based on asset category/subcategory name
function getSuggestions(categoryName = "", subCategoryName = "") {
  const name = (subCategoryName || categoryName || "").toLowerCase();
  if (name.includes("laptop")) return CONFIG_SUGGESTIONS.laptop;
  if (name.includes("desktop")) return CONFIG_SUGGESTIONS.desktop;
  if (name.includes("mobile") || name.includes("phone"))
    return CONFIG_SUGGESTIONS.mobile;
  if (name.includes("server")) return CONFIG_SUGGESTIONS.server;
  if (name.includes("printer")) return CONFIG_SUGGESTIONS.printer;
  if (name.includes("vehicle") || name.includes("car") || name.includes("bike"))
    return CONFIG_SUGGESTIONS.vehicle;
  if (name.includes("ac") || name.includes("air")) return CONFIG_SUGGESTIONS.ac;
  return CONFIG_SUGGESTIONS.default;
}

// ─── Configuration Tab Component ─────────────────────────────────────────────
function ConfigurationTab({
  configFields,
  setConfigFields,
  categoryName,
  subCategoryName,
}) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const suggestions = getSuggestions(categoryName, subCategoryName);

  // Add a new field
  const handleAdd = () => {
    const key = newKey.trim();
    if (!key) return toast.error("Key (field name) is required");
    if (configFields.some((f) => f.key.toLowerCase() === key.toLowerCase()))
      return toast.error("This field already exists");
    setConfigFields((prev) => [...prev, { key, value: newValue.trim() }]);
    setNewKey("");
    setNewValue("");
  };

  // Remove a field
  const handleRemove = (index) => {
    setConfigFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Edit a field value inline
  const handleValueChange = (index, val) => {
    setConfigFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, value: val } : f)),
    );
  };

  // Add suggestion (if not already added)
  const handleSuggestion = (sug) => {
    if (
      configFields.some((f) => f.key.toLowerCase() === sug.key.toLowerCase())
    ) {
      toast.error(`"${sug.key}" already added`);
      return;
    }
    setConfigFields((prev) => [...prev, { ...sug }]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Info note ── */}
      <div
        style={{
          background: "var(--accent-glow)",
          border: "1px solid rgba(0,212,255,0.2)",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        💡 Add any configuration details for this asset — OS, Software, Network,
        License, etc. These will appear on the Asset Handover Letter PDF.
        <br />
        All fields are{" "}
        <strong style={{ color: "var(--accent)" }}>optional</strong> — add only
        what's relevant.
      </div>

      {/* ── Quick suggestions ── */}
      {suggestions.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Quick Add
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suggestions.map((sug) => {
              const alreadyAdded = configFields.some(
                (f) => f.key.toLowerCase() === sug.key.toLowerCase(),
              );
              return (
                <button
                  key={sug.key}
                  type="button"
                  onClick={() => handleSuggestion(sug)}
                  disabled={alreadyAdded}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: alreadyAdded ? "not-allowed" : "pointer",
                    border: "1px solid var(--border)",
                    background: alreadyAdded
                      ? "var(--bg-hover)"
                      : "var(--bg-secondary)",
                    color: alreadyAdded
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                    opacity: alreadyAdded ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {alreadyAdded ? "✓ " : "+ "}
                  {sug.key}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Existing fields ── */}
      {configFields.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Configuration Fields ({configFields.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {configFields.map((field, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr auto",
                  gap: 8,
                  alignItems: "center",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
              >
                {/* Key — read only */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--accent)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {field.key}
                </span>

                {/* Value — editable */}
                <input
                  className="form-input"
                  value={field.value}
                  onChange={(e) => handleValueChange(i, e.target.value)}
                  placeholder="Enter value..."
                  style={{ fontSize: 13, padding: "6px 10px" }}
                />

                {/* Remove button */}
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(i)}
                  title="Remove"
                  style={{ padding: "6px 8px" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add custom field ── */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          Add Custom Field
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr auto",
            gap: 8,
            alignItems: "center",
          }}
        >
          <input
            className="form-input"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Field name (e.g. OS)"
            style={{ fontSize: 13 }}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAdd())
            }
          />
          <input
            className="form-input"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value (e.g. Windows 11)"
            style={{ fontSize: 13 }}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAdd())
            }
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "8px 12px",
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
          Press Enter or click Add. Examples: OS, Antivirus, WiFi, AMC Plan,
          Insurance, Fuel Type...
        </p>
      </div>

      {/* Empty state */}
      {configFields.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "24px",
            color: "var(--text-muted)",
            fontSize: 13,
            border: "1px dashed var(--border)",
            borderRadius: 10,
          }}
        >
          No configuration added yet. Use Quick Add or add custom fields above.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSET MODAL
// ═════════════════════════════════════════════════════════════════════════════
export default function AssetModal({ asset, onClose }) {
  const dispatch = useDispatch();
  const isEdit = !!asset;

  const { departments } = useSelector((s) => s.departments);
  const { brands } = useSelector((s) => s.brands);
  const { vendors } = useSelector((s) => s.vendors);
  const { categories, subCategories } = useSelector((s) => s.categories);

  // ── Parse existing customFields from asset ────────────────────────────────
  const parseCustomFields = (cf) => {
    if (!cf) return [];
    if (typeof cf === "string") {
      try {
        cf = JSON.parse(cf);
      } catch {
        return [];
      }
    }
    if (typeof cf === "object" && !Array.isArray(cf)) {
      // Object format: { OS: "Win 10", ... } → array format
      return Object.entries(cf).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
    if (Array.isArray(cf)) return cf;
    return [];
  };

  const [form, setForm] = useState({
    name: asset?.name || "",
    categoryId:
      asset?.categoryId?.toString() || asset?.category?.id?.toString() || "",
    subCategoryId:
      asset?.subCategoryId?.toString() ||
      asset?.subCategory?.id?.toString() ||
      "",
    description: asset?.description || "",
    brandId: asset?.brandId || "",
    vendorId: asset?.vendorId || "",
    model: asset?.model || "",
    serialNumber: asset?.serialNumber || "",
    status: asset?.status || "Active",
    condition: asset?.condition || "Good",
    locationId: asset?.locationId?.toString() || "",
    departmentId: asset?.departmentId?.toString() || "",
    purchaseDate: asset?.purchaseDate ? asset.purchaseDate.split("T")[0] : "",
    purchasePrice: asset?.purchasePrice || "",
    currentValue: asset?.currentValue || "",
    warrantyExpiry: asset?.warrantyExpiry
      ? asset.warrantyExpiry.split("T")[0]
      : "",
    notes: asset?.notes || "",
  });

  // configFields — separate state, array of { key, value }
  const [configFields, setConfigFields] = useState(
    parseCustomFields(asset?.customFields),
  );

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("basic");
  const [locations, setLocations] = useState([]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get("/locations")
      .then((res) => setLocations(res.data.data || []))
      .catch(() => {});
    dispatch(fetchCategories());
    dispatch(fetchSubCategories());
    dispatch(fetchDepartments());
    dispatch(fetchBrands());
    dispatch(fetchVendors());
  }, [dispatch]);

  // ── SubCategory validate-and-reset ───────────────────────────────────────
  useEffect(() => {
    if (!form.categoryId) {
      setForm((f) => ({ ...f, subCategoryId: "" }));
      return;
    }
    if (subCategories.length === 0) return;

    const matchingSubs = subCategories.filter(
      (s) => s.categoryId.toString() === form.categoryId.toString(),
    );
    const currentSubBelongsToCategory = matchingSubs.some(
      (s) => s.id.toString() === form.subCategoryId.toString(),
    );
    if (!currentSubBelongsToCategory) {
      setForm((f) => ({ ...f, subCategoryId: "" }));
    }
  }, [form.categoryId, subCategories]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // ── Warranty Duration Options ─────────────────────────────────────────────
  const WARRANTY_DURATIONS = [
    { label: "1 Month", months: 1 },
    { label: "3 Months", months: 3 },
    { label: "6 Months", months: 6 },
    { label: "9 Months", months: 9 },
    { label: "1 Year", months: 12 },
    { label: "18 Months", months: 18 },
    { label: "2 Years", months: 24 },
    { label: "3 Years", months: 36 },
  ];

  const handleWarrantyDuration = (months) => {
    if (!months) return; // Custom selected — manual input
    const base = form.purchaseDate ? new Date(form.purchaseDate) : new Date();
    base.setMonth(base.getMonth() + months);
    base.setDate(base.getDate() - 1); // Last valid day (31-03-2026 not 01-04-2026)
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    setForm((f) => ({ ...f, warrantyExpiry: `${yyyy}-${mm}-${dd}` }));
  };

  // ── Get category/subcategory names for suggestions ────────────────────────
  const selectedCategory = categories.find(
    (c) => c.id.toString() === form.categoryId.toString(),
  );
  const selectedSubCategory = subCategories.find(
    (s) => s.id.toString() === form.subCategoryId.toString(),
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.categoryId)
      return toast.error("Name and category are required");

    // Convert configFields array → object for storage
    const customFields =
      configFields.length > 0
        ? configFields.reduce((acc, { key, value }) => {
            if (key.trim()) acc[key.trim()] = value.trim();
            return acc;
          }, {})
        : null;

    setLoading(true);
    try {
      const payload = { ...form, customFields };
      const action = isEdit
        ? updateAsset({ id: asset.id, ...payload })
        : createAsset(payload);
      const result = await dispatch(action);
      if (result.error) throw new Error(result.payload);
      toast.success(isEdit ? "Asset updated!" : "Asset created!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save asset");
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (t) => ({
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    background: tab === t ? "var(--accent-glow)" : "transparent",
    color: tab === t ? "var(--accent)" : "var(--text-muted)",
    border:
      tab === t ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
    cursor: "pointer",
  });

  // Config tab badge — shows count of fields added
  const configCount = configFields.length;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "Edit Asset" : "Add New Asset"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["basic", "financial", "configuration", "details"].map((t) => (
            <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {/* Badge on configuration tab */}
              {t === "configuration" && configCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: "var(--accent)",
                    color: "var(--bg-primary)",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 999,
                  }}
                >
                  {configCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* ════════════════════════════════════ BASIC TAB ════════════════════ */}
          {tab === "basic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Asset Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="MacBook Pro 16"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={form.categoryId}
                    onChange={set("categoryId")}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.categoryId && (
                <div className="form-group">
                  <label className="form-label">Sub Category</label>
                  <select
                    className="form-select"
                    value={form.subCategoryId}
                    onChange={set("subCategoryId")}
                  >
                    <option value="">-- Select Sub Category --</option>
                    {subCategories
                      .filter(
                        (s) =>
                          s.categoryId.toString() ===
                            form.categoryId.toString() && s.isActive,
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id.toString()}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  {subCategories.filter(
                    (s) =>
                      s.categoryId.toString() === form.categoryId.toString() &&
                      s.isActive,
                  ).length === 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      No subcategories for this category
                    </span>
                  )}
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <select
                    className="form-select"
                    value={form.brandId}
                    onChange={set("brandId")}
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    className="form-input"
                    value={form.model}
                    onChange={set("model")}
                    placeholder="MacBook Pro M3 16"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input
                    className="form-input"
                    value={form.serialNumber}
                    onChange={set("serialNumber")}
                    placeholder="SN-XXXXX"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={set("status")}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select
                    className="form-select"
                    value={form.condition}
                    onChange={set("condition")}
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Location</label>
                  <select
                    className="form-select"
                    value={form.locationId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, locationId: e.target.value }))
                    }
                  >
                    <option value="">-- Select Location --</option>
                    {locations
                      .filter((l) => l.isActive)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                          {l.code ? ` (${l.code})` : ""}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Owning Department</label>
                <select
                  className="form-select"
                  value={form.departmentId}
                  onChange={set("departmentId")}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.code ? ` (${d.code})` : ""}
                      {d.division?.name ? ` — ${d.division.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={set("description")}
                  rows={3}
                  placeholder="Asset description..."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════ FINANCIAL TAB ════════════════ */}
          {tab === "financial" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.purchaseDate}
                    onChange={set("purchaseDate")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.purchasePrice}
                    onChange={set("purchasePrice")}
                    placeholder="1999.99"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Current Value (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.currentValue}
                    onChange={set("currentValue")}
                    placeholder="1500.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Warranty</label>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <select
                      className="form-select"
                      defaultValue=""
                      onChange={(e) =>
                        handleWarrantyDuration(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      style={{ flex: "0 0 150px" }}
                    >
                      <option value="">-- Duration --</option>
                      {WARRANTY_DURATIONS.map((d) => (
                        <option key={d.label} value={d.months}>
                          {d.label}
                        </option>
                      ))}
                      <option value="">Custom</option>
                    </select>
                    <span style={{ color: "var(--text-muted)" }}>→</span>
                    <input
                      className="form-input"
                      type="date"
                      value={form.warrantyExpiry}
                      onChange={set("warrantyExpiry")}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    Select a duration to auto-fill the expiry date, or enter the date manually.
                  </p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Vendor</label>
                <select
                  className="form-select"
                  value={form.vendorId}
                  onChange={set("vendorId")}
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.contactPerson ? ` — ${v.contactPerson}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ════════════════════════════════ CONFIGURATION TAB ════════════════ */}
          {tab === "configuration" && (
            <ConfigurationTab
              configFields={configFields}
              setConfigFields={setConfigFields}
              categoryName={selectedCategory?.name || ""}
              subCategoryName={selectedSubCategory?.name || ""}
            />
          )}

          {/* ════════════════════════════════════ DETAILS TAB ══════════════════ */}
          {tab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  value={form.notes}
                  onChange={set("notes")}
                  rows={6}
                  placeholder="Additional notes, special instructions, or relevant information..."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
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
              ) : isEdit ? (
                "Update Asset"
              ) : (
                "Create Asset"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
