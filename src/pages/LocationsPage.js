import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLocations } from "../store/slices/permissionSlice";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  X,
  Save,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { usePermission } from "../hooks/usePermission";

function LocationModal({ location, onClose }) {
  const [form, setForm] = useState({
    name: location?.name || "",
    code: location?.code || "",
    address: location?.address || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Location name required");
    setSaving(true);
    try {
      if (location?.id) {
        await api.put(`/locations/${location.id}`, form);
      } else {
        await api.post("/locations", form);
      }
      toast.success(`Location ${location?.id ? "updated" : "created"}!`);
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MapPin size={20} color="var(--accent)" />
            <h2 className="modal-title">
              {location?.id ? "Edit Location" : "New Location"}
            </h2>
          </div>
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
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div className="form-group">
            <label className="form-label">Location Name *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Plant 1, Warehouse, Head Office"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location Code</label>
            <input
              className="form-input"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. PLT1, WH1, HO"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              placeholder="Full address (optional)"
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
              className="btn btn-secondary"
              onClick={() => onClose(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={14} style={{ marginRight: 4 }} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column)
    return <ChevronUp size={13} style={{ opacity: 0.3 }} />;
  return sortConfig.direction === "asc" ? (
    <ChevronUp size={13} style={{ color: "var(--accent)" }} />
  ) : (
    <ChevronDown size={13} style={{ color: "var(--accent)" }} />
  );
}

export default function LocationsPage() {
  const dispatch = useDispatch();
  const { locations } = useSelector((s) => s.permissions);
  const { can } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "active" | "inactive"
  const [filterAddress, setFilterAddress] = useState("all"); // "all" | "with_address" | "without_address"
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const canNew = can("locations", "new");
  const canEdit = can("locations", "edit");
  const canDelete = can("locations", "delete");

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  const handleDelete = async (loc) => {
    if (!window.confirm(`Delete location "${loc.name}"?`)) return;
    try {
      await api.delete(`/locations/${loc.id}`);
      toast.success("Location deleted");
      dispatch(fetchLocations());
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const filtered = locations
    .filter((loc) => {
      const q = search.toLowerCase();
      const matchSearch =
        loc.name?.toLowerCase().includes(q) ||
        loc.code?.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q);

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && loc.isActive !== false) ||
        (filterStatus === "inactive" && loc.isActive === false);

      const matchAddress =
        filterAddress === "all" ||
        (filterAddress === "with_address" && loc.address) ||
        (filterAddress === "without_address" && !loc.address);

      return matchSearch && matchStatus && matchAddress;
    })
    .sort((a, b) => {
      const aVal = (a[sortConfig.key] || "").toLowerCase();
      const bVal = (b[sortConfig.key] || "").toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const thStyle = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    background: "var(--surface)",
  };

  const tdStyle = {
    padding: "11px 14px",
    fontSize: 13,
    color: "var(--text)",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
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
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Locations</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
            Manage company locations — {locations.length} total
          </p>
        </div>
        {canNew && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditLocation(null);
              setShowModal(true);
            }}
          >
            <Plus size={18} /> New Location
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
            placeholder="Search by name, code, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Filter size={13} style={{ color: "var(--text-muted)" }} />
          <select
            className="form-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ fontSize: 13, padding: "6px 10px", minWidth: 130 }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <select
            className="form-input"
            value={filterAddress}
            onChange={(e) => setFilterAddress(e.target.value)}
            style={{ fontSize: 13, padding: "6px 10px", minWidth: 150 }}
          >
            <option value="all">All Locations</option>
            <option value="with_address">With Address</option>
            <option value="without_address">Without Address</option>
          </select>
        </div>

        <span
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          {filtered.length} location{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 44 }}>#</th>
                <th style={thStyle} onClick={() => handleSort("name")}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <MapPin size={13} /> Location Name
                    <SortIcon column="name" sortConfig={sortConfig} />
                  </div>
                </th>
                <th style={thStyle} onClick={() => handleSort("code")}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    Code <SortIcon column="code" sortConfig={sortConfig} />
                  </div>
                </th>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>Status</th>
                {(canEdit || canDelete) && (
                  <th
                    style={{
                      ...thStyle,
                      textAlign: "right",
                      cursor: "default",
                    }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc, idx) => (
                <tr
                  key={loc.id}
                  style={{
                    background:
                      idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--hover, rgba(255,255,255,0.05))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)")
                  }
                >
                  <td
                    style={{
                      ...tdStyle,
                      color: "var(--text-muted)",
                      fontSize: 12,
                      width: 44,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "rgba(0,212,255,0.1)",
                          border: "1px solid rgba(0,212,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MapPin size={14} color="var(--accent)" />
                      </div>
                      <span style={{ fontWeight: 600 }}>{loc.name}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {loc.code ? (
                      <code
                        style={{
                          background: "var(--bg-hover, rgba(0,212,255,0.08))",
                          color: "var(--accent)",
                          padding: "2px 8px",
                          borderRadius: 5,
                          fontSize: 12,
                          border: "1px solid rgba(0,212,255,0.2)",
                          fontWeight: 600,
                        }}
                      >
                        {loc.code}
                      </code>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 220 }}>
                    {loc.address ? (
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--text-muted)",
                        }}
                      >
                        {loc.address}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          loc.isActive !== false
                            ? "rgba(0,214,143,0.12)"
                            : "var(--bg-hover)",
                        color:
                          loc.isActive !== false
                            ? "var(--success, #00d68f)"
                            : "var(--text-muted)",
                        border: `1px solid ${loc.isActive !== false ? "rgba(0,214,143,0.3)" : "var(--border)"}`,
                      }}
                    >
                      {loc.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td style={{ ...tdStyle, textAlign: "right" }}>
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
                            onClick={() => {
                              setEditLocation(loc);
                              setShowModal(true);
                            }}
                            title="Edit location"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(loc)}
                            title="Delete location"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "48px 20px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <MapPin
                      size={36}
                      style={{
                        opacity: 0.25,
                        display: "block",
                        margin: "0 auto 10px",
                      }}
                    />
                    <p>
                      {search
                        ? "No locations match your search or filters."
                        : "No locations yet."}
                    </p>
                    {!search && canNew && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 12 }}
                        onClick={() => setShowModal(true)}
                      >
                        Add first location
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <LocationModal
          location={editLocation}
          onClose={(saved) => {
            setShowModal(false);
            setEditLocation(null);
            if (saved) dispatch(fetchLocations());
          }}
        />
      )}
    </div>
  );
}
