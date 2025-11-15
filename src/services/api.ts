import type { AnswerMap } from '../context/QuestionnaireContext';

const KEY = 'student-questionnaire-answers-v1';
const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';
// Surface resolved API base for debugging deployment issues.
console.debug('[ApiService] using API base', API_BASE);
const USER_ID_KEY = 'student-questionnaire-user-id';

function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function saveAnswers(answers: AnswerMap) {
  localStorage.setItem(KEY, JSON.stringify(answers));
}

export function loadAnswers(): AnswerMap {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export async function fetchQuestionnaire() {
  try {
    console.debug('[ApiService] fetching questionnaire from', `${API_BASE}/api/questionnaire`);
    const res = await fetch(`${API_BASE}/api/questionnaire`);
    if (!res.ok) throw new Error(`Bad response (${res.status})`);
    const payload = await res.json();
    console.debug('[ApiService] questionnaire response', payload);
    return payload;
  } catch (err) {
    console.warn('[ApiService] failed to fetch questionnaire', err);
    // Fallback: front-end static data already imported elsewhere
    return null;
  }
}

export async function postAnswers(answers: AnswerMap) {
  const userId = getUserId();
  try {
    console.debug('[ApiService] posting answers for user', userId, answers);
    const res = await fetch(`${API_BASE}/api/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers })
    });
    if (!res.ok) throw new Error(`Failed to submit (${res.status})`);
    const payload = await res.json();
    console.debug('[ApiService] post answers response', payload);
    return payload;
  } catch (e) {
    console.warn('[ApiService] failed to post answers, falling back to offline mode', e);
    // Fallback to mock latency
    await new Promise(r => setTimeout(r, 400));
    return { ok: true, offline: true };
  }
}

export async function fetchStoredAnswers() {
  const userId = getUserId();
  try {
    console.debug('[ApiService] fetching stored answers for user', userId);
    const res = await fetch(`${API_BASE}/api/answers/${userId}`);
    if (!res.ok) {
      console.warn('[ApiService] stored answers not available', res.status);
      return null;
    }
    const data = await res.json();
    console.debug('[ApiService] stored answers response', data);
    return data.answers as AnswerMap;
  } catch (err) {
    console.warn('[ApiService] failed to fetch stored answers', err);
    return null;
  }
}
