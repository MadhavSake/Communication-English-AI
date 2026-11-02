import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getChatScenarios } from '../../services/api';
import './LiveChat.css';

export default function LiveChat() {
  const [level]       = useState(parseInt(localStorage.getItem('userLevel') || '1'));
  const [scenarios, setScenarios]   = useState([]);
  const [scenario, setScenario]     = useState('general');
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatScenarios().then((r) => setScenarios(r.data.scenarios)).catch(() => {});
    setMessages([{
      role: 'model',
      text: `Hi there! 👋 I'm your English conversation partner. Let's practice together at Level ${level}. What would you like to talk about?`,
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, parts: [m.text] }));

    try {
      const res = await sendChatMessage(userMsg, history, level, scenario);
      setMessages((prev) => [...prev, { role: 'model', text: res.data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const changeScenario = (s) => {
    setScenario(s);
    setMessages([{
      role: 'model',
      text: `Great! Let's practice the "${s}" scenario. I'll play the appropriate role. You can start anytime! 🎯`,
    }]);
  };

  return (
    <div className="live-chat">
      <div className="page-header">
        <h1>💬 Live Chat Practice</h1>
        <p>Conversation practice with your AI English partner</p>
      </div>

      <div className="chat-layout">
        {/* Sidebar: Scenarios */}
        <div className="scenarios-panel card">
          <h3>Scenarios</h3>
          <div className="scenario-list">
            {scenarios.map((s) => (
              <button
                key={s.id}
                className={`scenario-btn ${scenario === s.id ? 'active' : ''}`}
                onClick={() => changeScenario(s.id)}
              >
                <span>{s.icon}</span>
                <div>
                  <div className="scenario-name">{s.name}</div>
                  <div className="scenario-levels">Levels {s.levels}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="level-info">
            <div className="li-label">Your Level</div>
            <div className="li-value">Level {level}</div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area card">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role === 'user' ? 'user-msg' : 'ai-msg'}`}>
                {m.role === 'model' && <div className="ai-avatar">🤖</div>}
                <div className="msg-bubble">{m.text}</div>
                {m.role === 'user' && <div className="user-avatar">👤</div>}
              </div>
            ))}
            {loading && (
              <div className="message ai-msg">
                <div className="ai-avatar">🤖</div>
                <div className="msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send)"
              rows={2}
              disabled={loading}
            />
            <button className="btn-primary send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
