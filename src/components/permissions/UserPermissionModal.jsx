import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchUserPermissions, saveUserPermissions, resetUserPermissions,
    togglePermission, clearEditingUser
} from '../../store/slices/permissionSlice';
import { X, Shield, RotateCcw, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_LABELS = {
    view: 'View', new: 'New', edit: 'Edit',
    delete: 'Delete', import: 'Import', export: 'Export',
    approve: 'Approve', reject: 'Reject',
};

const ACTION_COLORS = {
    view: '#00d4ff', new: '#00d68f', edit: '#ffb703',
    delete: '#ff4757', import: '#7c3aed', export: '#ff8c42',
    approve: '#00d68f', reject: '#ff4757',
};

export default function UserPermissionModal({ userId, userName, onClose }) {
    const dispatch = useDispatch();
    const { editingUser, editingPermissions, permissionSource, isLoading } = useSelector(s => s.permissions);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchUserPermissions(userId));
        return () => dispatch(clearEditingUser());
    }, [userId]);

    const handleToggle = (menuId, action, value) => {
        dispatch(togglePermission({ menuId, action, value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await dispatch(saveUserPermissions({
                userId,
                permissions: editingPermissions.map(p => ({ menuId: p.menuId, actions: p.actions })),
            }));
            if (result.error) throw new Error(result.payload);
            toast.success('Permissions saved successfully!');
            onClose(true);
        } catch (err) {
            toast.error(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Reset to role default permissions? All custom permissions will be removed.')) return;
        const result = await dispatch(resetUserPermissions(userId));
        if (!result.error) {
            toast.success('Reset to role defaults');
            onClose(true);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose(false)}>
            <div className="modal" style={{ maxWidth: 780, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header" style={{ flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={18} color="#050b14" />
                        </div>
                        <div>
                            <h2 className="modal-title" style={{ marginBottom: 0 }}>Manage Permissions</h2>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                {editingUser ? `${editingUser.firstName} ${editingUser.lastName}` : userName}
                                {editingUser?.role && (
                                    <span style={{ marginLeft: 8, padding: '1px 8px', background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: 10, fontSize: 11 }}>
                                        {editingUser.role}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => onClose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {!isLoading && (
                    <div style={{ padding: '8px 20px', background: permissionSource === 'user' ? 'rgba(255,183,3,0.08)' : 'rgba(0,212,255,0.06)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Info size={14} color={permissionSource === 'user' ? '#ffb703' : 'var(--accent)'} />
                        <span style={{ fontSize: 12, color: permissionSource === 'user' ? '#ffb703' : 'var(--accent)' }}>
                            {permissionSource === 'user'
                                ? 'Custom permissions active — showing user specific permissions'
                                : 'Showing role default permissions — save to create custom permissions'}
                        </span>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="spinner" style={{ width: 32, height: 32 }} />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {editingPermissions.map((perm) => {
                                const hasAnyAccess = Object.values(perm.actions).some(v => v === true);
                                return (
                                    <div key={perm.menuId} style={{
                                        background: hasAnyAccess ? 'var(--bg-card)' : 'var(--bg-hover)',
                                        border: `1px solid ${hasAnyAccess ? 'var(--border)' : 'transparent'}`,
                                        borderRadius: 10, padding: '12px 16px',
                                        opacity: hasAnyAccess ? 1 : 0.6,
                                        transition: 'all 0.15s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 130, color: hasAnyAccess ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                {perm.menuName}
                                            </span>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {(perm.availableActions || []).map(action => {
                                                    const isOn = perm.actions[action] === true;
                                                    const color = ACTION_COLORS[action] || '#64748b';
                                                    return (
                                                        <button key={action} onClick={() => handleToggle(perm.menuId, action, !isOn)}
                                                            style={{
                                                                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                                cursor: 'pointer', transition: 'all 0.15s',
                                                                background: isOn ? `${color}20` : 'var(--bg-hover)',
                                                                color: isOn ? color : 'var(--text-muted)',
                                                                border: `1px solid ${isOn ? `${color}50` : 'var(--border)'}`,
                                                            }}>
                                                            {ACTION_LABELS[action] || action}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={handleReset}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RotateCcw size={14} /> Reset to Role Default
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : <><Save size={14} style={{ marginRight: 4 }} /> Save Permissions</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}