import type { AnswerMap } from '../context/QuestionnaireContext';

export interface QuestionnaireResponse {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'text' | 'multichoice' | 'scale';
    options?: string[];
    scaleMax?: number;
    rightAnswer?: string | string[] | null;
  }>;
}

const KEY_PREFIX = 'student-questionnaire-answers-v1';
const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';
// Surface resolved API base for debugging deployment issues.
console.debug('[ApiService] using API base', API_BASE);
const USER_ID_KEY = 'student-questionnaire-user-id';

function answersKey(questionnaireId: string) {
  return `${KEY_PREFIX}:${questionnaireId}`;
}

function normalizeRightAnswer(input: unknown): string | string[] | undefined {
  if (typeof input === 'string') {
    return input;
  }
  if (Array.isArray(input)) {
    const normalized = input.filter((item): item is string => typeof item === 'string');
    return normalized;
  }
  return undefined;
}

function normalizeAnswerMap(raw: unknown): AnswerMap {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  const output: AnswerMap = {};

  for (const [key, value] of entries) {
    if (typeof value === 'string') {
      output[key] = { value };
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const storedValue = obj.value;
      const recordValue = typeof storedValue === 'string' ? storedValue : '';
      const correct = obj.correct === 'yes' || obj.correct === 'no' ? obj.correct : undefined;
      const rightAnswer = normalizeRightAnswer(obj.rightAnswer);

      output[key] = {
        value: recordValue,
        correct,
        rightAnswer,
      };
    }
  }

  return output;
}

export function clearPersistedAnswers(questionnaireId: string) {
  try {
    localStorage.removeItem(answersKey(questionnaireId));
  } catch (err) {
    console.warn('[ApiService] failed to clear persisted answers', err);
  }
}

function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function saveAnswers(questionnaireId: string, answers: AnswerMap) {
  try {
    localStorage.setItem(answersKey(questionnaireId), JSON.stringify(answers));
  } catch (err) {
    console.warn('[ApiService] failed to persist answers locally', err);
  }
}

export function loadAnswers(questionnaireId: string): AnswerMap {
  try {
    const raw = JSON.parse(localStorage.getItem(answersKey(questionnaireId)) || '{}');
    return normalizeAnswerMap(raw);
  } catch {
    return {};
  }
}

export async function fetchQuestionnaires(): Promise<QuestionnaireResponse[]> {
  const endpoint = `${API_BASE}/api/questionnaires`;
  try {
    console.debug('[ApiService] fetching questionnaires from', endpoint);
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Bad response (${res.status})`);
    const payload = await res.json();
    console.debug('[ApiService] questionnaires response', payload);
    return payload as QuestionnaireResponse[];
  } catch (err) {
    console.warn('[ApiService] failed to fetch questionnaires', err);
    return [];
  }
}

export async function fetchQuestionnaire(questionnaireId?: string): Promise<QuestionnaireResponse | null> {
  const path = questionnaireId ? `/api/questionnaires/${questionnaireId}` : '/api/questionnaire';
  const endpoint = `${API_BASE}${path}`;
  try {
    console.debug('[ApiService] fetching questionnaire from', endpoint);
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Bad response (${res.status})`);
    const payload = await res.json();
    console.debug('[ApiService] questionnaire response', payload);
    return payload as QuestionnaireResponse;
  } catch (err) {
    console.warn('[ApiService] failed to fetch questionnaire', err);
    return null;
  }
}

export async function postAnswers(questionnaireId: string, answers: AnswerMap) {
  const userId = getUserId();
  try {
    console.debug('[ApiService] posting answers for user', userId, 'questionnaire', questionnaireId, answers);
    const res = await fetch(`${API_BASE}/api/questionnaires/${questionnaireId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionnaireId, answers })
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

export async function fetchStoredAnswers(questionnaireId: string) {
  const userId = getUserId();
  try {
    console.debug('[ApiService] fetching stored answers for user', userId, 'questionnaire', questionnaireId);
    const endpoint = `${API_BASE}/api/questionnaires/${questionnaireId}/answers/${userId}`;
    const res = await fetch(endpoint);
    if (res.status === 404) {
      console.debug('[ApiService] no stored answers found for user', userId, 'on questionnaire', questionnaireId);
      return null;
    }
    if (!res.ok) {
      const reason = await res.text().catch(() => '');
      throw new Error(`Unexpected ${res.status} from stored answers endpoint${reason ? `: ${reason}` : ''}`);
    }
    const data = await res.json();
    console.debug('[ApiService] stored answers response', data);
    return normalizeAnswerMap(data.answers);
  } catch (err) {
    console.warn('[ApiService] failed to fetch stored answers', err);
    return null;
  }
}
