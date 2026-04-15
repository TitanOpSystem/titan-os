import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { FamiliesPage, FamilyDetailPage } from './pages/FamiliesPage';
import { PropertiesPage, DocumentsPage } from './pages/PropertiesDocumentsPages';
import DeadlinesPage from './pages/DeadlinesPage';
import './styles.css';

const pageTitles = {
  '/': ['Portfolio Dashboard', 'PCM Family Office › Overview'],
  '/families': ['Family Management', 'PCM Family Office › Families'],
  '/properties': ['All Properties', 'PCM Family Office › Portfolio › Properties'],
  '/documents': ['Document Vault', 'PCM Family Office › Portfolio › Documents'],
  '/deadlines': ['Deadlines & Renewals', 'PCM Family Office › Deadlines'],
};

function Topbar() {
  const location = useLocation();
  const isFamilyDetail = location.pathname.startsWith('/families/') && location.pathname.length > '/families/'.length;
  const entry = pageTitles[location.pathname];
  const title = isFamilyDetail ? 'Family Detail' : (entry ? entry[0] : 'PCM Family Office');
  const crumb = isFamilyDetail ? 'PCM Family Office › Families › Detail' : (entry ? entry[1] : '');

  return (
    <div className="topbar">
      <div className="topbar-title-wrap">
        <div className="topbar-title">{title}</div>
        <div className="topbar-crumb">{crumb}</div>
      </div>
      <div className="search-box">
        <span className="search-icon">⌕</span>
        <input type="text" placeholder="Search..." />
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="logo-pcm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: 'var(--navy)', fontWeight: 600 }}>PCM</div>
      <div className="spinner spinner-lg" style={{ marginTop: 20 }} />
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/families" element={<FamiliesPage />} />
          <Route path="/families/:id" element={<FamilyDetailPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/deadlines" element={<DeadlinesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
