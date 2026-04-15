import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getFamilies, signOut } from '../lib/supabase';
import { getDeadlines } from '../lib/supabase';

export default function Sidebar() {
  const [families, setFamilies] = useState([]);
  const [urgentCount, setUrgentCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getFamilies().then(setFamilies).catch(() => {});
    getDeadlines().then(d => {
      setUrgentCount(d.filter(x => x.priority === 'high').length);
    }).catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-pcm">PCM</div>
        <div className="logo-sub">Family Office</div>
        <div className="logo-line" />
      </div>
      <div className="sidebar-tagline">Discover · Simplify · Execute</div>

      <div className="nav-section">
        <div className="nav-label">Overview</div>
        <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">⬡</span> Dashboard
        </NavLink>
        <NavLink to="/families" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">◈</span> Families
        </NavLink>
      </div>

      <div className="nav-section">
        <div className="nav-label">Portfolio</div>
        <NavLink to="/properties" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">⌂</span> All Properties
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">◻</span> Document Vault
        </NavLink>
        <NavLink to="/deadlines" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">◷</span> Deadlines
          {urgentCount > 0 && <span className="notif-badge">{urgentCount}</span>}
        </NavLink>
      </div>

      {families.length > 0 && (
        <div className="nav-section">
          <div className="nav-label">Families</div>
          {families.map(f => (
            <NavLink key={f.id} to={`/families/${f.id}`} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <span className="family-dot" style={{ background: f.color || '#092b49' }} />
              {f.name.replace(' Family', '')}
            </NavLink>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        <p style={{ marginBottom: 8 }}>PCM REAL ESTATE CRM v1.0</p>
        <button className="btn btn-outline btn-xs" style={{ color: 'rgba(255,255,255,.4)', borderColor: 'rgba(255,255,255,.15)', width: '100%' }} onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
