import React, { useEffect, useRef, useState } from 'react';
import { useStage, stageName } from '../../stages';
import { auth, firebaseReady } from '../../firebase';
import { API_BASE } from '../../services/api';
import { recordActivity } from '../../services/progress';
import './LiveVoice.css';

const SCENARIOS = [
  { id: 'general', label: '☕ Daily conversation' },
  { id: 'interview', label: '💼 Job interview' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'ielts', label: '🎓 IELTS speaking' },
  { id: 'business', label: '📊 Business meeting' },
];

// Captures mic audio, downsamples to 16 kHz and posts Int16 PCM chunks (~100 ms).
const WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = []; this.ratio = sampleRate / 16000; this.pos = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (; this.pos < ch.length; this.pos += this.ratio) this.buf.push(ch[Math.floor(this.pos)]);
      this.pos -= ch.length;
      if (this.buf.length >= 1600) {
        const out = new Int16Array(this.buf.length);
        for (let i = 0; i < this.buf.length; i++) {
          const s = Math.max(-1, Math.min(1, this.buf[i]));
          out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage(out.buffer, [out.buffer]);
        this.buf = [];
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

const wsUrl = () => `${API_BASE.replace(/^http/, 'ws')}/api/live/voice`;

export default function LiveVoice() {
  const stage = useStage();
  const [scenario, setScenario] = useState('general');
  const [status, setStatus] = useState('idle'); // idle | connecting | live | ending | done
  const [speaking, setSpeaking] = useState(false);
  const [lines, setLines] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  const ws = useRef(null);
  const ctx = useRef(null);
  const stream = useRef(null);
  const node = useRef(null);
  const playAt = useRef(0);
  const sources = useRef([]);
  const timer = useRef(null);
  const transcriptEnd = useRef(null);

  useEffect(() => () => cleanup(), []);
  useEffect(() => { transcriptEnd.current?.scrollIntoView({ block: 'nearest' }); }, [lines]);

  const addLine = (who, text) => setLines((prev) => {
    if (prev.length && prev[prev.length - 1].who === who) {
      const next = [...prev];
      next[next.length - 1] = { who, text: next[next.length - 1].text + text };
      return next;
    }
    return [...prev, { who, text }];
  });

  const stopPlayback = () => {
    sources.current.forEach((s) => { try { s.stop(); } catch (_) { /* already stopped */ } });
    sources.current = [];
    playAt.current = 0;
    setSpeaking(false);
  };

  const play = (arrayBuffer) => {
    const c = ctx.current;
    if (!c) return;
    const pcm = new Int16Array(arrayBuffer);
    const buf = c.createBuffer(1, pcm.length, 24000);
    const data = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 0x8000;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    const startAt = Math.max(c.currentTime + 0.05, playAt.current);
    src.start(startAt);
    playAt.current = startAt + buf.duration;
    sources.current.push(src);
    setSpeaking(true);
    src.onended = () => {
      sources.current = sources.current.filter((s) => s !== src);
      if (!sources.current.length) setSpeaking(false);
    };
  };

  const cleanup = () => {
    clearInterval(timer.current);
    try { node.current?.disconnect(); } catch (_) { /* ignore */ }
    stream.current?.getTracks().forEach((t) => t.stop());
    stopPlayback();
    try { ctx.current?.close(); } catch (_) { /* ignore */ }
    ctx.current = null;
    stream.current = null;
    node.current = null;
  };

  const start = async () => {
    setError(''); setReport(null); setLines([]);
    if (!firebaseReady || !auth?.currentUser) { setError('Please sign in to use the voice coach.'); return; }
    setStatus('connecting');
    try {
      const token = await auth.currentUser.getIdToken();
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      ctx.current = new (window.AudioContext || window.webkitAudioContext)();
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      await ctx.current.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      node.current = new AudioWorkletNode(ctx.current, 'pcm-capture');
      ctx.current.createMediaStreamSource(stream.current).connect(node.current);

      const sock = new WebSocket(wsUrl());
      sock.binaryType = 'arraybuffer';
      ws.current = sock;
      sock.onopen = () => sock.send(JSON.stringify({ type: 'start', token, stage, scenario }));
      sock.onmessage = (ev) => {
        if (typeof ev.data !== 'string') { play(ev.data); return; }
        const m = JSON.parse(ev.data);
        if (m.type === 'ready') {
          setStatus('live');
          setSecondsLeft(m.seconds);
          node.current.port.onmessage = (e) => { if (sock.readyState === 1) sock.send(e.data); };
          timer.current = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
        } else if (m.type === 'user') addLine('you', m.text);
        else if (m.type === 'tutor') addLine('coach', m.text);
        else if (m.type === 'interrupted') stopPlayback();
        else if (m.type === 'limit') setError(m.message);
        else if (m.type === 'error') { setError(m.message); setStatus('idle'); cleanup(); }
        else if (m.type === 'report') {
          setReport(m.report);
          setStatus('done');
          recordActivity('voice', m.report);
        }
      };
      sock.onclose = () => {
        cleanup();
        setStatus((s) => (s === 'done' ? s : (s === 'ending' ? 'done' : 'idle')));
      };
      sock.onerror = () => setError('Connection problem. Please try again.');
    } catch (e) {
      cleanup();
      setStatus('idle');
      setError(e?.name === 'NotAllowedError'
        ? 'Microphone permission was blocked. Allow the mic in your browser and try again.'
        : 'Could not start the voice session. Please try again.');
    }
  };

  const stop = () => {
    setStatus('ending');
    if (node.current) node.current.port.onmessage = null;
    clearInterval(timer.current);
    stopPlayback();
    try { ws.current?.send(JSON.stringify({ type: 'stop' })); } catch (_) { /* socket closed */ }
  };

  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const live = status === 'live';

  return (
    <div className="page live-voice">
      <div className="page-header">
        <h1>🎙️ Live Voice Coach</h1>
        <p>Talk with your AI English coach — Stage {stage} · {stageName(stage)}</p>
      </div>

      <div className="card lv-setup">
        <div className="lv-scenarios">
          {SCENARIOS.map((s) => (
            <button key={s.id} type="button" disabled={status !== 'idle' && status !== 'done'}
              className={`lv-chip ${scenario === s.id ? 'on' : ''}`} onClick={() => setScenario(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="lv-controls">
          {!live && status !== 'ending' ? (
            <button className="btn-primary lv-big" onClick={start} disabled={status === 'connecting'}>
              {status === 'connecting' ? 'Connecting…' : '🎙️ Start talking'}
            </button>
          ) : (
            <button className="lv-big lv-stop" onClick={stop} disabled={status === 'ending'}>
              {status === 'ending' ? 'Preparing your report…' : '⏹ End session'}
            </button>
          )}
          {live && (
            <div className="lv-status">
              <span className={`lv-dot ${speaking ? 'coach' : 'you'}`} />
              {speaking ? 'Coach is speaking…' : 'Listening — speak now'}
              <span className="lv-timer">{mmss(secondsLeft)}</span>
            </div>
          )}
        </div>
        <p className="lv-hint">Tip: use earphones for the best experience. Sessions are up to 5 minutes; you get 10 minutes a day.</p>
        {error && <div className="lv-error">{error}</div>}
      </div>

      {lines.length > 0 && (
        <div className="card lv-transcript">
          {lines.map((l, i) => (
            <div key={i} className={`lv-line ${l.who}`}>
              <span className="lv-who">{l.who === 'you' ? 'You' : 'Coach'}</span>
              <span>{l.text}</span>
            </div>
          ))}
          <div ref={transcriptEnd} />
        </div>
      )}

      {report && (
        <div className="card lv-report">
          <h2>📋 Session report</h2>
          <p>{report.summary}</p>
          {report.overall_score != null && (
            <div className="lv-scores">
              {[['Overall', report.overall_score], ['Fluency', report.fluency_score],
                ['Grammar', report.grammar_score], ['Vocabulary', report.vocabulary_score]]
                .filter(([, v]) => v != null)
                .map(([k, v]) => <div key={k} className="lv-score"><strong>{v}</strong><span>{k}</span></div>)}
            </div>
          )}
          {report.corrections?.length > 0 && (
            <>
              <h3>Corrections</h3>
              {report.corrections.map((c, i) => (
                <div key={i} className="mc-item">
                  <span className="err-wrong">✗ {c.wrong}</span>
                  <span className="err-correct">✓ {c.right}</span>
                  {c.why && <span className="mc-why">{c.why}</span>}
                </div>
              ))}
            </>
          )}
          {report.pronunciation_notes?.length > 0 && (
            <>
              <h3>Pronunciation</h3>
              <ul>{report.pronunciation_notes.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </>
          )}
          {report.tips?.length > 0 && (
            <>
              <h3>Next steps</h3>
              <ul>{report.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
