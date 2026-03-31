import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchAssets,
  deleteAsset,
  setFilters,
  clearFilters,
} from "../store/slices/assetSlice";
import { fetchCategories } from "../store/slices/categroySlice";
import { fetchDepartments } from "../store/slices/departmentSlice";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Package,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import AssetModal from "../components/assets/AssetModal";
import { usePermission } from "../hooks/usePermission";
import api from "../services/api";
import { highlight } from "../utils/highlight";

const STATUSES = [
  "Active",
  "Inactive",
  "In Maintenance",
  "Disposed",
  "Lost",
  "Reserved",
];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Damaged"];

// ─── Helper: check karo ki is asset ka approved assignment hai ─────────────────
// Approval "approved" matlab asset.assignmentType === "employee"
// AND latest ApprovalRequest for this asset ka status === "approved"
// Hum asset object mein latestApproval include karte hain (backend se)
function isHandoverMailEnabled(asset) {
  if (asset.assignmentType !== "employee") return false;
  if (!asset.assignedToId) return false;

  // ✅ approvalRequests array aayega (separate: true ke saath)
  const approvals = asset.approvalRequests;

  // Koi approval request nahi — autoApproved tha
  if (!approvals || approvals.length === 0) return true;

  // Latest request ka status check karo
  return approvals[0].status === "approved";
}

