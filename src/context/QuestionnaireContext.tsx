import React, { createContext, useContext, useEffect, useState } from 'react';
import { questionnaire as staticQuestionnaire, type Question, type QuestionnaireType } from '../data/questionnaire';
import {
  clearPersistedAnswers,
  fetchQuestionnaire,
  fetchQuestionnaires,
  fetchStoredAnswers,
  loadAnswers,
  postAnswers,
  saveAnswers
} from '../services/api';

export type AnswerCorrectness = 'yes' | 'no';

export interface AnswerRecord {
  value?: string;
  correct?: AnswerCorrectness;
  rightAnswer?: string | string[] | null;
  revealed?: boolean;
}

export interface AnswerMap { [questionId: string]: AnswerRecord; }

const normalizeCandidates = (rightAnswer: string | string[] | null | undefined): string[] => {
  if (typeof rightAnswer === 'string') {
    return [rightAnswer];
  }
  if (Array.isArray(rightAnswer)) {
    return rightAnswer.filter((entry): entry is string => typeof entry === 'string');
  }
  return [];
};

const hasFlashcardBack = (question: Question | undefined) => {
  if (!question) return false;
  if (typeof question.rightAnswer === 'string') {
    return question.rightAnswer.trim().length > 0;
  }
  if (Array.isArray(question.rightAnswer)) {
    return question.rightAnswer.length > 0;
  }
  return false;
};

const resolveQuestionnaireType = (questionnaire: { type?: QuestionnaireType | null; questionnaireType?: QuestionnaireType | null; questions: Question[] }): QuestionnaireType => {
  const declaredRaw = questionnaire.type ?? questionnaire.questionnaireType;
  const declared = typeof declaredRaw === 'string' ? declaredRaw.trim() : undefined;
  if (declared === 'flashcard' || declared === 'test' || declared === 'question') {
    return declared;
  }

  const onlyTextQuestions = questionnaire.questions.length > 0 && questionnaire.questions.every(q => q.type === 'text' && !q.options && typeof q.scaleMax === 'undefined');
  if (onlyTextQuestions && questionnaire.questions.some(q => hasFlashcardBack(q))) {
    return 'flashcard';
  }

  return declared ?? 'question';
};

const evaluateAnswerRecord = (
  question: Question | undefined,
  value: string | boolean | undefined,
  previous: AnswerRecord | undefined,
  evaluate: boolean,
  questionnaireType: QuestionnaireType
): AnswerRecord => {
  const record: AnswerRecord = {};
  const replaceExisting = typeof value !== 'undefined';

  if (typeof value === 'string') {
    record.value = value;
  } else if (typeof previous?.value === 'string') {
    record.value = previous.value;
  }

  if (typeof value === 'boolean') {
    record.revealed = value;
  } else if (typeof previous?.revealed === 'boolean' && !replaceExisting) {
    record.revealed = previous.revealed;
  } else if (typeof previous?.revealed === 'boolean' && typeof value !== 'boolean') {
    record.revealed = previous.revealed;
  }

  const baseValue = typeof record.value === 'string' ? record.value : undefined;

  let rightAnswerSource: string | string[] | null | undefined;
  if (question && typeof question.rightAnswer !== 'undefined') {
    rightAnswerSource = question.rightAnswer ?? null;
  }
  if (typeof rightAnswerSource === 'undefined' && previous && typeof previous.rightAnswer !== 'undefined') {
    rightAnswerSource = previous.rightAnswer;
  }
  if (typeof rightAnswerSource !== 'undefined') {
    record.rightAnswer = rightAnswerSource;
  }

  if (questionnaireType === 'test' && evaluate && typeof baseValue === 'string') {
    const trimmed = baseValue.trim();
    const candidates = normalizeCandidates(rightAnswerSource);
    if (trimmed && candidates.length > 0) {
      const normalized = trimmed.toLowerCase();
      const match = candidates
        .map(answer => answer.trim().toLowerCase())
        .some(answer => answer === normalized);
      record.correct = match ? 'yes' : 'no';
    }
  } else if (!evaluate && !replaceExisting && previous?.correct) {
    record.correct = previous.correct;
  }

  return record;
};

