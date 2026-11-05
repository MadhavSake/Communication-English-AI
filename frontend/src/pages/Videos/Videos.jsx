import React, { useState, useEffect } from 'react';
import { currentStage } from '../../stages';
import { getVideos, getAudioContent } from '../../services/api';
import './Videos.css';

export default function Videos() {
  const [level]    = useState(currentStage());
  const [videos, setVideos]   = useState([]);
  const [audios, setAudios]   = useState([]);
  const [tab, setTab]         = useState('videos');

  useEffect(() => {
    getVideos(level).then((r) => setVideos(r.data.videos)).catch(() => {});
    getAudioContent(level).then((r) => setAudios(r.data.audio)).catch(() => {});
  }, [level]);

  return (
    <div className="videos-page">
      <div className="page-header">
        <h1>🎬 Videos & Audio</h1>
        <p>Curated content for Stage {level}</p>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>🎬 Videos</button>
        <button className={`tab-btn ${tab === 'audio'  ? 'active' : ''}`} onClick={() => setTab('audio')}>🎧 Audio</button>
      </div>

      {tab === 'videos' && (
        <div className="content-grid">
          {videos.map((v, i) => (
            <div key={i} className="content-card card">
              <div className="content-thumb video-thumb">▶</div>
              <div className="content-info">
                <h3>{v.title}</h3>
                <div className="content-meta">
                  <span>📺 {v.platform}</span>
                  <span>⏱ {v.duration}</span>
                </div>
                <div className="content-topic">{v.topic}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'audio' && (
        <div className="content-grid">
          {audios.map((a, i) => (
            <div key={i} className="content-card card">
              <div className="content-thumb audio-thumb">🎧</div>
              <div className="content-info">
                <h3>{a.title}</h3>
                <div className="content-meta">
                  <span>⏱ {a.duration}</span>
                  <span className="type-badge">{a.type}</span>
                </div>
                <p>{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
