import type { AnswerMap } from '../context/QuestionnaireContext';

const KEY = 'student-questionnaire-answers-v1';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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
    const res = await fetch(`${API_BASE}/api/questionnaire`);
    if (!res.ok) throw new Error('Bad response');
    return await res.json();
  } catch {
    // Fallback: front-end static data already imported elsewhere
    return null;
  }
}

export async function postAnswers(answers: AnswerMap) {
  const userId = getUserId();
  try {
    const res = await fetch(`${API_BASE}/api/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers })
    });
    if (!res.ok) throw new Error('Failed to submit');
    return await res.json();
  } catch (e) {
    // Fallback to mock latency
    await new Promise(r => setTimeout(r, 400));
    return { ok: true, offline: true };
  }
}

export async function fetchStoredAnswers() {
  const userId = getUserId();
  try {
    const res = await fetch(`${API_BASE}/api/answers/${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.answers as AnswerMap;
  } catch {
    return null;
  }
}
