import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, firebaseReady } from '../firebase';
import { ensureProfile } from '../services/progress';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!firebaseReady) return undefined;
    return onAuthStateChanged(auth, async (u) => {
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
