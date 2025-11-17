import React from 'react';
import { ClipboardList, HelpCircle, MessageSquare, Settings } from 'lucide-react';

import { ModeToggle } from '@/components/ModeToggle';
import AnswerInput from '../components/AnswerInput';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { cn } from '@/lib/utils';

const ChatLayout: React.FC = () => {
  const {
    questions,
    loading,
    error,
    currentIndex,
    title,
    description,
    questionnaires,
    questionnaireId,
    setQuestionnaireId
  } = useQuestionnaire();
  const currentQuestion = questions[currentIndex];
  const hasMultipleQuestionnaires = questionnaires.length > 1;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden border-r border-border/60 bg-card/40 md:flex md:w-72 lg:w-80">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Student Forms</p>
              <p className="text-xs text-muted-foreground">Manage questionnaires</p>
            </div>
            <ModeToggle />
          </div>
          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 text-sm">
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questionnaires</p>
              <div className="mt-3 space-y-1">
                {questionnaires.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQuestionnaireId(q.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                      questionnaireId === q.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span className="truncate">{q.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Menus</p>
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Responses</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Help &amp; Support</span>
                </button>
              </div>
            </div>
          </nav>
          <div className="border-t border-border/60 px-5 py-4 text-xs text-muted-foreground">
            Signed in as<br />student@example.com
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <h1 className="text-base font-semibold text-foreground">Student Questionnaire</h1>
            <p className="text-xs text-muted-foreground">Answer the prompts below</p>
          </div>
          <div className="flex items-center gap-3">
            {hasMultipleQuestionnaires && (
              <select
                value={questionnaireId}
                onChange={event => setQuestionnaireId(event.target.value)}
                className="rounded-md border border-border/70 bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {questionnaires.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            )}
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6">
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
    </div>
  );
};

export default ChatLayout;
