import React, { useState, useEffect } from 'react';
import { useStage } from '../../stages';
import { getVideos, getAudioContent } from '../../services/api';
import './Videos.css';

export default function Videos() {
  const level    = useStage();
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
              {v.youtube_id ? (
                <iframe className="video-embed" title={v.title} loading="lazy" allowFullScreen
                  src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}`}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" />
              ) : (
                <div className="content-thumb video-thumb">▶</div>
              )}
              <div className="content-info">
                <h3>{v.title}</h3>
                <div className="content-meta">
                  <span>📺 {v.platform}</span>
                </div>
                <p>{v.description}</p>
                {v.url && <a className="open-link" href={v.url} target="_blank" rel="noopener noreferrer">Watch ↗</a>}
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
                  <span className="type-badge">{a.type}</span>
                </div>
                <p>{a.description}</p>
                {a.url && <a className="open-link" href={a.url} target="_blank" rel="noopener noreferrer">Listen ↗</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
