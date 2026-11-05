import React, { useState, useEffect } from 'react';
import { STAGES, currentStage } from '../stages';
import { useAuth } from '../auth/AuthContext';
import { saveLevel } from '../services/progress';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard',  icon: '🏠', label: 'Dashboard'       },
  { path: '/notes',      icon: '📚', label: 'Notes'           },
  { path: '/audio',      icon: '🎤', label: 'Audio Practice'  },
  { path: '/videos',     icon: '🎬', label: 'Videos'          },
  { path: '/books',      icon: '📖', label: 'Books'           },
  { path: '/chat',       icon: '💬', label: 'Live Chat'       },
  { path: '/progress',   icon: '📊', label: 'Progress'        },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [level, setLevel] = useState(
    currentStage()
  );

  const handleLevelChange = (e) => {
    const newLevel = parseInt(e.target.value);
    setLevel(newLevel);
    localStorage.setItem('userLevel', newLevel);
    window.dispatchEvent(new Event('levelChanged'));
    saveLevel(newLevel).catch(() => {});
  };

  // Pick up the level loaded from the user's profile after login
  useEffect(() => {
    const sync = () => setLevel(currentStage());
    window.addEventListener('levelChanged', sync);
    return () => window.removeEventListener('levelChanged', sync);
  }, []);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-icon">🗣️</span>
        <div>
          <div className="logo-title">EnglishAI</div>
          <div className="logo-sub">Communication Coach</div>
        </div>
      </div>

      {/* Level Selector */}
      <div className="level-selector">
        <label>Your Stage</label>
        <select value={level} onChange={handleLevelChange}>
          {STAGES.map((st) => (
            <option key={st.n} value={st.n}>
              Stage {st.n} — {st.name}{st.optional ? ' (optional)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="streak-badge">🔥 Keep learning daily!</div>
        {user && (
          <div className="user-box">
            <div className="user-email" title={user.email}>{user.email}</div>
            <button className="logout-btn" onClick={logout}>Log out</button>
          </div>
        )}
      </div>
    </aside>
  );
}
