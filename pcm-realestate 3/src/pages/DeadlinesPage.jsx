import React, { useEffect, useState } from 'react';
import { getDeadlines, createDeadline, completeDeadline, deleteDeadline, getFamilies, getProperties } from '../lib/supabase';
import { SectionHeader, Badge, EmptyState, Modal, formatDate, daysUntil } from '../components/Shared';

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState([]);
  const [families, setFamilies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([getDeadlines(), getFamilies(), getProperties()])
    .then(([d, f, p]) => { setDeadlines(d); setFamilies(f); setProperties(p); })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleComplete = async (id) => { await completeDeadline(id); load(); };
  const handleDelete = async (id) => { if (window.confirm('Delete this deadline?')) { await deleteDeadline(id); load(); } };

  const filters = ['all', 'high', 'medium', 'low'];
  const filtered = filter === 'all' ? deadlines : deadlines.filter(d => d.priority === filter);
  const overdue = deadlines.filter(d => daysUntil(d.due_date) < 0);
  const urgent = deadlines.filter(d => { const n = daysUntil(d.due_date); return n >= 0 && n <= 30; });

  return (
    <div className="page-content">
      {overdue.length > 0 && (
        <div className="alert-bar" style={{ background: 'var(--danger-bg)', borderColor: '#f5c0bb', color: 'var(--danger)' }}>
          🚨 <strong>{overdue.length} overdue deadline{overdue.length > 1 ? 's' : ''}</strong> require immediate attention
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Upcoming</div>
          <div className="stat-value">{deadlines.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Due Within 30 Days</div>
          <div className="stat-value" style={{ color: urgent.length > 0 ? 'var(--warn)' : 'inherit' }}>{urgent.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: overdue.length > 0 ? 'var(--danger)' : 'inherit' }}>{overdue.length}</div>
        </div>
      </div>

      <div className="card">
        <SectionHeader title="Deadlines & Renewals">
          <button className="btn btn-gold btn-sm" onClick={() => setShowAdd(true)}>+ Add Deadline</button>
        </SectionHeader>

        <div className="tabs">
          {filters.map(f => (
            <div key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${deadlines.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="◷" title="No deadlines" message="All clear! No upcoming deadlines." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Family</th><th>Property</th><th>Type</th><th>Due Date</th><th>Days Left</th><th>Priority</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const days = daysUntil(d.due_date);
                  return (
                    <tr key={d.id}>
                      <td className="td-bold">{d.title}</td>
                      <td className="td-muted">{d.families?.name || '—'}</td>
                      <td className="td-muted">{d.properties?.name || '—'}</td>
                      <td><Badge label={d.deadline_type} /></td>
                      <td>{formatDate(d.due_date)}</td>
                      <td style={{ fontWeight: 600, color: days < 0 ? 'var(--danger)' : days <= 14 ? 'var(--danger)' : days <= 30 ? 'var(--warn)' : 'var(--success)' }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                      </td>
                      <td><Badge label={d.priority} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-xs btn-outline" title="Mark complete" onClick={() => handleComplete(d.id)}>✓</button>
                          <button className="btn btn-xs btn-icon" title="Delete" onClick={() => handleDelete(d.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddDeadlineModal families={families} properties={properties} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}
    </div>
  );
}

function AddDeadlineModal({ families, properties, onClose, onSaved }) {
  const [form, setForm] = useState({ family_id: '', property_id: '', title: '', due_date: '', deadline_type: 'Insurance', priority: 'medium', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const familyProps = properties.filter(p => p.family_id === form.family_id);

  const handleSave = async () => {
    if (!form.title.trim() || !form.due_date || !form.family_id) return;
    setSaving(true);
    try {
      await createDeadline({ ...form, property_id: form.property_id || null });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Add Deadline" sub="Track an upcoming deadline or renewal" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-gold" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Deadline'}</button></>}>
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Flood Insurance Renewal" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Family *</label>
          <select className="form-input" value={form.family_id} onChange={e => { set('family_id', e.target.value); set('property_id', ''); }}>
            <option value="">Select family...</option>
            {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Property (optional)</label>
          <select className="form-input" value={form.property_id} onChange={e => set('property_id', e.target.value)} disabled={!form.family_id}>
            <option value="">All / General</option>
            {familyProps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-input" value={form.deadline_type} onChange={e => set('deadline_type', e.target.value)}>
            {['Tax','Insurance','Legal','Mortgage','HOA','Other'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Due Date *</label>
        <input className="form-input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
      </div>
    </Modal>
  );
}
