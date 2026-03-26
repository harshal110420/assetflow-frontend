// components/amc/AmcModal.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAmcContract, updateAmcContract } from "../store/slices/amcSlice";
import { fetchAssets } from "../store/slices/assetSlice";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const COVERAGE_TYPES = ["Labor Only", "Parts + Labor", "On-site", "Off-site"];
const FREQUENCIES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "On-Demand"];
const CONTRACT_TYPES = ["AMC", "CMC"];

export default function AmcModal({ contract, onClose }) {
    const dispatch = useDispatch();
    const { assets } = useSelector((s) => s.assets);
    const isEdit = !!contract;

    const [form, setForm] = useState({
        contractNumber: contract?.contractNumber || "",
        vendorName: contract?.vendorName || "",
        vendorContact: contract?.vendorContact || "",
        vendorEmail: contract?.vendorEmail || "",
        contractType: contract?.contractType || "AMC",
        coverageType: contract?.coverageType || "Parts + Labor",
        serviceFrequency: contract?.serviceFrequency || "Yearly",
        startDate: contract?.startDate || "",
        endDate: contract?.endDate || "",
        contractCost: contract?.contractCost || "",
        remarks: contract?.remarks || "",
        documentUrl: contract?.documentUrl || "",
        assetIds: contract?.assets?.map((a) => a.id) || [],
    });
    const [loading, setLoading] = useState(false);
    const [assetSearch, setAssetSearch] = useState("");

    useEffect(() => {
        dispatch(fetchAssets({ limit: 200 }));
    }, []);

    const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

    const toggleAsset = (assetId) => {
        setForm((p) => ({
            ...p,
            assetIds: p.assetIds.includes(assetId)
                ? p.assetIds.filter((id) => id !== assetId)
                : [...p.assetIds, assetId],
        }));
    };

    const filteredAssets = assets.filter((a) =>
        !assetSearch ||
        a.name?.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.assetTag?.toLowerCase().includes(assetSearch.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.contractNumber || !form.vendorName || !form.startDate || !form.endDate)
            return toast.error("Contract number, vendor, start & end dates are required");

        if (new Date(form.endDate) <= new Date(form.startDate))
            return toast.error("End date must be after start date");

        setLoading(true);
        try {
            const payload = { ...form, contractCost: Number(form.contractCost) || 0 };
            const action = isEdit
                ? updateAmcContract({ id: contract.id, ...payload })
                : createAmcContract(payload);

            const result = await dispatch(action);
            if (result.error) throw new Error(result.payload || "Failed");
            toast.success(isEdit ? "Contract updated!" : "Contract created!");
            onClose(true);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
            <div className="modal" style={{ maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }}>

                {/* Header */}
                <div className="modal-header" style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                    <h2 className="modal-title">{isEdit ? "Edit AMC Contract" : "New AMC Contract"}</h2>
                    <button onClick={() => onClose(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Contract No + Type */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Contract Number *</label>
                            <input className="form-input" value={form.contractNumber} onChange={set("contractNumber")} placeholder="AMC-2024-001" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contract Type</label>
                            <select className="form-select" value={form.contractType} onChange={set("contractType")}>
                                {CONTRACT_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Vendor Name + Contact */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Vendor Name *</label>
                            <input className="form-input" value={form.vendorName} onChange={set("vendorName")} placeholder="Tech Solutions Pvt Ltd" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Vendor Contact</label>
                            <input className="form-input" value={form.vendorContact} onChange={set("vendorContact")} placeholder="+91 98765 43210" />
                        </div>
                    </div>

                    {/* Vendor Email + Cost */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Vendor Email</label>
                            <input className="form-input" type="email" value={form.vendorEmail} onChange={set("vendorEmail")} placeholder="vendor@company.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contract Cost (₹)</label>
                            <input className="form-input" type="number" value={form.contractCost} onChange={set("contractCost")} placeholder="50000" min="0" />
                        </div>
                    </div>

                    {/* Coverage + Frequency */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Coverage Type</label>
                            <select className="form-select" value={form.coverageType} onChange={set("coverageType")}>
                                {COVERAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Service Frequency</label>
                            <select className="form-select" value={form.serviceFrequency} onChange={set("serviceFrequency")}>
                                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Start + End Dates */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Start Date *</label>
                            <input className="form-input" type="date" value={form.startDate} onChange={set("startDate")} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date *</label>
                            <input className="form-input" type="date" value={form.endDate} onChange={set("endDate")} required />
                        </div>
                    </div>

                    {/* Document URL */}
                    <div className="form-group">
                        <label className="form-label">Document URL</label>
                        <input className="form-input" value={form.documentUrl} onChange={set("documentUrl")} placeholder="https://drive.google.com/..." />
                    </div>

                    {/* Remarks */}
                    <div className="form-group">
                        <label className="form-label">Remarks</label>
                        <textarea className="form-input" value={form.remarks} onChange={set("remarks")} rows={2} placeholder="Any additional notes..." style={{ resize: "vertical" }} />
                    </div>

                    {/* Asset Mapping */}
                    <div className="form-group">
                        <label className="form-label">
                            Covered Assets
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
                                {form.assetIds.length} selected
                            </span>
                        </label>
                        <input
                            className="form-input"
                            value={assetSearch}
                            onChange={(e) => setAssetSearch(e.target.value)}
                            placeholder="Search asset name or tag..."
                            style={{ marginBottom: 8 }}
                        />
                        <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                            {filteredAssets.length === 0 ? (
                                <p style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", padding: 12 }}>No assets found</p>
                            ) : filteredAssets.map((asset) => {
                                const selected = form.assetIds.includes(asset.id);
                                return (
                                    <label key={asset.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 6, cursor: "pointer", background: selected ? "var(--accent-glow)" : "transparent", border: `1px solid ${selected ? "var(--accent)" : "transparent"}`, transition: "all 0.15s" }}>
                                        <input type="checkbox" checked={selected} onChange={() => toggleAsset(asset.id)} style={{ accentColor: "var(--accent)" }} />
                                        <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--accent)", background: "var(--accent-glow)", padding: "1px 6px", borderRadius: 4 }}>
                                            {asset.assetTag}
                                        </span>
                                        <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{asset.name}</span>
                                        {asset.department?.name && (
                                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{asset.department.name}</span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid var(--border)", position: "sticky", bottom: 0, background: "var(--bg-card)" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : isEdit ? "Update Contract" : "Create Contract"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}