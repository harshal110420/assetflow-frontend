import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLocations } from "../store/slices/permissionSlice";
import { Plus, Edit2, Trash2, MapPin, X, Save } from "lucide-react";
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
          <h2 className="modal-title">
            {location?.id ? "Edit Location" : "New Location"}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

export default function LocationsPage() {
  const dispatch = useDispatch();
  const { locations } = useSelector((s) => s.permissions);
  const { can } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);

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

  const canNew = can("locations", "new");
  const canEdit = can("locations", "edit");
  const canDelete = can("locations", "delete");

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {locations.map((loc) => (
          <div key={loc.id} className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(0,212,255,0.1)",
                    border: "1px solid rgba(0,212,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin size={18} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {loc.name}
                  </div>
                  {loc.code && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      {loc.code}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {canEdit && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditLocation(loc);
                      setShowModal(true);
                    }}
                  >
                    <Edit2 size={13} />
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(loc)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            {loc.address && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 10,
                  marginBottom: 0,
                  lineHeight: 1.5,
                }}
              >
                {loc.address}
              </p>
            )}
          </div>
        ))}

        {locations.length === 0 && (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--text-muted)",
              gridColumn: "1/-1",
            }}
          >
            <MapPin size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No locations yet.</p>
            {canNew && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => setShowModal(true)}
              >
                Add first location
              </button>
            )}
          </div>
        )}
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
