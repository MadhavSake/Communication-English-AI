import React, { useState } from 'react';
import './Progress.css';

export default function Progress() {
  const [level] = useState(parseInt(localStorage.getItem('userLevel') || '1'));

  const skills = [
    { name: 'Speaking',   score: 65, icon: '🎤' },
    { name: 'Listening',  score: 70, icon: '👂' },
    { name: 'Reading',    score: 75, icon: '📖' },
    { name: 'Writing',    score: 60, icon: '✍️'  },
    { name: 'Grammar',    score: 68, icon: '📝' },
    { name: 'Vocabulary', score: 72, icon: '💬' },
  ];

  const weeklyData = [
    { day: 'Mon', sessions: 2 },
    { day: 'Tue', sessions: 3 },
    { day: 'Wed', sessions: 1 },
    { day: 'Thu', sessions: 4 },
    { day: 'Fri', sessions: 2 },
    { day: 'Sat', sessions: 5 },
    { day: 'Sun', sessions: 3 },
  ];
  const maxSessions = Math.max(...weeklyData.map((d) => d.sessions));

  const scoreColor = (s) => s >= 75 ? '#4ade80' : s >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="progress-page">
      <div className="page-header">
        <h1>📊 Your Progress</h1>
        <p>Track your English improvement journey</p>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card card">
          <div className="sc-icon">🏆</div>
          <div className="sc-value">{level}</div>
          <div className="sc-label">Current Level</div>
          <div className="sc-sub">of 15</div>
        </div>
        <div className="summary-card card">
          <div className="sc-icon">🔥</div>
          <div className="sc-value">7</div>
          <div className="sc-label">Day Streak</div>
          <div className="sc-sub">Keep it up!</div>
        </div>
        <div className="summary-card card">
          <div className="sc-icon">⏱️</div>
          <div className="sc-value">24</div>
          <div className="sc-label">Hours Practiced</div>
          <div className="sc-sub">This month</div>
        </div>
        <div className="summary-card card">
          <div className="sc-icon">🎯</div>
          <div className="sc-value">{Math.round((level / 15) * 100)}%</div>
          <div className="sc-label">Overall Progress</div>
          <div className="sc-sub">to Level 15</div>
        </div>
      </div>

      <div className="progress-layout">
        {/* Skills */}
        <div className="skills-card card">
          <h2>Skill Breakdown</h2>
          <div className="skills-list">
            {skills.map((s) => (
              <div key={s.name} className="skill-row">
                <div className="skill-label">
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </div>
                <div className="skill-bar-wrap">
                  <div
                    className="skill-bar"
                    style={{ width: `${s.score}%`, background: scoreColor(s.score) }}
                  />
                </div>
                <div className="skill-score" style={{ color: scoreColor(s.score) }}>
                  {s.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="weekly-card card">
          <h2>Weekly Activity</h2>
          <div className="bar-chart">
            {weeklyData.map((d) => (
              <div key={d.day} className="bar-col">
                <div className="bar-wrap">
                  <div
                    className="bar"
                    style={{ height: `${(d.sessions / maxSessions) * 100}%` }}
                  />
                </div>
                <div className="bar-label">{d.day}</div>
                <div className="bar-val">{d.sessions}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="level-progress-card card">
        <h2>Level Journey (1 → 15)</h2>
        <div className="level-track">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((l) => (
            <div
              key={l}
              className={`level-dot ${l < level ? 'done' : l === level ? 'current' : 'upcoming'}`}
              title={`Level ${l}`}
            >
              {l}
            </div>
          ))}
        </div>
        <div className="level-track-labels">
          <span>Beginner</span>
          <span>Intermediate</span>
          <span>IELTS 9.0</span>
        </div>
      </div>
    </div>
  );
}
