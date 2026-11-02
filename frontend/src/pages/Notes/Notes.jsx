import React, { useState, useEffect } from 'react';
import { getNotes, getLevelInfo } from '../../services/api';
import { checkGrammar } from '../../services/api';
import './Notes.css';

export default function Notes() {
  const [level]     = useState(parseInt(localStorage.getItem('userLevel') || '1'));
  const [notes, setNotes]       = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [text, setText]         = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    getNotes(level).then((r) => setNotes(r.data.notes)).catch(() => {});
    getLevelInfo(level).then((r) => setLevelInfo(r.data)).catch(() => {});
  }, [level]);

  const handleGrammarCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await checkGrammar(text, level);
      setResult(res.data);
    } catch {
      setResult({ error: 'Failed to check grammar. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notes-page">
      <div className="page-header">
        <h1>📚 Notes</h1>
        <p>Level {level} study material — {levelInfo?.focus}</p>
      </div>

      {levelInfo && (
        <div className="level-banner">
          <div className="lb-level">Level {level}</div>
          <div className="lb-info">
            <div className="lb-name">{levelInfo.name}</div>
            <div className="lb-focus">{levelInfo.focus}</div>
          </div>
          {levelInfo.ielts_band && (
            <div className="lb-band">🎓 IELTS {levelInfo.ielts_band}</div>
          )}
        </div>
      )}

      {/* Notes Cards */}
      <div className="notes-grid">
        {notes.map((note, i) => (
          <div key={i} className="note-card card">
            <div className="note-header">
              <span className="note-num">{i + 1}</span>
              <span className="note-duration">⏱ {note.duration}</span>
            </div>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
          </div>
        ))}
      </div>

      {/* Grammar Practice Box */}
      <div className="grammar-box card">
        <h2>✍️ Grammar Check Practice</h2>
        <p>Write a sentence or paragraph and get instant AI feedback</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write something in English here..."
          rows={4}
        />
        <button className="btn-primary" onClick={handleGrammarCheck} disabled={loading || !text.trim()}>
          {loading ? '⏳ Checking...' : '🔍 Check My Grammar'}
        </button>

        {result && !result.error && (
          <div className="grammar-result">
            <div className="corrected-text">
              <span className="gr-label">✅ Corrected:</span>
              <span>{result.corrected_text}</span>
            </div>
            <div className="score-row">
              <div className="mini-score">Grammar <strong>{result.grammar_score}</strong></div>
              <div className="mini-score">Fluency <strong>{result.fluency_score}</strong></div>
              <div className="mini-score">Vocabulary <strong>{result.vocabulary_score}</strong></div>
            </div>
            {result.errors?.length > 0 && (
              <div className="errors-list">
                {result.errors.map((e, i) => (
                  <div key={i} className="error-item">
                    <span className="err-wrong">"{e.error}"</span>
                    <span className="err-arrow">→</span>
                    <span className="err-correct">"{e.correction}"</span>
                    <span className="err-explain">— {e.explanation}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="overall-feedback">{result.overall_feedback}</div>
          </div>
        )}
        {result?.error && <p className="error-msg">{result.error}</p>}
      </div>
    </div>
  );
}
