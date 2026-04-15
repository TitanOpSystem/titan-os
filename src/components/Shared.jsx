import React from 'react';

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ large }) {
  return <div className={large ? 'spinner spinner-lg' : 'spinner'} />;
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon = '📂', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
const badgeMap = {
  Active: 'badge-green', Sold: 'badge-gray', Pending: 'badge-warn', 'Under Contract': 'badge-gold',
  high: 'badge-red', medium: 'badge-warn', low: 'badge-navy',
  insurance: 'badge-navy', taxes: 'badge-gold', bills: 'badge-gray',
  legal: 'badge-navy', mortgage: 'badge-navy', hoa: 'badge-gold',
  inspection: 'badge-gray', title: 'badge-navy', other: 'badge-gray',
  Residential: 'badge-navy', Commercial: 'badge-gold', Land: 'badge-green',
  Industrial: 'badge-gray', 'Mixed Use': 'badge-warn',
  Tax: 'badge-gold', Insurance: 'badge-navy', Legal: 'badge-gray',
  Mortgage: 'badge-navy', HOA: 'badge-warn', Other: 'badge-gray',
};
export function Badge({ label }) {
  const cls = badgeMap[label] || 'badge-gray';
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Property type icon ────────────────────────────────────────
const typeIcons = { Residential: '🏡', Commercial: '🏢', Land: '🌿', Industrial: '🏭', 'Mixed Use': '🏙️' };
export function PropIcon({ type }) {
  return <span style={{ fontSize: 16 }}>{typeIcons[type] || '🏠'}</span>;
}

// ── Doc type icon ─────────────────────────────────────────────
const docIcons = { insurance: '📄', taxes: '📋', bills: '🧾', legal: '📜', mortgage: '🏦', hoa: '🏘️', inspection: '🔍', title: '📜', other: '📁' };
export function DocIcon({ type }) {
  return <span style={{ fontSize: 24 }}>{docIcons[type] || '📁'}</span>;
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────
export function SectionHeader({ title, sub, children }) {
  return (
    <div className="sec-header">
      <div>
        <div className="sec-title">{title}</div>
        {sub && <div className="sec-sub">{sub}</div>}
      </div>
      {children && <div className="sec-actions">{children}</div>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ title, sub, onClose, children, footer }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {sub && <div className="modal-sub">{sub}</div>}
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────
export function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>{message}</p>
    </Modal>
  );
}

// ── Format helpers ────────────────────────────────────────────
export function formatCurrency(val) {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr + 'T00:00:00').getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}