export default function AssetsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { assets, isLoading, pagination, filters } = useSelector(
    (s) => s.assets,
  );
  const { departments } = useSelector((s) => s.departments);
  const { categories } = useSelector((s) => s.categories);
  const { can } = usePermission();

  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [localSearch, setLocalSearch] = useState(
    filters.search || searchParams.get("search") || "",
  );
  const [currentPage, setCurrentPage] = useState(1);

  // ── Sending state — per asset ─────────────────────────────────────────────
  const [sendingMailId, setSendingMailId] = useState(null);

  const canCreate = can("asset_master", "new");
  const canEdit = can("asset_master", "edit");
  const canDelete = can("asset_master", "delete");

  const loadAssets = useCallback(() => {
    dispatch(fetchAssets({ ...filters, page: currentPage, limit: 20 }));
  }, [dispatch, filters, currentPage]);

  function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const timer = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
  }

  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    dispatch(setFilters({ search: debouncedSearch }));
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);
  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setLocalSearch(urlSearch);
      dispatch(setFilters({ search: urlSearch }));
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: localSearch }));
    setCurrentPage(1);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this asset? This action cannot be undone."))
      return;
    const result = await dispatch(deleteAsset(id));
    if (!result.error) toast.success("Asset deleted");
    else toast.error("Failed to delete asset");
  };

  const handleEdit = (asset, e) => {
    e.stopPropagation();
    setEditAsset(asset);
    setShowModal(true);
  };

  // ── Send Handover Mail ────────────────────────────────────────────────────
  const handleSendMail = async (asset, e) => {
    e.stopPropagation();
    setSendingMailId(asset.id);
    try {
      const res = await api.post(`/assets/${asset.id}/send-handover-mail`);
      if (res.data.success) {
        toast.success(`✉️ Handover mail sent to ${res.data.data.sentTo}`);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send handover mail",
      );
    } finally {
      setSendingMailId(null);
    }
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
          <h2
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Asset Inventory
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
            {pagination.total} total assets
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadAssets}>
            <RefreshCw size={15} /> Refresh
          </button>
          {canCreate && (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/assets/new")}
            >
              <Plus size={18} /> New Asset
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            className="form-input"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name, tag, serial number, brand..."
            style={{ paddingLeft: 36, width: "100%" }}
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                dispatch(setFilters({ search: "" }));
              }}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            className="form-input"
            style={{ flex: "1 1 130px", minWidth: 120 }}
            value={filters.assignmentType}
            onChange={(e) =>
              dispatch(setFilters({ assignmentType: e.target.value }))
            }
          >
            <option value="">All Assignments</option>
            <option value="employee">👤 Employee</option>
            <option value="department">🏢 Department</option>
            <option value="location">📍 Location</option>
            <option value="pool">🔄 Pool</option>
          </select>

          <select
            className="form-input"
            style={{ flex: "1 1 130px", minWidth: 120 }}
            value={filters.categoryId || ""}
            onChange={(e) =>
              dispatch(setFilters({ categoryId: e.target.value }))
            }
          >
            <option value="">All Categories</option>
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <select
            className="form-input"
            style={{ flex: "1 1 120px", minWidth: 110 }}
            value={filters.status}
            onChange={(e) => dispatch(setFilters({ status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ flex: "1 1 120px", minWidth: 110 }}
            value={filters.condition}
            onChange={(e) =>
              dispatch(setFilters({ condition: e.target.value }))
            }
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ flex: "1 1 140px", minWidth: 130 }}
            value={filters.departmentId}
            onChange={(e) =>
              dispatch(setFilters({ departmentId: e.target.value }))
            }
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {(filters.search ||
            filters.categoryId ||
            filters.status ||
            filters.condition ||
            filters.departmentId ||
            filters.assignmentType) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginLeft: "auto",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {
                  [
                    filters.search,
                    filters.categoryId,
                    filters.status,
                    filters.condition,
                    filters.departmentId,
                    filters.assignmentType,
                  ].filter(Boolean).length
                }{" "}
                filter(s) active
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  dispatch(clearFilters());
                  setLocalSearch("");
                }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div
            style={{ padding: 32, display: "flex", justifyContent: "center" }}
          >
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Asset Tag</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Assigned To</th>
                  <th>Owning Department</th>
                  <th>Status</th>
                  <th style={{ paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "48px 20px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Package
                        size={40}
                        style={{
                          opacity: 0.3,
                          display: "block",
                          margin: "0 auto 12px",
                        }}
                      />
                      No assets found.{" "}
                      {canCreate && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate("/assets/new")}
                        >
                          Add first asset
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const mailEnabled = isHandoverMailEnabled(asset);
                    const isSending = sendingMailId === asset.id;

                    return (
                      <tr
                        key={asset.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/assets/${asset.id}`)}
                      >
                        <td style={{ paddingLeft: 20 }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 12,
                              color: "var(--accent)",
                              background: "var(--accent-glow)",
                              padding: "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            {highlight(asset.assetTag, filters.search)}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 500 }}>
                            {highlight(asset.name, filters.search)}
                          </div>
                          {asset.brand && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                              }}
                            >
                              {highlight(asset.brand, filters.search)}{" "}
                              {highlight(asset.model, filters.search)}
                            </div>
                          )}
                        </td>

                        <td>
                          <div
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: 13,
                            }}
                          >
                            {highlight(asset.category?.name, filters.search) ||
                              "—"}
                          </div>
                          {asset.subCategory?.name && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {highlight(
                                asset.subCategory.name,
                                filters.search,
                              )}
                            </div>
                          )}
                        </td>

                        <td style={{ fontSize: 13 }}>
                          {asset.assignmentType === "employee" &&
                          asset.assignedToEmployee ? (
                            <div>
                              <span style={{ color: "var(--info)" }}>
                                👤{" "}
                                {highlight(
                                  asset.assignedToEmployee.firstName,
                                  filters.search,
                                )}{" "}
                                {highlight(
                                  asset.assignedToEmployee.lastName,
                                  filters.search,
                                )}
                              </span>
                              {asset.assignedToEmployee.designation && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {asset.assignedToEmployee.designation}
                                </div>
                              )}
                            </div>
                          ) : asset.assignmentType === "department" &&
                            asset.assignedToDept ? (
                            <span style={{ color: "var(--warning)" }}>
                              🏢 {asset.assignedToDept.name}
                            </span>
                          ) : asset.assignmentType === "location" &&
                            asset.assignedToLoc ? (
                            <span style={{ color: "var(--success)" }}>
                              📍 {asset.assignedToLoc.name}
                            </span>
                          ) : asset.assignmentType === "pool" ? (
                            <span style={{ color: "var(--text-muted)" }}>
                              🔄 Pool
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {highlight(asset.department?.name, filters.search) ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`badge badge-${asset.status?.toLowerCase().replace(/ /g, "-")}`}
                          >
                            {asset.status}
                          </span>
                        </td>

                        {/* ── Actions ── */}
                        <td style={{ paddingRight: 20 }}>
                          <div
                            style={{ display: "flex", gap: 6 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/assets/${asset.id}`)}
                              title="View"
                            >
                              <Eye size={14} />
                            </button>

                            {canEdit && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() =>
                                  navigate(`/assets/${asset.id}/edit`)
                                }
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {canEdit && (
                              <button
                                className="btn btn-sm"
                                onClick={(e) => handleSendMail(asset, e)}
                                disabled={!mailEnabled || isSending}
                                title={
                                  !mailEnabled
                                    ? asset.assignmentType !== "employee"
                                      ? "Only available for employee assignments"
                                      : "Approval pending — mail will be enabled after approval"
                                    : "Send Handover Mail"
                                }
                                style={{
                                  // enabled → info color, disabled → muted
                                  background: mailEnabled
                                    ? "rgba(51,154,240,0.12)"
                                    : "var(--bg-hover)",
                                  color: mailEnabled
                                    ? "var(--info)"
                                    : "var(--text-muted)",
                                  border: `1px solid ${
                                    mailEnabled
                                      ? "rgba(51,154,240,0.3)"
                                      : "var(--border)"
                                  }`,
                                  opacity: isSending ? 0.6 : 1,
                                  cursor: !mailEnabled
                                    ? "not-allowed"
                                    : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  transition: "all 0.15s",
                                }}
                              >
                                <Send size={13} />
                                {isSending ? "..." : ""}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={(e) => handleDelete(asset.id, e)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
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
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Page {currentPage} of {pagination.pages} · {pagination.total}{" "}
              assets
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={currentPage === pagination.pages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AssetModal
          asset={editAsset}
          onClose={() => {
            setShowModal(false);
            setEditAsset(null);
            loadAssets();
          }}
        />
      )}
    </div>
  );
}
