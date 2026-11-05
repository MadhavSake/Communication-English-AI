import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { recordActivity } from '../services/progress';
import './LessonView.css';

export default function LessonView({ stage, module, title, topics, onClose }) {
  const [lesson, setLesson] = useState(undefined); // undefined = loading, null = not available
  const boxRef = useRef(null);

  // Bring the lesson into view when a module is opened
  useEffect(() => {
    boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [stage, module]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  // Hindi help: on by default for stages 1–8, off for 9–12; the learner's choice is remembered.
  const [showHindi, setShowHindi] = useState(() => {
    try {
      const saved = localStorage.getItem('showHindi');
      if (saved !== null) return saved === '1';
    } catch (_) { /* storage unavailable */ }
    return stage <= 8;
  });
  const toggleHindi = () => {
    const next = !showHindi;
    setShowHindi(next);
    try { localStorage.setItem('showHindi', next ? '1' : '0'); } catch (_) { /* ignore */ }
  };

  useEffect(() => {
    setLesson(undefined); setAnswers({}); setSubmitted(false);
    if (!db) { setLesson(null); return; }
    getDoc(doc(db, 'lessons', `s${stage}-m${module}`))
      .then((snap) => setLesson(snap.exists() ? snap.data() : null))
      .catch(() => setLesson(null));
  }, [stage, module]);

  const quiz = lesson?.quiz || [];
  const score = quiz.reduce((n, q, i) => n + (answers[i] === q.answer_index ? 1 : 0), 0);

  const submit = () => {
    setSubmitted(true);
    const pct = Math.round((score / quiz.length) * 100);
    recordActivity('quiz', { overall_score: pct });
  };

  return (
    <div ref={boxRef} className={`lesson-view card${showHindi ? '' : ' hide-hi'}`}>
      <div className="lv-head">
        <div>
          <div className="lv-kicker">Stage {stage} · Module {module}</div>
          <h2>{lesson?.title || title}</h2>
        </div>
        <div className="lv-actions">
          <button type="button" className={`lv-toggle${showHindi ? ' on' : ''}`} onClick={toggleHindi}
            aria-pressed={showHindi}>
            हिन्दी मदद: {showHindi ? 'On' : 'Off'}
          </button>
          <button className="lv-close" onClick={onClose} aria-label="Close lesson">✕</button>
        </div>
      </div>

      {lesson === undefined && <p className="lv-muted">Loading lesson…</p>}

      {lesson === null && (
        <p className="lv-muted">
          Detailed notes for this module are coming soon. Topics: {topics}
        </p>
      )}

      {lesson && (
        <>
          {lesson.summary && <p className="lv-summary">{lesson.summary}</p>}
          {lesson.summary_hi && <p className="lv-hi">{lesson.summary_hi}</p>}

          {lesson.explanation?.map((p, i) => (
            <div key={i}>
              <p className="lv-para">{p}</p>
              {lesson.explanation_hi?.[i] && <p className="lv-hi">{lesson.explanation_hi[i]}</p>}
            </div>
          ))}

          {lesson.key_points?.length > 0 && (
            <section>
              <h3>Key points</h3>
              <ul>{lesson.key_points.map((k, i) => (
                <li key={i}>{k}{lesson.key_points_hi?.[i] && <div className="lv-hi">{lesson.key_points_hi[i]}</div>}</li>
              ))}</ul>
            </section>
          )}

          {lesson.examples?.length > 0 && (
            <section>
              <h3>Examples</h3>
              <ul className="lv-examples">
                {lesson.examples.map((e, i) => (
                  <li key={i}><strong>{e.english}</strong>{e.note && <span> — {e.note}</span>}
                    {e.hindi && <div className="lv-hi">{e.hindi}</div>}</li>
                ))}
              </ul>
            </section>
          )}

          {lesson.vocabulary?.length > 0 && (
            <section>
              <h3>Vocabulary</h3>
              <div className="lv-vocab">
                {lesson.vocabulary.map((v, i) => (
                  <div key={i} className="lv-word">
                    <div className="lv-w">{v.word}</div>
                    <div className="lv-m">{v.meaning}</div>
                    {v.meaning_hi && <div className="lv-hi">{v.meaning_hi}</div>}
                    <div className="lv-ex">“{v.example}”</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {lesson.common_mistakes?.length > 0 && (
            <section>
              <h3>Common mistakes</h3>
              {lesson.common_mistakes.map((m, i) => (
                <div key={i} className="lv-mistake">
                  <span className="err-wrong">✗ {m.wrong}</span>
                  <span className="err-correct">✓ {m.right}</span>
                  <span className="lv-muted">{m.why}</span>
                  {m.why_hi && <span className="lv-hi">{m.why_hi}</span>}
                </div>
              ))}
            </section>
          )}

          {lesson.practice?.length > 0 && (
            <section>
              <h3>Practice</h3>
              <ul>{lesson.practice.map((t, i) => (
                <li key={i}>{t}{lesson.practice_hi?.[i] && <div className="lv-hi">{lesson.practice_hi[i]}</div>}</li>
              ))}</ul>
            </section>
          )}

          {quiz.length > 0 && (
            <section>
              <h3>Module test (practice)</h3>
              {quiz.map((q, qi) => (
                <div key={qi} className="lv-q">
                  <div className="lv-qtext">{qi + 1}. {q.question}</div>
                  <div className="lv-options">
                    {q.options.map((o, oi) => {
                      const chosen = answers[qi] === oi;
                      const state = submitted
                        ? (oi === q.answer_index ? 'right' : chosen ? 'wrong' : '')
                        : (chosen ? 'chosen' : '');
                      return (
                        <button key={oi} type="button" disabled={submitted}
                          className={`lv-opt ${state}`}
                          onClick={() => setAnswers({ ...answers, [qi]: oi })}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && q.explanation && <div className="lv-muted lv-expl">{q.explanation}</div>}
                  {submitted && q.explanation_hi && <div className="lv-hi">{q.explanation_hi}</div>}
                </div>
              ))}
              {!submitted ? (
                <button className="btn-primary" onClick={submit}
                  disabled={Object.keys(answers).length < quiz.length}>
                  Submit answers
                </button>
              ) : (
                <div className="lv-score">
                  Score: {score} / {quiz.length}
                  <button type="button" className="lv-retry"
                    onClick={() => { setAnswers({}); setSubmitted(false); }}>Try again</button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
