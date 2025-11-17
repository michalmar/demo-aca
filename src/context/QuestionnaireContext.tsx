import React, { createContext, useContext, useEffect, useState } from 'react';
import { questionnaire as staticQuestionnaire, type Question } from '../data/questionnaire';
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

const evaluateAnswerRecord = (
  question: Question | undefined,
  value: string | undefined,
  previous?: AnswerRecord,
  evaluate: boolean = false
): AnswerRecord => {
  const record: AnswerRecord = {};
  const replaceExisting = typeof value === 'string';

  const baseValue = typeof value === 'string'
    ? value
    : typeof previous?.value === 'string'
      ? previous.value
      : undefined;

  if (typeof baseValue === 'string') {
    record.value = baseValue;
  }

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

  if (evaluate && typeof baseValue === 'string') {
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

const attachRightAnswers = (incoming: AnswerMap, questionList: Question[]): AnswerMap => {
  if (!incoming || Object.keys(incoming).length === 0) {
    return incoming;
  }

  const lookup = new Map(questionList.map(question => [question.id, question]));
  const next: AnswerMap = {};

  for (const [id, existing] of Object.entries(incoming)) {
    const question = lookup.get(id);
    next[id] = evaluateAnswerRecord(question, undefined, existing, false);
  }

  return next;
};
interface QuestionnaireData {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}
interface ContextValue {
  answers: AnswerMap;
  setAnswer: (id: string, value: string) => void;
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
}

const Ctx = createContext<ContextValue | undefined>(undefined);

const defaultQuestionnaires: QuestionnaireData[] = [
  {
    id: staticQuestionnaire.id,
    title: staticQuestionnaire.title,
    description: staticQuestionnaire.description,
    questions: staticQuestionnaire.questions
  }
];

export const QuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireData[]>(defaultQuestionnaires);
  const [questionnaireId, setQuestionnaireId] = useState<string>(staticQuestionnaire.id);
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    attachRightAnswers(loadAnswers(staticQuestionnaire.id), staticQuestionnaire.questions)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(staticQuestionnaire.questions);
  const [title, setTitle] = useState(staticQuestionnaire.title);
  const [description, setDescription] = useState(staticQuestionnaire.description);
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
          setQuestionnaires(remoteList);
          setQuestionnaireId(prev => remoteList.some(q => q.id === prev) ? prev : remoteList[0].id);
          setError(null);
          loaded = true;
        }

        if (!loaded) {
          const fallbackRemote = await fetchQuestionnaire();
          if (mounted && fallbackRemote) {
            setQuestionnaires([fallbackRemote]);
            setQuestionnaireId(fallbackRemote.id);
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

    setQuestions(active.questions);
    setTitle(active.title);
    setDescription(active.description);
    setCurrentIndex(0);
    setSubmitted(false);

    setAnswers(attachRightAnswers(loadAnswers(questionnaireId), active.questions));

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
          const hydrated = attachRightAnswers(stored, active.questions);
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

  const setAnswer = (id: string, value: string) => {
    setAnswers(prev => {
      const activeQuestion = questions.find(question => question.id === id);
      const record = evaluateAnswerRecord(activeQuestion, value, prev[id], false);
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
    const baseValue = existing?.value ?? '';
    if (!existing || typeof baseValue !== 'string' || baseValue.trim().length === 0) {
      return map;
    }
    const evaluated = evaluateAnswerRecord(question, baseValue, existing, true);
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
    const value = answers[q.id]?.value;
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
        resetAnswers
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
