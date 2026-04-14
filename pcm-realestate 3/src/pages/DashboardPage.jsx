import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFamilies, getProperties, getDeadlines, getActivity, getDocuments } from '../lib/supabase';
import { StatCard, SectionHeader, Badge, formatCurrency, formatDate, daysUntil, timeAgo, Spinner } from '../components/Shared';

export default function DashboardPage() {
  const [families, setFamilies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [activity, setActivity] = useState([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getFamilies(), getProperties(), getDeadlines(), getActivity(8), getDocuments()
    ]).then(([f, p, d, a, docs]) => {
      setFamilies(f); setProperties(p); setDeadlines(d); setActivity(a); setDocCount(docs.length);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner spinner-lg" />
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading portfolio...</p>
    </div>
  );

  const totalValue = properties.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const urgentDeadlines = deadlines.filter(d => daysUntil(d.due_date) <= 60);

  return (
    <div className="page-content">
      {urgentDeadlines.length > 0 && (
        <div className="alert-bar">
          ⚠ <strong>{urgentDeadlines.length} deadline{urgentDeadlines.length > 1 ? 's' : ''}</strong> require attention within 60 days
          <span style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/deadlines')}>View all →</span>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Families Managed" value={families.length} sub="Active portfolios" />
        <StatCard label="Total Properties" value={properties.length} sub="Across all families" />
        <StatCard label="Portfolio Value" value={formatCurrency(totalValue)} sub="Estimated market value" />
        <StatCard label="Documents" value={docCount} sub="In document vault" />
      </div>

      <div className="grid-2">
        <div className="card">
          <SectionHeader title="Family Portfolios" sub="Click to view family details" />
          {families.map(f => {
            const fProps = properties.filter(p => p.family_id === f.id);
            const fVal = fProps.reduce((s, p) => s + (p.estimated_value || 0), 0);
            return (
              <div key={f.id} className="prop-row" onClick={() => navigate(`/families/${f.id}`)}>
                <div className="prop-row-icon" style={{ background: f.color + '22', fontSize: 18 }}>◈</div>
                <div className="prop-row-info">
                  <div className="prop-row-name">{f.name}</div>
                  <div className="prop-row-addr">{fProps.length} properties · Advisor: {f.advisor || '—'}</div>
                </div>
                <div>
                  <div className="prop-row-val">{formatCurrency(fVal)}</div>
                </div>
              </div>
            );
          })}
          {families.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>No families yet. <span style={{ color: 'var(--navy)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/families')}>Add one →</span></p>
          )}
        </div>

        <div className="card">
          <SectionHeader title="Recent Activity" />
          {activity.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No activity yet.</p>}
          {activity.map(a => (
            <div key={a.id} className="activity-item">
              <div className="activity-dot" style={{ background: a.families?.color || '#092b49' }} />
              <div className="activity-text">{a.action}</div>
              <div className="activity-time">{timeAgo(a.created_at)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gold-divider" />

      <div className="card">
        <SectionHeader title="Upcoming Deadlines">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/deadlines')}>View All</button>
        </SectionHeader>
        {deadlines.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No upcoming deadlines.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Item</th><th>Family</th><th>Type</th><th>Due Date</th><th>Days Left</th><th>Priority</th></tr>
              </thead>
              <tbody>
                {deadlines.slice(0, 5).map(d => {
                  const days = daysUntil(d.due_date);
                  return (
                    <tr key={d.id}>
                      <td className="td-bold">{d.title}</td>
                      <td className="td-muted">{d.families?.name || '—'}</td>
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
      </div>
    </div>
  );
}
