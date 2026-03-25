import React from 'react';
import { useSelector } from 'react-redux';

export default function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.4s ease' }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Manage your account and system preferences</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Account Information</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#050b14' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
              <div style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'capitalize', marginTop: 2 }}>{user?.role}</div>
            </div>
          </div>
          {[
            { label: 'Email', value: user?.email || '—' },
            { label: 'Department', value: user?.department || '—' },
            { label: 'Phone', value: user?.phone || '—' },
            { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>System Information</h3>
          {[
            { label: 'Application', value: 'AssetFlow AMS v1.0.0' },
            { label: 'AI Model', value: 'Claude (Anthropic)' },
            { label: 'Database', value: 'MySQL + Sequelize' },
            { label: 'Backend', value: 'Node.js + Express.js' },
            { label: 'Frontend', value: 'React + Redux Toolkit' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
