import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyPrompt, getAllLevels } from '../../services/api';
import './Dashboard.css';

const modules = [
  { path: '/notes',    icon: '📚', label: 'Notes',          desc: 'Study level-wise notes'       },
  { path: '/audio',    icon: '🎤', label: 'Audio Practice', desc: 'Record & get AI feedback'     },
  { path: '/videos',   icon: '🎬', label: 'Videos',         desc: 'Watch curated lessons'        },
  { path: '/books',    icon: '📖', label: 'Books',          desc: 'Read recommended books'       },
  { path: '/chat',     icon: '💬', label: 'Live Chat',      desc: 'Practice with AI partner'     },
  { path: '/progress', icon: '📊', label: 'Progress',       desc: 'Track your improvement'       },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [level, setLevel]             = useState(parseInt(localStorage.getItem('userLevel') || '1'));
  const [dailyPrompt, setDailyPrompt] = useState(null);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    fetchDailyPrompt(level);
    const handler = () => {
      const newLevel = parseInt(localStorage.getItem('userLevel') || '1');
      setLevel(newLevel);
      fetchDailyPrompt(newLevel);
    };
    window.addEventListener('levelChanged', handler);
    return () => window.removeEventListener('levelChanged', handler);
  }, []);

  const fetchDailyPrompt = async (lvl) => {
    setLoading(true);
    try {
      const res = await getDailyPrompt(lvl);
      setDailyPrompt(res.data);
    } catch {
      setDailyPrompt({ topic: 'Introduce Yourself', prompt: 'Tell me about yourself in English.', key_vocabulary: ['name','age','hobby','work','live'] });
    } finally {
      setLoading(false);
    }
  };

  const levelNames = {
    1:'Absolute Beginner',2:'Beginner',3:'Elementary',4:'Pre-Intermediate',
    5:'Intermediate',6:'Upper-Intermediate',7:'Advanced',
    8:'IELTS 5.5',9:'IELTS 6.0',10:'IELTS 6.5',11:'IELTS 7.0',
    12:'IELTS 7.5',13:'IELTS 8.0',14:'IELTS 8.5',15:'IELTS 9.0',
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back! 👋</h1>
          <p>Ready to improve your English today?</p>
        </div>
        <div className="level-badge">
          <span className="level-num">Level {level}</span>
          <span className="level-name">{levelNames[level]}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">7</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{level}</div>
          <div className="stat-label">Current Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{15 - level}</div>
          <div className="stat-label">Levels to Go</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{Math.round((level / 15) * 100)}%</div>
          <div className="stat-label">Overall Progress</div>
        </div>
      </div>

      {/* Daily Prompt */}
      <div className="daily-prompt-card">
        <div className="daily-prompt-header">
          <span>✨ Today's Practice Prompt</span>
          <button onClick={() => fetchDailyPrompt(level)} className="refresh-btn" disabled={loading}>
            {loading ? '...' : '🔄 New'}
          </button>
        </div>
        {dailyPrompt ? (
          <div className="daily-prompt-body">
            <div className="prompt-topic">📌 {dailyPrompt.topic}</div>
            <div className="prompt-text">"{dailyPrompt.prompt}"</div>
            {dailyPrompt.key_vocabulary && (
              <div className="vocab-chips">
                <span className="vocab-label">Key words:</span>
                {dailyPrompt.key_vocabulary.map((w, i) => (
                  <span key={i} className="vocab-chip">{w}</span>
                ))}
              </div>
            )}
            <button className="btn-primary" onClick={() => navigate('/audio')}>
              🎤 Practice Now
            </button>
          </div>
        ) : (
          <div className="prompt-loading">Loading your daily prompt...</div>
        )}
      </div>

      {/* Modules Grid */}
      <h2 className="section-title">Modules</h2>
      <div className="modules-grid">
        {modules.map((m) => (
          <div key={m.path} className="module-card" onClick={() => navigate(m.path)}>
            <div className="module-icon">{m.icon}</div>
            <div className="module-label">{m.label}</div>
            <div className="module-desc">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
