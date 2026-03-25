import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Save, Menu as MenuIcon, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ALL_ACTIONS = [
    { key: 'view', label: 'View', color: 'var(--accent)' },
    { key: 'new', label: 'New', color: 'var(--success)' },
    { key: 'edit', label: 'Edit', color: 'var(--warning)' },
    { key: 'delete', label: 'Delete', color: 'var(--danger)' },
    { key: 'import', label: 'Import', color: 'var(--accent-2)' },
    { key: 'export', label: 'Export', color: '#ff8c42' },
    { key: 'print', label: 'Print', color: 'var(--info)' },
    { key: 'approve', label: 'Approve', color: 'var(--info)' },
    { key: 'reject', label: 'Reject', color: 'var(--info)' },
];

const ICON_OPTIONS = [
    'LayoutDashboard', 'Package', 'Wrench', 'CheckSquare', 'BarChart2', 'Users',
    'Shield', 'MapPin', 'Settings', 'FileText', 'Database', 'Bell', 'Calendar',
    'Truck', 'Monitor', 'Smartphone', 'Laptop', 'Server', 'Cpu', 'HardDrive',
    'Clipboard', 'ClipboardList', 'FolderOpen', 'Archive', 'Tag', 'Layers',
    'PieChart', 'TrendingUp', 'DollarSign', 'ShoppingCart', 'Tool', 'AlertCircle', 'DatabaseIcon', 'DatabaseZapIcon'
];

const SYSTEM_SLUGS = ['dashboard', 'asset_master', 'maintenance', 'approvals', 'reports', 'users', 'roles', 'locations', 'settings'];

