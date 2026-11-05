import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Grammar APIs
export const checkGrammar = (text, level) =>
  api.post('/api/grammar/check', { text, level });

export const improveSentence = (text, level) =>
  api.post('/api/grammar/improve', { text, level });

export const getDailyPrompt = (level) =>
  api.get(`/api/grammar/daily-prompt/${level}`);

// Audio APIs
export const analyzeAudio = (audioBlob, level) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('level', level);
  return api.post('/api/audio/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

export const textToSpeech = (text) => {
  const formData = new FormData();
  formData.append('text', text);
  return api.post('/api/audio/tts', formData, {
    responseType: 'blob',
  });
};

// Vision APIs
export const analyzeFaceBase64 = (imageBase64) =>
  api.post('/api/vision/analyze-face-base64', { image: imageBase64 });

// Chat APIs
export const sendChatMessage = (message, history, level, scenario) =>
  api.post('/api/chat/message', { message, history, level, scenario });

export const getChatScenarios = () =>
  api.get('/api/chat/scenarios');

// Content APIs
export const getAllLevels = () => api.get('/api/content/levels');
export const getLevelInfo = (level) => api.get(`/api/content/levels/${level}`);
export const getLesson = (stage, module) => api.get(`/api/content/lesson/${stage}/${module}`);
export const getNotes = (level) => api.get(`/api/content/notes/${level}`);
export const getBooks = (level) => api.get(`/api/content/books/${level}`);
export const getAudioContent = (level) => api.get(`/api/content/audio/${level}`);
export const getVideos = (level) => api.get(`/api/content/videos/${level}`);
