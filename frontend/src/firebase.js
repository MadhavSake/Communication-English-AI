import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// REACT_APP_FIREBASE_CONFIG holds the web-app config copied from the Firebase
// console. Accept strict JSON or the console's JS-object snippet as-is.
function parseConfig(raw) {
  if (!raw) return null;
  // If the whole console snippet (imports, initializeApp…) was pasted,
  // keep only the object assigned to firebaseConfig.
  let s = raw.trim();
  const at = s.indexOf('firebaseConfig');
  const start = s.indexOf('{', at >= 0 ? at : 0);
  const end = s.indexOf('}', start);
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try { return JSON.parse(s); } catch (_) { /* fall through */ }
  s = s
    .replace(/(^|[^:"'])\/\/.*$/gm, '$1')              // line comments (not https://)
    .replace(/'([^']*)'/g, '"$1"')                      // single → double quotes
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":') // quote keys
    .replace(/,\s*}/g, '}');                            // trailing comma
  try { return JSON.parse(s); } catch (e) {
    console.error('Invalid REACT_APP_FIREBASE_CONFIG', e);
    return null;
  }
}

const config = parseConfig(process.env.REACT_APP_FIREBASE_CONFIG);

export const firebaseReady = Boolean(config && config.apiKey);
const app = firebaseReady ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
