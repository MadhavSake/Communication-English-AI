import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase';
import { ensureProfile } from '../services/progress';

const AuthContext = createContext({ user: null, loading: true });

// Who may use the app right now (the backend enforces the same list).
const ALLOWED = (process.env.REACT_APP_ALLOWED_EMAILS || 'sakemadhav97@gmail.com')
  .split(/[;,]/).map((e) => e.trim().toLowerCase()).filter(Boolean);
export const isAllowed = (email) => !ALLOWED.length || ALLOWED.includes((email || '').toLowerCase());
let blockedNotice = '';
export const takeBlockedNotice = () => { const m = blockedNotice; blockedNotice = ''; return m; };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady) return undefined;
    return onAuthStateChanged(auth, async (u) => {
      if (u && !isAllowed(u.email)) {
        blockedNotice = 'This account does not have access yet. New sign-ups are closed for now.';
        await signOut(auth);
        return; // the sign-out fires this listener again with u = null
      }
      if (u) {
        try {
          const profile = await ensureProfile(u);
          if (profile?.level) {
            localStorage.setItem('userLevel', profile.level);
            window.dispatchEvent(new Event('levelChanged'));
          }
        } catch (e) {
          console.warn('Could not load profile', e);
        }
      }
      setUser(u);
      setLoading(false);
    });
  }, []);

  const logout = () => {
    localStorage.removeItem('userLevel');
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
