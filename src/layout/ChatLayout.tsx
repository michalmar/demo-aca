import React from 'react';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import AnswerInput from '../components/AnswerInput';
import { ModeToggle } from '@/components/ModeToggle';

const ChatLayout: React.FC = () => {
  const { questions, loading, error, currentIndex, title, description } = useQuestionnaire();
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Student Questionnaire</h1>
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {loading && <p className="text-sm text-muted-foreground">Loading questions...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !currentQuestion && (
            <p className="text-sm text-muted-foreground">No questions available.</p>
          )}
          {!loading && currentQuestion && (
            <p className="text-sm text-muted-foreground">Answer the prompt below to continue.</p>
          )}
        </div>
      <AnswerInput />
      </main>
    </div>
  );
};

export default ChatLayout;
