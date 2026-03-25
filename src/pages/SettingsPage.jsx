import React, { useEffect, useState, useCallback } from 'react';
import {
    Building2, Mail, Shield, Package, CheckSquare, Bell,
    Save, RefreshCw, Send, Eye, EyeOff, CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { usePermission } from '../hooks/usePermission';

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'company', label: 'Company', icon: Building2, color: 'var(--accent)' },
    { id: 'email', label: 'Email / SMTP', icon: Mail, color: 'var(--info)' },
    { id: 'security', label: 'Security', icon: Shield, color: 'var(--danger)' },
    { id: 'asset', label: 'Asset Rules', icon: Package, color: 'var(--warning)' },
    { id: 'approval', label: 'Approvals', icon: CheckSquare, color: '#ff8c42' },
    { id: 'notification', label: 'Notifications', icon: Bell, color: 'var(--success)' },
];

// ── Field definitions per tab ─────────────────────────────────────────────────
const FIELDS = {
    company: [
        { key: 'company.name', label: 'Company / App Name', type: 'text', placeholder: 'AssetFlow AMS' },
        { key: 'company.email', label: 'Company Email', type: 'email', placeholder: 'admin@company.com' },
        { key: 'company.phone', label: 'Company Phone', type: 'text', placeholder: '+91 98765 43210' },
        { key: 'company.address', label: 'Company Address', type: 'textarea', placeholder: 'Mumbai, Maharashtra' },
        { key: 'company.timezone', label: 'Timezone', type: 'select', options: ['Asia/Kolkata', 'Asia/Dubai', 'UTC', 'America/New_York', 'Europe/London'] },
        { key: 'company.currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP', 'AED'] },
        { key: 'company.dateFormat', label: 'Date Format', type: 'select', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
    ],
    email: [
        { key: 'email.host', label: 'SMTP Host', type: 'text', placeholder: 'mail.company.com' },
        { key: 'email.port', label: 'SMTP Port', type: 'number', placeholder: '587' },
        { key: 'email.secure', label: 'Use SSL/TLS', type: 'boolean' },
        { key: 'email.user', label: 'SMTP Username', type: 'text', placeholder: 'noreply@company.com' },
        { key: 'email.pass', label: 'SMTP Password', type: 'password', placeholder: '••••••••' },
        { key: 'email.fromName', label: 'From Name', type: 'text', placeholder: 'AssetFlow AMS' },
        { key: 'email.fromEmail', label: 'From Email', type: 'email', placeholder: 'noreply@company.com' },
        { key: 'email.enabled', label: 'Enable Email Notifications', type: 'boolean' },
    ],
    security: [
        { key: 'security.adminRole', label: 'Admin Role Slug', type: 'text', placeholder: 'admin', description: 'This role gets full access — bypasses all permission checks' },
        { key: 'security.bypassRoles', label: 'Permission Bypass Roles', type: 'tags', placeholder: 'Add role slug...', description: 'These roles skip permission checks entirely' },
        { key: 'security.approvalBypassRoles', label: 'Approval Bypass Roles', type: 'tags', placeholder: 'Add role slug...', description: 'These roles can bypass approval workflows' },
    ],
    asset: [
        { key: 'asset.tagPrefix', label: 'Asset Tag Prefix', type: 'text', placeholder: 'AST', description: 'e.g. AST → generates AST-001-MBP' },
        { key: 'asset.defaultDepreciation', label: 'Default Depreciation Rate (%)', type: 'number', placeholder: '20', description: 'Annual depreciation % applied to new assets' },
        { key: 'asset.warrantyAlertDays', label: 'Warranty Alert (days before)', type: 'number', placeholder: '30' },
        { key: 'asset.maintenanceAlertDays', label: 'Maintenance Due Alert (days)', type: 'number', placeholder: '7' },
        { key: 'asset.autoTagEnabled', label: 'Auto-generate Asset Tags', type: 'boolean', description: 'Automatically generate unique asset tags on creation' },
    ],
    approval: [
        { key: 'approval.valueThreshold', label: 'Value Threshold for Approval (₹)', type: 'number', placeholder: '10000', description: 'Assets above this value require approval workflow' },
        { key: 'approval.autoApproveHours', label: 'Auto-approve Timeout (hours)', type: 'number', placeholder: '48', description: '0 = disabled. Auto-approve pending requests after X hours' },
        { key: 'approval.allowSelfApprove', label: 'Allow Self-approval', type: 'boolean', description: 'Allow a user to approve their own requests' },
    ],
    notification: [
        { key: 'notification.warrantyReminder', label: 'Warranty Expiry Reminders', type: 'boolean', description: 'Send email when asset warranty is about to expire' },
        { key: 'notification.maintenanceReminder', label: 'Maintenance Due Reminders', type: 'boolean', description: 'Send email when scheduled maintenance is due' },
        { key: 'notification.assignmentAlert', label: 'Asset Assignment Alerts', type: 'boolean', description: 'Notify user when an asset is assigned to them' },
        { key: 'notification.approvalAlert', label: 'Approval Request Alerts', type: 'boolean', description: 'Notify approvers when a new approval request is raised' },
    ],
};

