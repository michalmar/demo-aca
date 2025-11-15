import React, { createContext, useContext, useState, useEffect } from 'react';
import { questionnaire as staticQuestionnaire } from '../data/questionnaire';
import { saveAnswers, loadAnswers, fetchQuestionnaire, postAnswers, fetchStoredAnswers } from '../services/api';

export interface AnswerMap { [questionId: string]: string; }
interface ContextValue {
  answers: AnswerMap;
  setAnswer: (id: string, value: string) => void;
  currentIndex: number;
  next: () => void;
  prev: () => void;
  questions: typeof staticQuestionnaire.questions;
  title: string;
  description: string;
  submit: () => Promise<void>;
  completed: boolean;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<ContextValue | undefined>(undefined);

export const QuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [answers, setAnswers] = useState<AnswerMap>(loadAnswers());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState(staticQuestionnaire.questions);
  const [title, setTitle] = useState(staticQuestionnaire.title);
  const [description, setDescription] = useState(staticQuestionnaire.description);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.debug('[QuestionnaireProvider] attempting to load questionnaire');
      try {
        // attempt remote questionnaire
        const remote = await fetchQuestionnaire();
        if (mounted && remote) {
          console.debug('[QuestionnaireProvider] remote questionnaire received', remote);
          if (remote.questions) setQuestions(remote.questions);
          if (remote.title) setTitle(remote.title);
          if (remote.description) setDescription(remote.description);
        }
        // // attempt stored answers fetch
        // const stored = await fetchStoredAnswers();
        // if (mounted && stored) {
        //   setAnswers(stored);
        // }
      } catch (e) {
        console.error('[QuestionnaireProvider] failed to load questionnaire', e);
        if (mounted) setError('Failed to load questionnaire');
      } finally {
        console.debug('[QuestionnaireProvider] questionnaire load complete');
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setAnswer = (id: string, value: string) => {
    setAnswers(a => { const updated = { ...a, [id]: value }; saveAnswers(updated); return updated; });
  };
  const next = () => setCurrentIndex(i => Math.min(i + 1, questions.length - 1));
  const prev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const submit = async () => { await postAnswers(answers); };
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
        error
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