function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function ActionBadge({ action }) {
    const a = ALL_ACTIONS.find(x => x.key === action);
    if (!a) return (
        <span style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{action}</span>
    );
    return (
        <span style={{ background: 'var(--bg-hover)', color: a.color, border: `1px solid var(--border)`, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
            {a.label}
        </span>
    );
}

function DynamicIcon({ name, size = 16, color = 'currentColor' }) {
    const [Icon, setIcon] = useState(null);
    useEffect(() => {
        let cancelled = false;
        import('lucide-react').then(mod => { if (!cancelled) setIcon(() => mod[name] || mod['Package']); });
        return () => { cancelled = true; };
    }, [name]);
    if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
    return <Icon size={size} color={color} />;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function MenuModal({ menu, onClose, onSaved }) {
    const isEdit = !!menu;
    const isSystem = isEdit && SYSTEM_SLUGS.includes(menu.slug);

    const [name, setName] = useState(menu?.name || '');
    const [slug, setSlug] = useState(menu?.slug || '');
    const [icon, setIcon] = useState(menu?.icon || 'Package');
    const [order, setOrder] = useState(menu?.order ?? 99);
    const [selectedActions, setSelectedActions] = useState(menu?.availableActions || ['view']);
    const [isActive, setIsActive] = useState(menu?.isActive ?? true);
    const [saving, setSaving] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [showIconPicker, setShowIconPicker] = useState(false);

    useEffect(() => { if (!isEdit) setSlug(toSlug(name)); }, [name, isEdit]);

    const toggleAction = (key) => {
        setSelectedActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
    };

    const handleSave = async () => {
        if (!name.trim() || !slug.trim()) return toast.error('Name and slug required');
        if (selectedActions.length === 0) return toast.error('At least one action required');
        setSaving(true);
        try {
            const payload = { name, slug, icon, order: Number(order), availableActions: selectedActions, isActive };
            if (isEdit) { await api.put(`/menus/${menu.id}`, payload); toast.success('Menu updated!'); }
            else { await api.post('/menus', payload); toast.success('Menu created!'); }
            onSaved(); onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save menu');
        } finally { setSaving(false); }
    };

    const filteredIcons = ICON_OPTIONS.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase()));

    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none',
    };
    const labelStyle = { color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 0, borderRadius: 16 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MenuIcon size={20} color="var(--accent)" />
                        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                            {isEdit ? 'Edit Menu' : 'New Menu'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: 6 }}><X size={16} /></button>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Name + Slug */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Menu Name *</label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Asset Master" />
                        </div>
                        <div>
                            <label style={labelStyle}>Slug *</label>
                            <input
                                className="form-input" value={slug} onChange={e => setSlug(e.target.value)}
                                disabled={isSystem} placeholder="e.g. asset_master"
                                style={{ opacity: isSystem ? 0.5 : 1, cursor: isSystem ? 'not-allowed' : 'text' }}
                            />
                            {isSystem && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>System slug — cannot be changed</p>}
                        </div>
                    </div>

                    {/* Icon Picker + Order */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Icon</label>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className="btn btn-secondary"
                                    style={{ width: '100%', justifyContent: 'flex-start', gap: 10, fontWeight: 400, fontSize: 14 }}
                                >
                                    <DynamicIcon name={icon} size={16} color="var(--accent)" />
                                    <span style={{ color: 'var(--text-primary)' }}>{icon}</span>
                                </button>
                                {showIconPicker && (
                                    <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, zIndex: 10, padding: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                                        <input
                                            className="form-input" value={iconSearch} onChange={e => setIconSearch(e.target.value)}
                                            placeholder="Search icon..." style={{ marginBottom: 10, fontSize: 13 }}
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                                            {filteredIcons.map(ic => (
                                                <button
                                                    key={ic} onClick={() => { setIcon(ic); setShowIconPicker(false); }} title={ic}
                                                    style={{
                                                        padding: 8, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: icon === ic ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                                                        border: `1px solid ${icon === ic ? 'var(--accent)' : 'var(--border)'}`,
                                                    }}
                                                >
                                                    <DynamicIcon name={ic} size={16} color={icon === ic ? 'var(--accent)' : 'var(--text-muted)'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Order</label>
                            <input className="form-input" type="number" value={order} onChange={e => setOrder(e.target.value)} min={1} />
                        </div>
                    </div>

                    {/* Available Actions */}
                    <div>
                        <label style={labelStyle}>Available Actions</label>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
                            Selected actions appear as toggleable permissions in Role & User permission modals
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {ALL_ACTIONS.map(({ key, label, color }) => {
                                const active = selectedActions.includes(key);
                                return (
                                    <button
                                        key={key} onClick={() => toggleAction(key)}
                                        style={{
                                            padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                            border: `1px solid ${active ? 'var(--border)' : 'var(--border)'}`,
                                            background: active ? 'var(--bg-hover)' : 'transparent',
                                            color: active ? color : 'var(--text-muted)',
                                            transition: 'all 0.15s',
                                            boxShadow: active ? `inset 0 0 0 1px ${color}55` : 'none',
                                        }}
                                    >
                                        {active && <span style={{ marginRight: 4, fontSize: 11 }}>✓</span>}{label}
                                    </button>
                                );
                            })}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
                            {selectedActions.length} action{selectedActions.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>

                    {/* Active toggle */}
                    {isEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <div>
                                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: 0 }}>Menu Active</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>Inactive menus won't appear in sidebar</p>
                            </div>
                            <button onClick={() => setIsActive(!isActive)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                {isActive ? <ToggleRight size={32} color="var(--success)" /> : <ToggleLeft size={32} color="var(--text-muted)" />}
                            </button>
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.6 : 1 }}>
                            <Save size={15} />
                            {saving ? 'Saving...' : isEdit ? 'Update Menu' : 'Create Menu'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenusPage() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalMenu, setModalMenu] = useState(undefined);
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/menus');
            setMenus(res.data.data || []);
        } catch { toast.error('Failed to load menus'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (menu) => {
        if (!window.confirm(`Delete menu "${menu.name}"? This cannot be undone.`)) return;
        setDeleting(menu.id);
        try {
            await api.delete(`/menus/${menu.id}`);
            toast.success('Menu deleted');
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        } finally { setDeleting(null); }
    };

    const stats = [
        { label: 'Total', value: menus.length, color: 'var(--accent)', bg: 'var(--accent-glow)' },
        { label: 'Active', value: menus.filter(m => m.isActive).length, color: 'var(--success)', bg: 'rgba(0,214,143,0.1)' },
        { label: 'System', value: menus.filter(m => SYSTEM_SLUGS.includes(m.slug)).length, color: 'var(--warning)', bg: 'rgba(255,183,3,0.1)' },
        { label: 'Custom', value: menus.filter(m => !SYSTEM_SLUGS.includes(m.slug)).length, color: 'var(--info)', bg: 'rgba(51,154,240,0.1)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        Menu Management
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                        Define menus and their available actions — reflected across all role & user permission modals
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalMenu(null)}>
                    <Plus size={17} /> New Menu
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {stats.map(s => (
                    <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                        <p style={{ color: s.color, fontSize: 30, fontWeight: 700, marginTop: 4 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 20 }}>Order</th>
                                <th>Menu Name</th>
                                <th>Slug</th>
                                <th>Icon</th>
                                <th>Available Actions</th>
                                <th>Status</th>
                                <th>Type</th>
                                <th style={{ paddingRight: 20 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(8)].map((_, j) => (
                                            <td key={j} style={{ padding: 16 }}>
                                                <div className="skeleton" style={{ height: 14, borderRadius: 4 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : menus.map(menu => {
                                const isSystem = SYSTEM_SLUGS.includes(menu.slug);
                                return (
                                    <tr key={menu.id}>
                                        <td style={{ paddingLeft: 20, color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <GripVertical size={13} color="var(--border)" />
                                                {menu.order}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <DynamicIcon name={menu.icon || 'Package'} size={15} color="var(--accent)" />
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{menu.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <code className="font-mono" style={{ background: 'var(--bg-hover)', color: 'var(--accent)', padding: '3px 8px', borderRadius: 5, fontSize: 12, border: '1px solid var(--border)' }}>
                                                {menu.slug}
                                            </code>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{menu.icon}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {(menu.availableActions || []).map(a => <ActionBadge key={a} action={a} />)}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                background: menu.isActive ? 'rgba(0,214,143,0.12)' : 'var(--bg-hover)',
                                                color: menu.isActive ? 'var(--success)' : 'var(--text-muted)',
                                                border: `1px solid ${menu.isActive ? 'rgba(0,214,143,0.3)' : 'var(--border)'}`,
                                            }}>
                                                {menu.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                background: isSystem ? 'rgba(255,183,3,0.1)' : 'rgba(51,154,240,0.1)',
                                                color: isSystem ? 'var(--warning)' : 'var(--info)',
                                                border: `1px solid ${isSystem ? 'rgba(255,183,3,0.25)' : 'rgba(51,154,240,0.25)'}`,
                                            }}>
                                                {isSystem ? 'System' : 'Custom'}
                                            </span>
                                        </td>
                                        <td style={{ paddingRight: 20 }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => setModalMenu(menu)} title="Edit"><Edit2 size={14} /></button>
                                                {!isSystem && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(menu)}
                                                        disabled={deleting === menu.id}
                                                        title="Delete"
                                                        style={{ opacity: deleting === menu.id ? 0.5 : 1 }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && menus.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <MenuIcon size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                                        No menus found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalMenu !== undefined && (
                <MenuModal menu={modalMenu} onClose={() => setModalMenu(undefined)} onSaved={load} />
            )}
        </div>
    );
}