const attachRightAnswers = (
  incoming: AnswerMap,
  questionList: Question[],
  questionnaireType: QuestionnaireType
): AnswerMap => {
  if (!incoming || Object.keys(incoming).length === 0) {
    return incoming;
  }

  const lookup = new Map(questionList.map(question => [question.id, question]));
  const next: AnswerMap = {};

  for (const [id, existing] of Object.entries(incoming)) {
    const question = lookup.get(id);
    next[id] = evaluateAnswerRecord(question, undefined, existing, false, questionnaireType);
  }

  return next;
};
interface QuestionnaireData {
  id: string;
  title: string;
  description: string;
  type: QuestionnaireType;
  questions: Question[];
}
interface ContextValue {
  answers: AnswerMap;
  setAnswer: (id: string, value: string | boolean) => void;
  currentIndex: number;
  next: () => void;
  prev: () => void;
  questions: Question[];
  title: string;
  description: string;
  submit: () => Promise<void>;
  completed: boolean;
  submitted: boolean;
  loading: boolean;
  error: string | null;
  questionnaireId: string;
  questionnaires: QuestionnaireData[];
  setQuestionnaireId: (id: string) => void;
  resetAnswers: () => Promise<void>;
  questionnaireType: QuestionnaireType;
}

const Ctx = createContext<ContextValue | undefined>(undefined);

const defaultQuestionnaires: QuestionnaireData[] = [
  {
    id: staticQuestionnaire.id,
    title: staticQuestionnaire.title,
    description: staticQuestionnaire.description,
    type: resolveQuestionnaireType(staticQuestionnaire),
    questions: staticQuestionnaire.questions
  }
];

