import React, { useState, useEffect } from 'react';
import { loadProgress, average, streak, lastSevenDays } from '../../services/progress';
import './Progress.css';

export default function Progress() {
  const [level] = useState(parseInt(localStorage.getItem('userLevel') || '1'));

  const [data, setData] = useState(null);
  useEffect(() => { loadProgress().then(setData).catch(() => {}); }, []);

  const sc = data?.scores;
  const skills = [
    { name: 'Grammar',    score: average(sc, 'grammar'),    icon: '📝' },
    { name: 'Speaking',   score: average(sc, 'fluency'),    icon: '🎤' },
    { name: 'Vocabulary', score: average(sc, 'vocabulary'), icon: '💬' },
    { name: 'Overall',    score: average(sc, 'overall'),    icon: '🎯' },
  ];

  const weeklyData = lastSevenDays(data?.days);
  const dayStreak = streak(data?.days);
  const totalSessions = data?.totals?.sessions || 0;
  const maxSessions = Math.max(1, ...weeklyData.map((d) => d.sessions));

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
          <div className="sc-value">{dayStreak}</div>
          <div className="sc-label">Day Streak</div>
          <div className="sc-sub">{dayStreak ? 'Keep it up!' : 'Practice today to start'}</div>
        </div>
        <div className="summary-card card">
          <div className="sc-icon">⏱️</div>
          <div className="sc-value">{totalSessions}</div>
          <div className="sc-label">Practice Sessions</div>
          <div className="sc-sub">All time</div>
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
                    style={{ width: `${s.score ?? 0}%`, background: scoreColor(s.score ?? 0) }}
                  />
                </div>
                <div className="skill-score" style={{ color: s.score == null ? '#64748b' : scoreColor(s.score) }}>
                  {s.score ?? '—'}
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
