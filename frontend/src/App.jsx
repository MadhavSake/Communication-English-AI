import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Notes from './pages/Notes/Notes';
import AudioPractice from './pages/AudioPractice/AudioPractice';
import Videos from './pages/Videos/Videos';
import Books from './pages/Books/Books';
import LiveChat from './pages/LiveChat/LiveChat';
import Progress from './pages/Progress/Progress';
import Login from './pages/Login/Login';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { firebaseReady } from './firebase';
import './App.css';
import './pages/Login/Login.css';

function Shell() {
  const { user, loading } = useAuth();
  if (firebaseReady && loading) return <div className="app-loading">Loading…</div>;
  if (firebaseReady && !user) return <Login />;
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/audio" element={<AudioPractice />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/books" element={<Books />} />
            <Route path="/chat" element={<LiveChat />} />
            <Route path="/progress" element={<Progress />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

export default App;
