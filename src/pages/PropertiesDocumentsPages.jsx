import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  getProperties, getDocuments, uploadDocument, deleteDocument,
  getDocumentUrl, getFamilies
} from '../lib/supabase';
import {
  SectionHeader, Badge, PropIcon, DocIcon, EmptyState, Modal,
  formatCurrency, formatDate, formatFileSize
} from '../components/Shared';

// ─── All Properties ─────────────────────────────────────────
export function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getProperties().then(setProperties).finally(() => setLoading(false));
  }, []);

  const types = ['all', 'Residential', 'Commercial', 'Land', 'Industrial', 'Mixed Use'];
  const filtered = properties.filter(p => {
    const matchType = filter === 'all' || p.type === filter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.city || '').toLowerCase().includes(search.toLowerCase()) || (p.families?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalVal = filtered.reduce((s, p) => s + (p.estimated_value || 0), 0);

  return (
    <div className="page-content">
      <div className="card">
        <div className="sec-header">
          <div>
            <div className="sec-title">All Properties</div>
            <div className="sec-sub">{filtered.length} properties · Est. {formatCurrency(totalVal)}</div>
          </div>
          <div className="sec-actions">
            <input className="form-input" style={{ width: 200 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="tabs">
          {types.map(t => (
            <div key={t} className={`tab${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
              {t === 'all' ? `All (${properties.length})` : t}
            </div>
          ))}
        </div>

        {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div> :
          filtered.length === 0 ? <EmptyState icon="🏠" title="No properties" message="No properties match your filter." /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Property</th><th>Family</th><th>Type</th><th>Location</th><th>Est. Value</th><th>Purchase Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/families/${p.family_id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PropIcon type={p.type} />
                        <span className="td-bold">{p.name}</span>
                      </div>
                    </td>
                    <td className="td-muted">{p.families?.name || '—'}</td>
                    <td><Badge label={p.type} /></td>
                    <td className="td-muted">{[p.city, p.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="td-bold">{formatCurrency(p.estimated_value)}</td>
                    <td className="td-muted">{formatDate(p.purchase_date)}</td>
                    <td><Badge label={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Document Vault ─────────────────────────────────────────
export function DocumentsPage() {
  const [families, setFamilies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [filterFamily, setFilterFamily] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState(null);
  const [form, setForm] = useState({ familyId: '', propertyId: '', docType: 'insurance', expiryDate: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = () => Promise.all([getFamilies(), getProperties(), getDocuments()])
    .then(([f, p, d]) => { setFamilies(f); setProperties(p); setDocuments(d); })
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!form.familyId || acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        await uploadDocument({ file, familyId: form.familyId, propertyId: form.propertyId || null, docType: form.docType, expiryDate: form.expiryDate || null, notes: form.notes });
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      load();
    } finally { setUploading(false); }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled: !form.familyId || uploading });

  const handleOpenDoc = async (doc) => {
    try {
      const url = await getDocumentUrl(doc.file_path);
      window.open(url, '_blank');
    } catch { setViewDoc(doc); }
  };

  const handleDeleteDoc = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    await deleteDocument(doc.id, doc.file_path);
    load();
  };

  const familyProps = properties.filter(p => p.family_id === form.familyId);
  const filteredDocs = documents.filter(d => {
    const matchFamily = !filterFamily || d.family_id === filterFamily;
    const matchType = filterType === 'all' || d.doc_type === filterType;
    return matchFamily && matchType;
  });

  const docTypes = ['insurance', 'taxes', 'bills', 'legal', 'mortgage', 'hoa', 'inspection', 'title', 'other'];

  return (
    <div className="page-content">
      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Upload Panel */}
        <div className="card">
          <SectionHeader title="Upload Document" />
          <div className="form-group">
            <label className="form-label">Family *</label>
            <select className="form-input" value={form.familyId} onChange={e => { set('familyId', e.target.value); set('propertyId', ''); }}>
              <option value="">Select family...</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Property (optional)</label>
            <select className="form-input" value={form.propertyId} onChange={e => set('propertyId', e.target.value)} disabled={!form.familyId}>
              <option value="">General / All Properties</option>
              {familyProps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select className="form-input" value={form.docType} onChange={e => set('docType', e.target.value)}>
                {docTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-input" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
          </div>
          <div {...getRootProps()} className={`upload-zone${isDragActive ? ' drag-active' : ''}${!form.familyId ? '' : ''}`}>
            <input {...getInputProps()} />
            {uploading ? (
              <><div className="upload-zone-icon">⏳</div><div className="upload-zone-text">Uploading...</div></>
            ) : uploadSuccess ? (
              <><div className="upload-zone-icon" style={{ color: 'var(--success)' }}>✓</div><div className="upload-zone-text"><strong style={{ color: 'var(--success)' }}>Upload complete!</strong></div></>
            ) : (
              <>
                <div className="upload-zone-icon">⬆</div>
                <div className="upload-zone-text">
                  {!form.familyId ? 'Select a family first' : <><strong>Click to upload</strong> or drag & drop</>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>PDF, DOCX, XLSX, JPG, PNG · Max 50MB</div>
              </>
            )}
          </div>
        </div>

        {/* Recent Docs */}
        <div className="card">
          <SectionHeader title="Recently Uploaded" />
          {documents.slice(0, 8).map(d => (
            <div key={d.id} className="prop-row" onClick={() => handleOpenDoc(d)}>
              <div style={{ fontSize: 22 }}><DocIcon type={d.doc_type} /></div>
              <div className="prop-row-info">
                <div className="prop-row-name">{d.name}</div>
                <div className="prop-row-addr">{d.families?.name} · {d.properties?.name || 'General'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge label={d.doc_type} />
                {d.expiry_date && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>Exp: {formatDate(d.expiry_date)}</div>}
              </div>
              <button className="btn btn-icon btn-xs" onClick={e => { e.stopPropagation(); handleDeleteDoc(d); }}>🗑</button>
            </div>
          ))}
          {documents.length === 0 && <EmptyState icon="📁" title="No documents yet" message="Upload your first document." />}
        </div>
      </div>

      {/* Full Vault */}
      <div className="card">
        <SectionHeader title="Document Vault">
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-input" style={{ width: 160 }} value={filterFamily} onChange={e => setFilterFamily(e.target.value)}>
              <option value="">All Families</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </SectionHeader>
        <div className="tabs">
          {['all', ...docTypes].map(t => (
            <div key={t} className={`tab${filterType === t ? ' active' : ''}`} onClick={() => setFilterType(t)}>
              {t === 'all' ? `All (${documents.length})` : t}
            </div>
          ))}
        </div>

        {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div> :
          filteredDocs.length === 0 ? <EmptyState icon="📁" title="No documents" message="No documents match your filter." /> : (
          <div className="doc-grid">
            {filteredDocs.map(d => (
              <div key={d.id} className="doc-card" onClick={() => handleOpenDoc(d)}>
                <div className="doc-card-icon"><DocIcon type={d.doc_type} /></div>
                <div className="doc-card-name">{d.name}</div>
                <div className="doc-card-meta">{d.families?.name}</div>
                <div className="doc-card-meta">{d.properties?.name || 'General'}</div>
                {d.expiry_date && <div className="doc-card-exp">Exp: {formatDate(d.expiry_date)}</div>}
                <div style={{ marginTop: 4 }}><Badge label={d.doc_type} /></div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{formatFileSize(d.file_size)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
