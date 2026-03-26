// pages/AmcDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAmcById, addServiceVisit, clearSelectedContract } from "../store/slices/amcSlice";
import {
    ArrowLeft, Plus, Calendar, Package,
    Wrench, CheckCircle, AlertTriangle, XCircle, Clock,
} from "lucide-react";
import toast from "react-hot-toast";

const SERVICE_TYPES = [
    "Preventive Maintenance", "Corrective Maintenance",
    "Installation", "Inspection", "Other",
];

// ── Add Visit Modal ───────────────────────────────────────────────────────────
function AddVisitModal({ contractId, assets, onClose }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState({
        assetId: "",
        visitDate: new Date().toISOString().split("T")[0],
        engineerName: "",
        serviceType: "Preventive Maintenance",
        remarks: "",
        partsChanged: "",
        cost: 0,
        nextDueDate: "",
    });
    const [loading, setLoading] = useState(false);
    const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await dispatch(addServiceVisit({ contractId, ...form, cost: Number(form.cost) || 0 }));
            if (result.error) throw new Error(result.payload || "Failed");
            toast.success("Service visit logged!");
            onClose(true);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
            <div className="modal" style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h2 className="modal-title">Log Service Visit</h2>
                    <button onClick={() => onClose(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Asset (optional)</label>
                            <select className="form-select" value={form.assetId} onChange={set("assetId")}>
                                <option value="">All covered assets</option>
                                {assets.map((a) => (
                                    <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Visit Date *</label>
                            <input className="form-input" type="date" value={form.visitDate} onChange={set("visitDate")} required />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Engineer Name</label>
                            <input className="form-input" value={form.engineerName} onChange={set("engineerName")} placeholder="Rajesh Kumar" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Service Type</label>
                            <select className="form-select" value={form.serviceType} onChange={set("serviceType")}>
                                {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Cost (₹) <span style={{ fontSize: 11, color: "var(--text-muted)" }}>0 = AMC covered</span></label>
                            <input className="form-input" type="number" value={form.cost} onChange={set("cost")} min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Next Due Date</label>
                            <input className="form-input" type="date" value={form.nextDueDate} onChange={set("nextDueDate")} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Parts Changed</label>
                        <input className="form-input" value={form.partsChanged} onChange={set("partsChanged")} placeholder="RAM 8GB, Thermal paste" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Remarks</label>
                        <textarea className="form-input" value={form.remarks} onChange={set("remarks")} rows={2} style={{ resize: "vertical" }} />
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving..." : "Log Visit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Detail Page ──────────────────────────────────────────────────────────
export default function AmcDetailPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { selectedContract: contract, isLoadingDetail } = useSelector((s) => s.amc);
    const [showVisitModal, setShowVisitModal] = useState(false);

    useEffect(() => {
        dispatch(fetchAmcById(id));
        return () => dispatch(clearSelectedContract());
    }, [id]);

    if (isLoadingDetail || !contract) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
        );
    }

    const today = new Date();
    const end = new Date(contract.endDate);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    const statusColor = {
        Active: "var(--success)",
        Expired: "var(--danger)",
        "Pending Renewal": "var(--warning)",
        Cancelled: "var(--text-muted)",
    }[contract.status] || "var(--text-muted)";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.4s ease" }}>

            {/* Back + Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate("/amc")}>
                    <ArrowLeft size={15} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>{contract.contractNumber}</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{contract.vendorName} · {contract.contractType}</p>
                </div>
                <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: statusColor, background: `${statusColor}22`, border: `1px solid ${statusColor}44` }}>
                    {contract.status}
                </span>
            </div>

            {/* Expiry Alert Banner */}
            {daysLeft <= 30 && daysLeft >= 0 && (
                <div style={{ padding: "12px 18px", borderRadius: 10, background: "rgba(255,165,0,0.1)", border: "1px solid rgba(255,165,0,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
                    <AlertTriangle size={18} color="var(--warning)" />
                    <span style={{ color: "var(--warning)", fontWeight: 600, fontSize: 14 }}>
                        This contract expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}. Consider renewing soon!
                    </span>
                </div>
            )}
            {daysLeft < 0 && (
                <div style={{ padding: "12px 18px", borderRadius: 10, background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
                    <XCircle size={18} color="var(--danger)" />
                    <span style={{ color: "var(--danger)", fontWeight: 600, fontSize: 14 }}>
                        This contract expired {Math.abs(daysLeft)} days ago. Assets are no longer covered.
                    </span>
                </div>
            )}

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>

                {/* Contract Details */}
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contract Info</h3>
                    {[
                        ["Contract Type", contract.contractType],
                        ["Coverage", contract.coverageType],
                        ["Service Frequency", contract.serviceFrequency],
                        ["Start Date", contract.startDate],
                        ["End Date", contract.endDate],
                        ["Contract Cost", `₹${Number(contract.contractCost || 0).toLocaleString("en-IN")}`],
                    ].map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                            <span style={{ color: "var(--text-muted)" }}>{label}</span>
                            <span style={{ fontWeight: 500 }}>{value || "—"}</span>
                        </div>
                    ))}
                </div>

                {/* Vendor Details */}
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vendor Info</h3>
                    {[
                        ["Name", contract.vendorName],
                        ["Contact", contract.vendorContact],
                        ["Email", contract.vendorEmail],
                        ["Document", contract.documentUrl ? <a href={contract.documentUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>View Document</a> : "—"],
                    ].map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                            <span style={{ color: "var(--text-muted)" }}>{label}</span>
                            <span style={{ fontWeight: 500 }}>{value || "—"}</span>
                        </div>
                    ))}
                    {contract.remarks && (
                        <div style={{ marginTop: 12, padding: 10, background: "var(--bg-hover)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                            {contract.remarks}
                        </div>
                    )}
                </div>
            </div>

            {/* Covered Assets */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Package size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Covered Assets ({contract.assets?.length || 0})
                    </h3>
                </div>
                {!contract.assets?.length ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>No assets mapped to this contract</p>
                ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {contract.assets.map((a) => (
                            <span key={a.id} onClick={() => navigate(`/assets/${a.id}`)}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", background: "var(--accent-glow)", border: "1px solid var(--accent)44", color: "var(--accent)", fontWeight: 500, transition: "all 0.15s" }}>
                                <span style={{ fontFamily: "monospace" }}>{a.assetTag}</span>
                                <span style={{ color: "var(--text-secondary)" }}>{a.name}</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Service Visits */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Wrench size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Service Visit History ({contract.serviceVisits?.length || 0})
                    </h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowVisitModal(true)}>
                        <Plus size={14} /> Log Visit
                    </button>
                </div>

                {!contract.serviceVisits?.length ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>No service visits logged yet</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {contract.serviceVisits.map((v) => (
                            <div key={v.id} style={{ padding: "12px 16px", borderRadius: 8, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 110 }}>
                                    <Calendar size={13} color="var(--accent)" />
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{v.visitDate}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 150 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v.serviceType}</div>
                                    {v.engineerName && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Engineer: {v.engineerName}</div>}
                                    {v.asset && <div style={{ fontSize: 11, color: "var(--info)" }}>Asset: {v.asset.assetTag} — {v.asset.name}</div>}
                                </div>
                                {v.partsChanged && (
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                        Parts: {v.partsChanged}
                                    </div>
                                )}
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: v.cost > 0 ? "var(--danger)" : "var(--success)" }}>
                                        {v.cost > 0 ? `₹${Number(v.cost).toLocaleString("en-IN")}` : "Free (Covered)"}
                                    </div>
                                    {v.nextDueDate && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Next: {v.nextDueDate}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showVisitModal && (
                <AddVisitModal
                    contractId={contract.id}
                    assets={contract.assets || []}
                    onClose={(refresh) => {
                        setShowVisitModal(false);
                        if (refresh) dispatch(fetchAmcById(id));
                    }}
                />
            )}
        </div>
    );
}