export const QuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialType = resolveQuestionnaireType(staticQuestionnaire);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireData[]>(defaultQuestionnaires);
  const [questionnaireId, setQuestionnaireId] = useState<string>(staticQuestionnaire.id);
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    attachRightAnswers(loadAnswers(staticQuestionnaire.id), staticQuestionnaire.questions, initialType)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(staticQuestionnaire.questions);
  const [title, setTitle] = useState(staticQuestionnaire.title);
  const [description, setDescription] = useState(staticQuestionnaire.description);
  const [questionnaireType, setQuestionnaireType] = useState<QuestionnaireType>(initialType);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.debug('[QuestionnaireProvider] attempting to load questionnaires');
      try {
        let loaded = false;
        const remoteList = await fetchQuestionnaires();
        if (mounted && remoteList.length > 0) {
          const normalized = remoteList.map(remote => {
            const type = resolveQuestionnaireType({ type: remote.type, questionnaireType: remote.questionnaireType, questions: remote.questions });
            return {
              id: remote.id,
              title: remote.title,
              description: remote.description,
              type,
              questions: remote.questions,
            };
          });
          setQuestionnaires(normalized);
          setQuestionnaireId(prev => normalized.some(q => q.id === prev) ? prev : normalized[0].id);
          setError(null);
          loaded = true;
        }

        if (!loaded) {
          const fallbackRemote = await fetchQuestionnaire();
          if (mounted && fallbackRemote) {
            const normalizedFallback: QuestionnaireData = {
              id: fallbackRemote.id,
              title: fallbackRemote.title,
              description: fallbackRemote.description,
              type: resolveQuestionnaireType({ type: fallbackRemote.type, questionnaireType: fallbackRemote.questionnaireType, questions: fallbackRemote.questions }),
              questions: fallbackRemote.questions,
            };
            setQuestionnaires([normalizedFallback]);
            setQuestionnaireId(normalizedFallback.id);
            setError(null);
            loaded = true;
          }
        }

        if (!loaded && mounted) {
          console.warn('[QuestionnaireProvider] no remote questionnaires available, using bundled data');
        }
      } catch (e) {
        console.error('[QuestionnaireProvider] failed to load questionnaires', e);
        if (mounted) setError('Failed to load questionnaires');
      } finally {
        console.debug('[QuestionnaireProvider] questionnaire load complete');
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const active = questionnaires.find(q => q.id === questionnaireId);
    if (!active) {
      return;
    }
    const effectiveType = resolveQuestionnaireType(active);

    setQuestions(active.questions);
    setTitle(active.title);
    setDescription(active.description);
    setQuestionnaireType(effectiveType);
    setCurrentIndex(0);
    setSubmitted(false);

    setAnswers(attachRightAnswers(loadAnswers(questionnaireId), active.questions, effectiveType));

    let cancelled = false;
    (async () => {
      try {
        const stored = await fetchStoredAnswers(questionnaireId);
        if (cancelled || !stored) {
          return;
        }
        let hydratedApplied = false;
        setAnswers(prev => {
          if (Object.keys(prev).length > 0) {
            return prev;
          }
          const hydrated = attachRightAnswers(stored, active.questions, effectiveType);
          hydratedApplied = true;
          saveAnswers(questionnaireId, hydrated);
          return hydrated;
        });
        if (hydratedApplied) {
          setSubmitted(false);
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.warn('[QuestionnaireProvider] unable to restore stored answers', fetchError);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [questionnaireId, questionnaires]);

  const setAnswer = (id: string, value: string | boolean) => {
    setAnswers(prev => {
      const activeQuestion = questions.find(question => question.id === id);
      const record = evaluateAnswerRecord(activeQuestion, value, prev[id], false, questionnaireType);
      const updated: AnswerMap = { ...prev, [id]: record };
      saveAnswers(questionnaireId, updated);
      return updated;
    });
  };
  const finalizeAnswerForQuestion = (map: AnswerMap, question: Question | undefined): AnswerMap => {
    if (!question) {
      return map;
    }
    const existing = map[question.id];
    if (!existing) {
      return map;
    }
    if (questionnaireType !== 'test') {
      return map;
    }
    const baseValue = existing.value ?? '';
    if (typeof baseValue !== 'string' || baseValue.trim().length === 0) {
      return map;
    }
    const evaluated = evaluateAnswerRecord(question, baseValue, existing, true, questionnaireType);
    if (evaluated.correct === existing.correct) {
      return map;
    }
    return { ...map, [question.id]: evaluated };
  };

  const next = () => {
    const activeQuestion = questions[currentIndex];
    setAnswers(prev => {
      const updated = finalizeAnswerForQuestion(prev, activeQuestion);
      if (updated !== prev) {
        saveAnswers(questionnaireId, updated);
        return updated;
      }
      return prev;
    });
    setCurrentIndex(i => Math.min(i + 1, questions.length - 1));
  };
  const prev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const submit = async () => {
    const activeQuestion = questions[currentIndex];
    let evaluatedAnswers = answers;
    setAnswers(prev => {
      const nextMap = finalizeAnswerForQuestion(prev, activeQuestion);
      evaluatedAnswers = nextMap;
      return nextMap === prev ? prev : nextMap;
    });
    saveAnswers(questionnaireId, evaluatedAnswers);
    try {
      await postAnswers(questionnaireId, evaluatedAnswers);
      setSubmitted(true);
    } catch (err) {
      console.warn('[QuestionnaireProvider] failed to submit answers', err);
      throw err;
    }
  };
  const resetAnswers = async () => {
    clearPersistedAnswers(questionnaireId);
    setSubmitted(false);
    setAnswers({});
    setCurrentIndex(0);
    try {
      await postAnswers(questionnaireId, {});
    } catch (err) {
      console.warn('[QuestionnaireProvider] failed to clear remote answers', err);
    }
  };
  const completed = questions.every(q => {
    const record = answers[q.id];
    if (questionnaireType === 'flashcard') {
      return record?.revealed === true;
    }
    const value = record?.value;
    return typeof value === 'string' && value.trim().length > 0;
  });

  return (
    <Ctx.Provider
      value={{
        answers,
        setAnswer,
        currentIndex,
        next,
        prev,
        questions,
        title,
        description,
        submit,
        completed,
        submitted,
        loading,
        error,
        questionnaireId,
        questionnaires,
        setQuestionnaireId,
        resetAnswers,
        questionnaireType
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useQuestionnaire = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useQuestionnaire must be used within QuestionnaireProvider');
  return ctx;
};