// ── Tags Input Component ──────────────────────────────────────────────────────
function TagsInput({ value, onChange, placeholder }) {
    const [input, setInput] = useState('');
    const tags = (() => { try { return JSON.parse(value || '[]'); } catch { return []; } })();

    const addTag = () => {
        const v = input.trim().toLowerCase();
        if (!v || tags.includes(v)) return;
        onChange(JSON.stringify([...tags, v]));
        setInput('');
    };

    const removeTag = (t) => onChange(JSON.stringify(tags.filter(x => x !== t)));

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', background: 'var(--bg-secondary)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {tags.map(t => (
                <span key={t} style={{ background: 'var(--bg-hover)', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t}
                    <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
            ))}
            <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                placeholder={placeholder || 'Add...'}
                style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, minWidth: 120, flex: 1 }}
            />
            <button onClick={addTag} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 12 }}>Add</button>
        </div>
    );
}

// ── Main SettingsPage ─────────────────────────────────────────────────────────
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('company');
    const [settings, setSettings] = useState({});
    const [localValues, setLocalValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testing, setTesting] = useState(false);
    const [showPasswords, setShowPasswords] = useState({});
    const [dirty, setDirty] = useState(false);
    const { can } = usePermission();
    const canCreate = can("settings", "new");
    const canEdit = can("settings", "edit");
    const canDelete = can("settings", "delete");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings');
            setSettings(res.data.data || {});
            const vals = {};
            Object.entries(res.data.data || {}).forEach(([key, s]) => {
                vals[key] = s.rawValue ?? '';
            });
            setLocalValues(vals);
            setDirty(false);
        } catch (err) {
            if (err.response?.status === 403) {
                toast('Settings are not accessible to your role.', {
                    icon: '🔒',
                    style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                });
            } else {
                toast.error('Failed to load settings');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleChange = (key, value) => {
        setLocalValues(prev => ({ ...prev, [key]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Only send fields for current tab
            const tabFields = FIELDS[activeTab] || [];
            const toSave = {};
            tabFields.forEach(f => { if (localValues[f.key] !== undefined) toSave[f.key] = localValues[f.key]; });

            await api.put('/settings', { settings: toSave });
            toast.success('Settings saved!');
            setDirty(false);
            await load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) return toast.error('Enter recipient email');
        setTesting(true);
        try {
            await api.post('/settings/test-email', { to: testEmail });
            toast.success('Test email sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Email test failed');
        } finally {
            setTesting(false);
        }
    };

    const renderField = (field) => {
        const val = localValues[field.key] ?? '';

        if (field.type === 'boolean') {
            const checked = val === 'true' || val === true;
            return (
                <div key={field.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{field.label}</p>
                        {field.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{field.description}</p>}
                    </div>
                    <button
                        onClick={() => handleChange(field.key, checked ? 'false' : 'true')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: checked ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}
                    >
                        {checked
                            ? <CheckCircle size={22} color="var(--success)" />
                            : <AlertCircle size={22} color="var(--text-muted)" />
                        }
                        {checked ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            );
        }

        if (field.type === 'tags') {
            return (
                <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    {field.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{field.description}</p>}
                    <TagsInput value={val} onChange={v => handleChange(field.key, v)} placeholder={field.placeholder} />
                </div>
            );
        }

        if (field.type === 'select') {
            return (
                <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <select className="form-select" value={val} onChange={e => handleChange(field.key, e.target.value)}>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            );
        }

        if (field.type === 'textarea') {
            return (
                <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <textarea className="form-input" value={val} onChange={e => handleChange(field.key, e.target.value)} placeholder={field.placeholder} rows={3} style={{ resize: 'vertical' }} />
                </div>
            );
        }

        if (field.type === 'password') {
            const show = showPasswords[field.key];
            return (
                <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="form-input"
                            type={show ? 'text' : 'password'}
                            value={val}
                            onChange={e => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            style={{ paddingRight: 40 }}
                        />
                        <button
                            onClick={() => setShowPasswords(p => ({ ...p, [field.key]: !show }))}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {field.description && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{field.description}</p>}
                </div>
            );
        }

        return (
            <div key={field.key} className="form-group">
                <label className="form-label">{field.label}</label>
                {field.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{field.description}</p>}
                <input
                    className="form-input"
                    type={field.type}
                    value={val}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                />
            </div>
        );
    };

    const tab = TABS.find(t => t.id === activeTab);
    const fields = FIELDS[activeTab] || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Settings</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                        Manage system configuration and preferences
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    {canEdit && dirty && (
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>

                {/* Sidebar Tabs */}
                <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {TABS.map(t => {
                        const Icon = t.icon;
                        const active = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                    border: `1px solid ${active ? t.color : 'transparent'}`,
                                    background: active ? `${t.color}15` : 'transparent',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Icon size={16} color={active ? t.color : 'var(--text-muted)'} />
                                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? t.color : 'var(--text-secondary)' }}>
                                    {t.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="card" style={{ flex: 1, padding: 24 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="spinner" style={{ width: 32, height: 32 }} />
                        </div>
                    ) : Object.keys(settings).length === 0 ? (
                        // ← YE ADD KARO
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12, color: 'var(--text-muted)' }}>
                            <Shield size={40} strokeWidth={1.2} color="var(--text-muted)" />
                            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Access Restricted</p>
                            <p style={{ fontSize: 13, textAlign: 'center', maxWidth: 300, margin: 0 }}>
                                You don't have permission to view or modify system settings. Contact your administrator.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Tab Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                                {tab && <tab.icon size={20} color={tab.color} />}
                                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{tab?.label}</h3>
                            </div>

                            {/* Fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {fields.map(f => renderField(f))}
                            </div>

                            {/* Email Test Section */}
                            {activeTab === 'email' && (
                                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                                        Test Email Configuration
                                    </p>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input
                                            className="form-input"
                                            type="email"
                                            value={testEmail}
                                            onChange={e => setTestEmail(e.target.value)}
                                            placeholder="Enter recipient email..."
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="btn btn-secondary"
                                            onClick={handleTestEmail}
                                            disabled={testing}
                                            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <Send size={14} />
                                            {testing ? 'Sending...' : 'Send Test Email'}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                        Save SMTP settings first, then test the connection
                                    </p>
                                </div>
                            )}

                            {/* Save Button at bottom */}
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                                {canEdit && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSave}
                                        disabled={saving || !dirty}
                                        style={{ opacity: dirty ? 1 : 0.5 }}
                                    >
                                        <Save size={15} />
                                        {saving ? 'Saving...' : dirty ? 'Save Changes' : 'No Changes'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}