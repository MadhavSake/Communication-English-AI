import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { LegalLinks } from '../Legal/Legal';
import '../Legal/Legal.css';
import './Login.css';

const messages = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-email': 'Please enter a valid email.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/missing-password': 'Please enter your password.',
};

export default function Login() {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'signin') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(messages[err.code] || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError(''); setInfo('');
    if (!email) { setError('Enter your email first, then click "Forgot password".'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Password reset link sent. Check your inbox.');
    } catch (err) {
      setError(messages[err.code] || 'Could not send reset email.');
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">🗣️</div>
        <h1 className="gradient-text">EnglishAI</h1>
        <p className="login-sub">
          {mode === 'signin' ? 'Sign in to continue your practice' : 'Create your account'}
        </p>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        {error && <div className="login-error">{error}</div>}
        {info && <div className="login-info">{info}</div>}

        <button type="submit" className="login-btn" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        {mode === 'signin' && (
          <button type="button" className="link-btn" onClick={reset}>Forgot password?</button>
        )}

        <div className="login-switch">
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <button type="button" className="link-btn"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}>
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </button>
        </div>
        {mode === 'signup' && (
          <p className="login-sub" style={{ marginTop: 8, fontSize: 12 }}>
            By creating an account you agree to our Terms and Privacy Policy.
          </p>
        )}
        <LegalLinks />
      </form>
    </div>
  );
}
