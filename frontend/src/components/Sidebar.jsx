import React, { useState } from 'react';
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
  const [level, setLevel] = useState(
    parseInt(localStorage.getItem('userLevel') || '1')
  );

  const handleLevelChange = (e) => {
    const newLevel = parseInt(e.target.value);
    setLevel(newLevel);
    localStorage.setItem('userLevel', newLevel);
    window.dispatchEvent(new Event('levelChanged'));
  };

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
        <label>Your Level</label>
        <select value={level} onChange={handleLevelChange}>
          <option value={1}>Level 1 — Absolute Beginner</option>
          <option value={2}>Level 2 — Beginner</option>
          <option value={3}>Level 3 — Elementary</option>
          <option value={4}>Level 4 — Pre-Intermediate</option>
          <option value={5}>Level 5 — Intermediate</option>
          <option value={6}>Level 6 — Upper-Intermediate</option>
          <option value={7}>Level 7 — Advanced</option>
          <option value={8}>Level 8 — IELTS 5.5</option>
          <option value={9}>Level 9 — IELTS 6.0</option>
          <option value={10}>Level 10 — IELTS 6.5</option>
          <option value={11}>Level 11 — IELTS 7.0</option>
          <option value={12}>Level 12 — IELTS 7.5</option>
          <option value={13}>Level 13 — IELTS 8.0</option>
          <option value={14}>Level 14 — IELTS 8.5</option>
          <option value={15}>Level 15 — IELTS 9.0</option>
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
      </div>
    </aside>
  );
}
