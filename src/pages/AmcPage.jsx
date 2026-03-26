// pages/AmcPage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    fetchAmcContracts,
    deleteAmcContract,
    setFilters,
    clearFilters,
} from "../store/slices/amcSlice";
import {
    Plus, RefreshCw, Search, Eye, Edit2, Trash2,
    FileText, AlertTriangle, CheckCircle, Clock, XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import AmcModal from "../pages/AmcModal";
import { usePermission } from "../hooks/usePermission";

const STATUSES = ["Active", "Expired", "Pending Renewal", "Cancelled"];
const CONTRACT_TYPES = ["AMC", "CMC"];

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const config = {
        Active: { color: "var(--success)", bg: "rgba(0,214,143,0.1)", icon: <CheckCircle size={11} /> },
        Expired: { color: "var(--danger)", bg: "rgba(255,71,87,0.1)", icon: <XCircle size={11} /> },
        "Pending Renewal": { color: "var(--warning)", bg: "rgba(255,165,0,0.1)", icon: <AlertTriangle size={11} /> },
        Cancelled: { color: "var(--text-muted)", bg: "var(--bg-hover)", icon: <XCircle size={11} /> },
    };
    const c = config[status] || config["Cancelled"];
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            color: c.color, background: c.bg, border: `1px solid ${c.color}33`,
        }}>
            {c.icon} {status}
        </span>
    );
}

// ── Days remaining chip ───────────────────────────────────────────────────────
function DaysChip({ endDate }) {
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diff < 0)
        return <span style={{ fontSize: 11, color: "var(--danger)" }}>Expired {Math.abs(diff)}d ago</span>;
    if (diff <= 7)
        return <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 700 }}>⚠️ {diff}d left</span>;
    if (diff <= 30)
        return <span style={{ fontSize: 11, color: "var(--warning)", fontWeight: 600 }}>⏰ {diff}d left</span>;
    return <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{diff}d left</span>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AmcPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { contracts, isLoading, pagination, filters } = useSelector((s) => s.amc);
    const { can } = usePermission();

    const [showModal, setShowModal] = useState(false);
    const [editContract, setEditContract] = useState(null);
    const [localSearch, setLocalSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const canCreate = can("amc", "new");
    const canEdit = can("amc", "edit");
    const canDelete = can("amc", "delete");

    const load = () => {
        dispatch(fetchAmcContracts({ ...filters, page: currentPage, limit: 20 }));
    };

    useEffect(() => { load(); }, [filters, currentPage]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(setFilters({ search: localSearch }));
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [localSearch]);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this AMC contract?")) return;
        const res = await dispatch(deleteAmcContract(id));
        if (!res.error) toast.success("Contract deleted");
        else toast.error("Failed to delete");
    };

    const handleClose = (refresh) => {
        setShowModal(false);
        setEditContract(null);
        if (refresh) load();
    };

    // ── Stats summary ────────────────────────────────────────────────────────
    const active = contracts.filter((c) => c.status === "Active").length;
    const expiring = contracts.filter((c) => c.status === "Pending Renewal").length;
    const expired = contracts.filter((c) => c.status === "Expired").length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>AMC / CMC Contracts</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
                        {pagination.total} contracts
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={15} /></button>
                    {canCreate && (
                        <button className="btn btn-primary" onClick={() => { setEditContract(null); setShowModal(true); }}>
                            <Plus size={16} /> New Contract
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                {[
                    { label: "Active", value: active, color: "var(--success)", icon: <CheckCircle size={18} /> },
                    { label: "Expiring Soon", value: expiring, color: "var(--warning)", icon: <Clock size={18} /> },
                    { label: "Expired", value: expired, color: "var(--danger)", icon: <AlertTriangle size={18} /> },
                    { label: "Total", value: pagination.total, color: "var(--accent)", icon: <FileText size={18} /> },
                ].map((stat) => (
                    <div key={stat.label} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            className="form-input"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="Search contract no, vendor..."
                            style={{ paddingLeft: 32 }}
                        />
                    </div>
                    <select className="form-input" style={{ width: "auto" }}
                        value={filters.status}
                        onChange={(e) => { dispatch(setFilters({ status: e.target.value })); setCurrentPage(1); }}>
                        <option value="">All Statuses</option>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <select className="form-input" style={{ width: "auto" }}
                        value={filters.contractType}
                        onChange={(e) => { dispatch(setFilters({ contractType: e.target.value })); setCurrentPage(1); }}>
                        <option value="">AMC + CMC</option>
                        {CONTRACT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    {(filters.search || filters.status || filters.contractType) && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { dispatch(clearFilters()); setLocalSearch(""); }}>Clear</button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {isLoading ? (
                    <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
                        <div className="spinner" style={{ width: 32, height: 32 }} />
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 20 }}>Contract No</th>
                                    <th>Vendor</th>
                                    <th>Type</th>
                                    <th>Coverage</th>
                                    <th>Assets</th>
                                    <th>Valid Till</th>
                                    <th>Cost</th>
                                    <th>Status</th>
                                    <th style={{ paddingRight: 20, position: "sticky", right: 0, background: "var(--bg-card)", zIndex: 2, boxShadow: "-2px 0 8px rgba(0,0,0,0.15)" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contracts.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
                                            <FileText size={40} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
                                            No contracts found.
                                        </td>
                                    </tr>
                                ) : contracts.map((c) => (
                                    <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/amc/${c.id}`)}>
                                        <td style={{ paddingLeft: 20 }}>
                                            <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 8px", borderRadius: 6 }}>
                                                {c.contractNumber}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500, fontSize: 13 }}>{c.vendorName}</div>
                                            {c.vendorContact && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.vendorContact}</div>}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                                                {c.contractType}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.coverageType}</td>
                                        <td>
                                            <span style={{ fontSize: 12, color: "var(--info)", fontWeight: 600 }}>
                                                {c.assets?.length || 0} assets
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 13 }}>{c.endDate}</div>
                                            <DaysChip endDate={c.endDate} />
                                        </td>
                                        <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                            ₹{Number(c.contractCost || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td><StatusBadge status={c.status} /></td>
                                        <td style={{ paddingRight: 20, position: "sticky", right: 0, background: "var(--bg-card)", zIndex: 1, boxShadow: "-2px 0 8px rgba(0,0,0,0.15)" }}
                                            onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/amc/${c.id}`)} title="View"><Eye size={14} /></button>
                                                {canEdit && (
                                                    <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setEditContract(c); setShowModal(true); }}>
                                                        <Edit2 size={13} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(c.id, e)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {currentPage} of {pagination.pages} · {pagination.total} contracts</span>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))} disabled={currentPage === pagination.pages}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <AmcModal contract={editContract} onClose={handleClose} />
            )}
        </div>
    );
}