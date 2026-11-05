import React, { useState, useRef, useEffect } from 'react';
import { currentStage } from '../../stages';
import { recordActivity } from '../../services/progress';
import Webcam from 'react-webcam';
import { analyzeAudio, analyzeFaceBase64 } from '../../services/api';
import './AudioPractice.css';

export default function AudioPractice() {
  const [level]          = useState(currentStage());
  const [recording, setRecording]   = useState(false);
  const [audioBlob, setAudioBlob]   = useState(null);
  const [result, setResult]         = useState(null);
  const [faceResult, setFaceResult] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [timer, setTimer]           = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const webcamRef        = useRef(null);
  const timerRef         = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startRecording = async () => {
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const submitAudio = async () => {
    if (!audioBlob) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeAudio(audioBlob, level);
      setResult(res.data);
      if (res.data?.analysis) recordActivity('audio', res.data.analysis);
    } catch (e) {
      setResult({ success: false, message: 'Analysis failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const captureAndAnalyzeFace = async () => {
    if (!webcamRef.current) return;
    setFaceLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();
    try {
      const res = await analyzeFaceBase64(imageSrc);
      setFaceResult(res.data);
    } catch {
      setFaceResult({ face_detected: false, message: 'Face analysis failed.' });
    } finally {
      setFaceLoading(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const scoreColor = (score) => score >= 75 ? 'score-good' : score >= 50 ? 'score-medium' : 'score-low';

  return (
    <div className="audio-practice">
      <div className="page-header">
        <h1>🎤 Audio Practice</h1>
        <p>Record your speech and get instant AI feedback on grammar, fluency & pronunciation</p>
      </div>

      <div className="audio-layout">
        {/* Left: Recording */}
        <div className="recording-section card">
          <h2>Record Your Speech</h2>
          <p className="hint">Stage {level} — Speak clearly into your microphone</p>

          <div className="recorder-ui">
            {recording && (
              <div className="recording-indicator">
                <div className="pulse-ring" />
                <span className="timer">{formatTime(timer)}</span>
              </div>
            )}

            {!recording ? (
              <button className="btn-record" onClick={startRecording}>
                🎙️ Start Recording
              </button>
            ) : (
              <button className="btn-stop" onClick={stopRecording}>
                ⏹️ Stop Recording
              </button>
            )}

            {audioBlob && !recording && (
              <div className="audio-preview">
                <audio controls src={URL.createObjectURL(audioBlob)} />
                <button className="btn-primary" onClick={submitAudio} disabled={loading}>
                  {loading ? '⏳ Analyzing...' : '🔍 Analyze My Speech'}
                </button>
              </div>
            )}
          </div>

          {/* Face Analysis Toggle */}
          <div className="face-toggle">
            <button className="btn-secondary" onClick={() => setShowCamera(!showCamera)}>
              {showCamera ? '📷 Hide Camera' : '😊 Enable Face Analysis'}
            </button>
          </div>

          {showCamera && (
            <div className="webcam-section">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={280}
                style={{ borderRadius: '12px', border: '2px solid #3d3d4d' }}
              />
              <button className="btn-secondary" onClick={captureAndAnalyzeFace} disabled={faceLoading}>
                {faceLoading ? '⏳ Analyzing...' : '📸 Analyze My Expression'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="results-section">
          {/* Audio Analysis Result */}
          {result && (
            <div className="result-card card">
              <h2>📊 Speech Analysis</h2>
              {result.success === false ? (
                <p className="error-msg">{result.message}</p>
              ) : (
                <>
                  {result.transcription && (
                    <div className="transcript-box">
                      <div className="transcript-label">📝 What you said:</div>
                      <div className="transcript-text">"{result.transcription.transcript}"</div>
                      <div className="confidence">Confidence: {result.transcription.confidence}%</div>
                    </div>
                  )}

                  {result.analysis && (
                    <>
                      <div className="scores-grid">
                        <div className="score-item">
                          <div className={`score-circle ${scoreColor(result.analysis.grammar_score)}`}>
                            {result.analysis.grammar_score}
                          </div>
                          <div className="score-name">Grammar</div>
                        </div>
                        <div className="score-item">
                          <div className={`score-circle ${scoreColor(result.analysis.fluency_score)}`}>
                            {result.analysis.fluency_score}
                          </div>
                          <div className="score-name">Fluency</div>
                        </div>
                        <div className="score-item">
                          <div className={`score-circle ${scoreColor(result.analysis.vocabulary_score)}`}>
                            {result.analysis.vocabulary_score}
                          </div>
                          <div className="score-name">Vocabulary</div>
                        </div>
                        <div className="score-item">
                          <div className={`score-circle ${scoreColor(result.analysis.overall_score)}`}>
                            {result.analysis.overall_score}
                          </div>
                          <div className="score-name">Overall</div>
                        </div>
                      </div>

                      {result.analysis.ielts_equivalent_band && (
                        <div className="ielts-band">
                          🎓 Estimated IELTS Band: <strong>{result.analysis.ielts_equivalent_band}</strong>
                        </div>
                      )}

                      <div className="feedback-text">{result.analysis.detailed_feedback}</div>

                      {result.analysis.strengths?.length > 0 && (
                        <div className="feedback-list">
                          <div className="fl-title">✅ Strengths</div>
                          {result.analysis.strengths.map((s, i) => <div key={i} className="fl-item good">{s}</div>)}
                        </div>
                      )}

                      {result.analysis.improvements?.length > 0 && (
                        <div className="feedback-list">
                          <div className="fl-title">💡 Improve</div>
                          {result.analysis.improvements.map((s, i) => <div key={i} className="fl-item tip">{s}</div>)}
                        </div>
                      )}

                      {result.analysis.filler_word_count > 0 && (
                        <div className="filler-warning">
                          ⚠️ Filler words detected ({result.analysis.filler_word_count}): {result.analysis.filler_words_detected?.join(', ')}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Face Analysis Result */}
          {faceResult && (
            <div className="result-card card">
              <h2>😊 Expression Analysis</h2>
              {!faceResult.face_detected ? (
                <p className="error-msg">{faceResult.message}</p>
              ) : (
                <>
                  <div className="scores-grid">
                    <div className="score-item">
                      <div className={`score-circle ${scoreColor(faceResult.confidence_score)}`}>
                        {faceResult.confidence_score}
                      </div>
                      <div className="score-name">Confidence</div>
                    </div>
                    <div className="score-item">
                      <div className={`score-circle ${scoreColor(faceResult.eye_contact_score)}`}>
                        {faceResult.eye_contact_score}
                      </div>
                      <div className="score-name">Eye Contact</div>
                    </div>
                  </div>
                  <div className="smile-badge">
                    {faceResult.smile_detected ? '😊 Smile detected — great!' : '😐 Try smiling more!'}
                  </div>
                  {faceResult.feedback?.map((f, i) => (
                    <div key={i} className="fl-item tip">{f}</div>
                  ))}
                </>
              )}
            </div>
          )}

          {!result && !faceResult && (
            <div className="empty-state card">
              <div style={{ fontSize: 48 }}>🎙️</div>
              <p>Record your speech to see AI analysis here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
