import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Firestore layout: users/{uid}
// {
//   email, level, createdAt, updatedAt,
//   days:   { 'YYYY-MM-DD': <sessions that day> },
//   totals: { sessions, grammar, audio, chat },
//   scores: { grammar: {sum,count}, fluency: {...}, vocabulary: {...}, overall: {...} }
// }

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const userRef = () => (db && auth?.currentUser ? doc(db, 'users', auth.currentUser.uid) : null);

export async function loadProgress() {
  const ref = userRef();
  if (!ref) return null;
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function ensureProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      level: parseInt(localStorage.getItem('userLevel') || '1'),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return (await getDoc(ref)).data();
  }
  return snap.data();
}

export async function saveLevel(level) {
  const ref = userRef();
  if (!ref) return;
  await setDoc(ref, { level, updatedAt: serverTimestamp() }, { merge: true });
}

// type: 'grammar' | 'audio' | 'chat'; scores: optional { grammar_score, fluency_score, vocabulary_score, overall_score }
export async function recordActivity(type, scores = {}) {
  const ref = userRef();
  if (!ref) return;
  const update = {
    updatedAt: serverTimestamp(),
    days: { [today()]: increment(1) },
    totals: { sessions: increment(1), [type]: increment(1) },
  };
  const map = { grammar: 'grammar_score', fluency: 'fluency_score', vocabulary: 'vocabulary_score', overall: 'overall_score' };
  const s = {};
  for (const [key, field] of Object.entries(map)) {
    const v = Number(scores?.[field]);
    if (Number.isFinite(v)) s[key] = { sum: increment(v), count: increment(1) };
  }
  if (Object.keys(s).length) update.scores = s;
  try {
    await setDoc(ref, update, { merge: true });
  } catch (e) {
    console.warn('Could not save progress', e);
  }
}

export function average(scores, key) {
  const s = scores?.[key];
  return s && s.count ? Math.round(s.sum / s.count) : null;
}

export function streak(days = {}) {
  let n = 0;
  const d = new Date();
  for (;;) {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (days[k]) { n += 1; d.setDate(d.getDate() - 1); }
    else if (n === 0 && k === today()) { d.setDate(d.getDate() - 1); } // today not practiced yet
    else break;
  }
  return n;
}

export function lastSevenDays(days = {}) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), sessions: days[k] || 0 });
  }
  return out;
}
