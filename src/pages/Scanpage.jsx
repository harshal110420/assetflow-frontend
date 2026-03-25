import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { AlertTriangle, ArrowLeft, Package } from 'lucide-react';

const STATUS_COLOR = {
    'Active': 'var(--success)', 'Inactive': 'var(--text-muted)', 'In Maintenance': 'var(--warning)',
    'Disposed': 'var(--danger)', 'Lost': 'var(--danger)', 'Reserved': '#7c3aed',
};
const CONDITION_COLOR = {
    'Excellent': 'var(--success)', 'Good': 'var(--info)', 'Fair': 'var(--warning)',
    'Poor': '#ff8c42', 'Damaged': 'var(--danger)',
};

export default function ScanPage() {
    const { assetTag } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(s => s.auth);
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const res = await api.get(`/assets/scan/${assetTag}`);
                setAsset(res.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Asset not found');
            } finally {
                setLoading(false);
            }
        };
        fetchAsset();
    }, [assetTag]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading asset...</p>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
            <div style={{ textAlign: 'center' }}>
                <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: 16 }} />
                <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Asset Not Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error}</p>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            </div>
        </div>
    );

    const statusColor = STATUS_COLOR[asset.status] || 'var(--text-muted)';
    const conditionColor = CONDITION_COLOR[asset.condition] || 'var(--text-muted)';

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>

            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                    <ArrowLeft size={15} /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={14} color="var(--accent)" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>AssetFlow</span>
                </div>
                <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)' }}>
                    {user?.firstName}
                </div>
            </div>

            {/* Hero */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px 16px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, padding: '5px 10px', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>#</span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace' }}>{asset.assetTag}</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>{asset.name}</h1>
                {asset.brand && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>{asset.brand}{asset.model ? ` · ${asset.model}` : ''}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                        ● {asset.status}
                    </span>
                    <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${conditionColor}18`, color: conditionColor, border: `1px solid ${conditionColor}40` }}>
                        {asset.condition}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Asset Details */}
                <Section label="Asset Details">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <InfoCard label="Category" value={asset.category?.name || asset.category} sub={asset.subCategory?.name} />
                        <InfoCard label="Current Value" value={asset.currentValue ? `₹${parseFloat(asset.currentValue).toLocaleString()}` : '—'} sub={asset.purchasePrice ? `Purchase: ₹${parseFloat(asset.purchasePrice).toLocaleString()}` : null} valueColor="var(--success)" />
                        {asset.locationObj && <InfoCard label="Location" value={asset.locationObj.name} sub={asset.locationObj.code} />}
                        {asset.department && <InfoCard label="Department" value={asset.department?.name || asset.department} />}
                        {asset.warrantyExpiry && (
                            <InfoCard
                                label="Warranty"
                                value={new Date(asset.warrantyExpiry) < new Date() ? 'Expired' : new Date(asset.warrantyExpiry).toLocaleDateString('en-IN')}
                                sub={new Date(asset.warrantyExpiry) < new Date() ? 'Expired' : 'Valid'}
                                valueColor={new Date(asset.warrantyExpiry) < new Date() ? 'var(--danger)' : 'var(--warning)'}
                            />
                        )}
                        {asset.serialNumber && <InfoCard label="Serial No." value={asset.serialNumber} mono />}
                        {asset.vendor && <InfoCard label="Vendor" value={asset.vendor} />}
                        {asset.purchaseDate && <InfoCard label="Purchase Date" value={new Date(asset.purchaseDate).toLocaleDateString('en-IN')} />}
                    </div>
                </Section>

                {/* Currently Assigned */}
                <Section label="Currently Assigned">
                    {asset.assignedToEmployee ? (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--accent-glow)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                                    {asset.assignedToEmployee.firstName?.[0]}{asset.assignedToEmployee.lastName?.[0]}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{asset.assignedToEmployee.firstName} {asset.assignedToEmployee.lastName}</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{asset.assignedToEmployee.designation} · {asset.assignedToEmployee.employeeCode}</p>
                                    <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{asset.assignedToEmployee.email}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                            Not assigned
                        </div>
                    )}
                </Section>

                {/* Config */}
                {asset.customFields && Object.keys(asset.customFields).length > 0 && (
                    <Section label="Configuration">
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>System Config</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 10 }}>{Object.keys(asset.customFields).length} fields</span>
                            </div>
                            {Object.entries(asset.customFields).map(([k, v], i, arr) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: v === 'Yes' ? 'var(--success)' : 'var(--text-primary)' }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Assignment History */}
                {asset.assignmentHistory?.length > 0 && (
                    <Section label="Assignment History">
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                            {asset.assignmentHistory.map((a, i) => (
                                <div key={a.id || i} style={{ padding: '12px 16px', borderBottom: i < asset.assignmentHistory.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                                            {a.assignedEmployee ? `${a.assignedEmployee.firstName} ${a.assignedEmployee.lastName}` : 'Unknown'}
                                        </span>
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: a.isActive ? 'rgba(0,214,143,0.12)' : 'var(--bg-hover)', color: a.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                                            {a.isActive ? 'Active' : 'Returned'}
                                        </span>
                                    </div>
                                    {a.assignedEmployee?.designation && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>💼 {a.assignedEmployee.designation}</p>}
                                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                        <span>📅 {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('en-IN') : '—'}</span>
                                        {a.returnedAt && <span>↩ {new Date(a.returnedAt).toLocaleDateString('en-IN')}</span>}
                                        {a.purpose && <span>· {a.purpose}</span>}
                                    </div>
                                    {a.configSnapshot && Object.keys(a.configSnapshot).length > 0 && (
                                        <div style={{ marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                            {Object.entries(a.configSnapshot).map(([k, v]) => (
                                                <div key={k} style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                    {k}: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Maintenance History */}
                {asset.maintenanceHistory?.length > 0 && (
                    <Section label="Maintenance History">
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                            {asset.maintenanceHistory.map((m, i) => (
                                <div key={m.id || i} style={{ padding: '12px 16px', borderBottom: i < asset.maintenanceHistory.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{m.title}</span>
                                        <span style={{ fontSize: 11, color: m.status === 'Completed' ? 'var(--success)' : m.status === 'In Progress' ? 'var(--warning)' : 'var(--text-muted)' }}>{m.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                        <span>🔧 {m.type}</span>
                                        <span>⚡ {m.priority}</span>
                                        {m.cost > 0 && <span>💰 ₹{parseFloat(m.cost).toLocaleString()}</span>}
                                        {m.scheduledDate && <span>📅 {new Date(m.scheduledDate).toLocaleDateString('en-IN')}</span>}
                                    </div>
                                    {m.technician && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Technician: {m.technician.firstName} {m.technician.lastName}</p>}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {!asset.assignmentHistory?.length && !asset.maintenanceHistory?.length && (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No history available</div>
                )}

                <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    AssetFlow AMS · Scanned by {user?.firstName} {user?.lastName}
                </div>
            </div>
        </div>
    );
}

function Section({ label, children }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{label}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {children}
        </div>
    );
}

function InfoCard({ label, value, sub, valueColor, mono }) {
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: mono ? 12 : 14, fontWeight: 700, color: valueColor || 'var(--text-primary)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}