import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getFamilies, createFamily, updateFamily, deleteFamily,
  getProperties, createProperty, deleteProperty,
  getDocuments, getDeadlines
} from '../lib/supabase';
import {
  StatCard, SectionHeader, Badge, PropIcon, DocIcon,
  Modal, ConfirmModal, EmptyState, Spinner,
  formatCurrency, formatDate, daysUntil
} from '../components/Shared';

// ─── Families List ──────────────────────────────────────────
export function FamiliesPage() {
  const [families, setFamilies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  const load = () => Promise.all([getFamilies(), getProperties()])
    .then(([f, p]) => { setFamilies(f); setProperties(p); })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const accentColors = ['#092b49', '#ceb684', '#4a7c9e', '#8b6b35', '#2e7d5e', '#7b3f6e'];

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Add Family</button>
      </div>

      {families.length === 0 ? (
        <EmptyState icon="◈" title="No families yet" message="Add your first family to get started." action={<button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Add Family</button>} />
      ) : (
        <div className="grid-2">
          {families.map((f, i) => {
            const fProps = properties.filter(p => p.family_id === f.id);
            const fVal = fProps.reduce((s, p) => s + (p.estimated_value || 0), 0);
            return (
              <div key={f.id} className="family-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/families/${f.id}`)}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: f.color || accentColors[i % accentColors.length] }} />
                <div className="family-card-name">{f.name}</div>
                <div className="family-card-advisor">{f.advisor ? `Advisor: ${f.advisor}` : 'No advisor assigned'}</div>
                <div className="family-card-stats">
                  <div>
                    <div className="family-stat-label">Properties</div>
                    <div className="family-stat-value">{fProps.length}</div>
                  </div>
                  <div>
                    <div className="family-stat-label">Est. Value</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--navy)', marginTop: 2 }}>{formatCurrency(fVal)}</div>
                  </div>
                  <div>
                    <div className="family-stat-label">Advisor</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{f.advisor || '—'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddFamilyModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

// ─── Family Detail ──────────────────────────────────────────
export function FamilyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [properties, setProperties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [tab, setTab] = useState('properties');
  const [loading, setLoading] = useState(true);
  const [showAddProp, setShowAddProp] = useState(false);
  const [showEditFamily, setShowEditFamily] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => Promise.all([
    getFamilies(), getProperties(id), getDocuments({ familyId: id }), getDeadlines(id)
  ]).then(([fams, props, docs, dl]) => {
    setFamily(fams.find(f => f.id === id));
    setProperties(props);
    setDocuments(docs);
    setDeadlines(dl);
  }).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const handleDeleteFamily = async () => {
    await deleteFamily(id);
    navigate('/families');
  };

  const handleDeleteProp = async (propId) => {
    await deleteProperty(propId);
    setConfirmDelete(null);
    load();
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  if (!family) return <div className="page-content"><p>Family not found.</p></div>;

  const totalVal = properties.reduce((s, p) => s + (p.estimated_value || 0), 0);

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={() => setShowEditFamily(true)}>Edit Family</button>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ type: 'family' })}>Delete</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Properties" value={properties.length} />
        <StatCard label="Portfolio Value" value={formatCurrency(totalVal)} />
        <StatCard label="Documents" value={documents.length} />
        <StatCard label="Advisor" value={family.advisor || '—'} />
      </div>

      <div className="card">
        <div className="tabs">
          {['properties', 'documents', 'deadlines'].map(t => (
            <div key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'deadlines' && deadlines.filter(d => daysUntil(d.due_date) <= 60).length > 0 && (
                <span className="notif-badge" style={{ marginLeft: 6 }}>{deadlines.filter(d => daysUntil(d.due_date) <= 60).length}</span>
              )}
            </div>
          ))}
        </div>

        {tab === 'properties' && (
          <>
            <SectionHeader title="Properties">
              <button className="btn btn-gold btn-sm" onClick={() => setShowAddProp(true)}>+ Add Property</button>
            </SectionHeader>
            {properties.length === 0 ? (
              <EmptyState icon="🏠" title="No properties" message="Add the first property for this family." action={<button className="btn btn-gold btn-sm" onClick={() => setShowAddProp(true)}>+ Add Property</button>} />
            ) : (
              properties.map(p => (
                <div key={p.id} className="prop-row" onClick={() => navigate(`/properties/${p.id}`)}>
                  <div className="prop-row-icon"><PropIcon type={p.type} /></div>
                  <div className="prop-row-info">
                    <div className="prop-row-name">{p.name}</div>
                    <div className="prop-row-addr">{[p.address, p.city, p.state].filter(Boolean).join(', ')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="prop-row-val">{formatCurrency(p.estimated_value)}</div>
                    <div style={{ marginTop: 3, display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Badge label={p.type} />
                      <Badge label={p.status} />
                    </div>
                  </div>
                  <button className="btn btn-icon btn-xs" style={{ marginLeft: 4 }} onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'property', id: p.id, name: p.name }); }}>🗑</button>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'documents' && (
          <>
            <SectionHeader title="Documents">
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/documents')}>Upload</button>
            </SectionHeader>
            {documents.length === 0 ? (
              <EmptyState icon="📂" title="No documents" message="Upload documents for this family." />
            ) : (
              <div className="doc-grid">
                {documents.map(d => (
                  <div key={d.id} className="doc-card">
                    <div className="doc-card-icon"><DocIcon type={d.doc_type} /></div>
                    <div className="doc-card-name">{d.name}</div>
                    <div className="doc-card-meta">{d.properties?.name || 'General'}</div>
                    {d.expiry_date && (
                      <div className="doc-card-exp">Exp: {formatDate(d.expiry_date)}</div>
                    )}
                    <div style={{ marginTop: 4 }}><Badge label={d.doc_type} /></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'deadlines' && (
          <>
            <SectionHeader title="Deadlines" />
            {deadlines.length === 0 ? (
              <EmptyState icon="◷" title="No deadlines" message="No upcoming deadlines for this family." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Type</th><th>Due Date</th><th>Days Left</th><th>Priority</th></tr>
                  </thead>
                  <tbody>
                    {deadlines.map(d => {
                      const days = daysUntil(d.due_date);
                      return (
                        <tr key={d.id}>
                          <td className="td-bold">{d.title}</td>
                          <td><Badge label={d.deadline_type} /></td>
                          <td>{formatDate(d.due_date)}</td>
                          <td style={{ color: days <= 14 ? 'var(--danger)' : days <= 30 ? 'var(--warn)' : 'inherit', fontWeight: 500 }}>
                            {days < 0 ? 'Overdue' : days === 0 ? 'Today' : `${days}d`}
                          </td>
                          <td><Badge label={d.priority} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showAddProp && (
        <AddPropertyModal familyId={id} onClose={() => setShowAddProp(false)} onSaved={() => { setShowAddProp(false); load(); }} />
      )}
      {showEditFamily && (
        <AddFamilyModal existing={family} onClose={() => setShowEditFamily(false)} onSaved={() => { setShowEditFamily(false); load(); }} />
      )}
      {confirmDelete?.type === 'family' && (
        <ConfirmModal title="Delete Family" message={`Delete ${family.name} and all its data? This cannot be undone.`} danger onConfirm={handleDeleteFamily} onCancel={() => setConfirmDelete(null)} />
      )}
      {confirmDelete?.type === 'property' && (
        <ConfirmModal title="Delete Property" message={`Delete "${confirmDelete.name}"? This cannot be undone.`} danger onConfirm={() => handleDeleteProp(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

// ─── Add/Edit Family Modal ───────────────────────────────────
function AddFamilyModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState({ name: existing?.name || '', advisor: existing?.advisor || '', color: existing?.color || '#092b49', notes: existing?.notes || '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (existing) await updateFamily(existing.id, form);
      else await createFamily(form);
      onSaved();
    } finally { setSaving(false); }
  };

  const colors = ['#092b49', '#293d5c', '#4a7c9e', '#ceb684', '#8b6b35', '#2e7d5e', '#7b3f6e', '#4a3728'];

  return (
    <Modal title={existing ? 'Edit Family' : 'Add New Family'} sub="Enter family details" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-gold" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : existing ? 'Save Changes' : 'Add Family'}</button></>}>
      <div className="form-group">
        <label className="form-label">Family Name *</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Harrington Family" />
      </div>
      <div className="form-group">
        <label className="form-label">Advisor</label>
        <input className="form-input" value={form.advisor} onChange={e => set('advisor', e.target.value)} placeholder="Advisor name" />
      </div>
      <div className="form-group">
        <label className="form-label">Accent Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {colors.map(c => (
            <div key={c} onClick={() => set('color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid var(--gold)' : '3px solid transparent', outline: form.color === c ? '1px solid var(--navy)' : 'none' }} />
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this family..." />
      </div>
    </Modal>
  );
}

// ─── Add Property Modal ──────────────────────────────────────
function AddPropertyModal({ familyId, onClose, onSaved }) {
  const [form, setForm] = useState({ family_id: familyId, name: '', address: '', city: '', state: '', zip: '', type: 'Residential', estimated_value: '', purchase_date: '', status: 'Active', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createProperty({ ...form, estimated_value: form.estimated_value ? parseFloat(form.estimated_value.replace(/,/g, '')) : null, purchase_date: form.purchase_date || null });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Add Property" sub="Enter property details" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-gold" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Property'}</button></>}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Property Type</label>
          <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
            {['Residential','Commercial','Land','Industrial','Mixed Use'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            {['Active','Pending','Under Contract','Sold'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Property Name / Nickname *</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Palm Beach Estate" />
      </div>
      <div className="form-group">
        <label className="form-label">Street Address</label>
        <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" value={form.state} onChange={e => set('state', e.target.value)} placeholder="FL" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Estimated Value ($)</label>
          <input className="form-input" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Purchase Date</label>
          <input className="form-input" type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." />
      </div>
    </Modal>
  );
}
