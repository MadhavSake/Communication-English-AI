import React, { useState, useEffect } from 'react';
import { currentStage } from '../../stages';
import LessonView from '../../components/LessonView';
import { recordActivity } from '../../services/progress';
import { getNotes, getLevelInfo } from '../../services/api';
import { checkGrammar } from '../../services/api';
import './Notes.css';

export default function Notes() {
  const [level]     = useState(currentStage());
  const [notes, setNotes]       = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [text, setText]         = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(null);

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
      recordActivity('grammar', res.data);
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
        <p>Stage {level} modules — {levelInfo?.focus}</p>
      </div>

      {levelInfo && (
        <div className="level-banner">
          <div className="lb-level">Stage {level}</div>
          <div className="lb-info">
            <div className="lb-name">{levelInfo.name}</div>
            <div className="lb-focus">{levelInfo.focus}</div>
          </div>
          <div className="lb-band">📖 {levelInfo.vocab_target?.toLocaleString()} words target</div>
        </div>
      )}

      {/* Notes Cards */}
      <div className="notes-grid">
        {notes.map((note, i) => (
          <div key={i} className={`note-card card ${open === i ? 'open' : ''}`}
            role="button" tabIndex={0}
            onClick={() => setOpen(open === i ? null : i)}
            onKeyDown={(e) => { if (e.key === 'Enter') setOpen(open === i ? null : i); }}>
            <div className="note-header">
              <span className="note-num">{i + 1}</span>
              <span className="note-duration">Module {note.module || i + 1}</span>
            </div>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            {note.outcome && <p className="note-outcome">🎯 {note.outcome}</p>}
          </div>
        ))}
      </div>

      {open !== null && notes[open] && (
        <LessonView
          stage={level}
          module={notes[open].module || open + 1}
          title={notes[open].title}
          topics={notes[open].content}
          onClose={() => setOpen(null)}
        />
      )}

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
