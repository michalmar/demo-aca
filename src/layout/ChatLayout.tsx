import React from 'react';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import AnswerInput from '../components/AnswerInput';

const ChatLayout: React.FC = () => {
  const { questions, loading, error, currentIndex, title, description } = useQuestionnaire();
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b border-surface/70 bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Student Questionnaire</h1>
          <button
            className="text-xs text-gray-300 hover:text-white"
            onClick={() => { document.documentElement.classList.toggle('dark'); }}
          >Theme</button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="text-sm text-gray-300">{description}</p>
          </div>
          {loading && <p className="text-sm text-gray-400">Loading questions...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !currentQuestion && (
            <p className="text-sm text-gray-400">No questions available.</p>
          )}
          {!loading && currentQuestion && (
            <p className="text-sm text-gray-400">Answer the prompt below to continue.</p>
          )}
        </div>
      <AnswerInput />
      </main>
    </div>
  );
};

export default ChatLayout;
