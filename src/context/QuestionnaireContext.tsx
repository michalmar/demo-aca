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

export interface AnswerMap { [questionId: string]: string; }
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
  const [answers, setAnswers] = useState<AnswerMap>(() => loadAnswers(staticQuestionnaire.id));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(staticQuestionnaire.questions);
  const [title, setTitle] = useState(staticQuestionnaire.title);
  const [description, setDescription] = useState(staticQuestionnaire.description);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    setAnswers(loadAnswers(questionnaireId));

    let cancelled = false;
    (async () => {
      try {
        const stored = await fetchStoredAnswers(questionnaireId);
        if (cancelled || !stored) {
          return;
        }
        setAnswers(prev => {
          if (Object.keys(prev).length > 0) {
            return prev;
          }
          saveAnswers(questionnaireId, stored);
          return stored;
        });
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
    setAnswers(a => {
      const updated = { ...a, [id]: value };
      saveAnswers(questionnaireId, updated);
      return updated;
    });
  };
  const next = () => setCurrentIndex(i => Math.min(i + 1, questions.length - 1));
  const prev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const submit = async () => { await postAnswers(questionnaireId, answers); };
  const resetAnswers = async () => {
    clearPersistedAnswers(questionnaireId);
    setAnswers({});
    setCurrentIndex(0);
    try {
      await postAnswers(questionnaireId, {});
    } catch (err) {
      console.warn('[QuestionnaireProvider] failed to clear remote answers', err);
    }
  };
  const completed = questions.every(q => answers[q.id]);

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
