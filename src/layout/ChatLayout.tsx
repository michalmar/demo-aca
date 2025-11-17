import React from 'react';
import { ClipboardList, HelpCircle, MessageSquare, Settings } from 'lucide-react';

import { ModeToggle } from '@/components/ModeToggle';
import AnswerInput from '../components/AnswerInput';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

type AnswerState = 'pending' | 'correct' | 'incorrect';

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
    setQuestionnaireId,
    answers,
    submitted,
    resetAnswers
  } = useQuestionnaire();
  const [retaking, setRetaking] = React.useState(false);
  const currentQuestion = questions[currentIndex];
  const hasMultipleQuestionnaires = questionnaires.length > 1;
  const statusColorMap: Record<AnswerState, string> = {
    correct: 'bg-emerald-500 text-emerald-50',
    incorrect: 'bg-destructive text-destructive-foreground',
    pending: 'bg-muted text-muted-foreground',
  };
  const progressBadgeBase = 'grid h-8 w-8 place-items-center rounded-full border border-transparent text-sm font-semibold transition-colors';
  const summaryBadgeBase = 'grid h-7 w-7 place-items-center rounded-full border border-transparent px-0 text-xs font-semibold';
  const answeredStates: AnswerState[] = questions.map(question => {
    const record = answers[question.id];
    const value = (record?.value ?? '').trim();
    if (!value) {
      return 'pending' as const;
    }
    if (record?.correct === 'yes') {
      return 'correct' as const;
    }
    if (record?.correct === 'no') {
      return 'incorrect' as const;
    }
    return 'pending' as const;
  });
  const correctCount = answeredStates.filter(state => state === 'correct').length;
  const incorrectCount = answeredStates.filter(state => state === 'incorrect').length;
  const totalQuestions = questions.length;
  const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const showSummary = submitted && !loading;
  const handleRetake = async () => {
    if (retaking) return;
    setRetaking(true);
    try {
      await resetAnswers();
    } finally {
      setRetaking(false);
    }
  };

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
            {showSummary ? (
              <Card className="bg-card/90 backdrop-blur">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base font-semibold">Results Summary</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    You answered {correctCount} of {totalQuestions} questions correctly ({scorePercent}%).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {answeredStates.map((state, index) => (
                      <Badge key={questions[index].id} className={cn(summaryBadgeBase, statusColorMap[state])}>
                        {index + 1}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Correct</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-500">{correctCount}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Incorrect</p>
                      <p className="mt-1 text-lg font-semibold text-destructive">{incorrectCount}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Score</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{scorePercent}%</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Need more practice? Retake the questionnaire to try again.
                  </div>
                  <Button onClick={handleRetake} disabled={retaking} variant="secondary">
                    {retaking ? 'Preparing…' : 'Retake questionnaire'}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                {!loading && questions.length > 0 && (
                  <Card className="mb-6 bg-card/80 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Answer Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        {answeredStates.map((state, index) => {
                          const statusClasses = statusColorMap[state];
                          const isActive = index === currentIndex;
                          const labelBase = state === 'correct' ? 'correct' : state === 'incorrect' ? 'incorrect' : 'pending';
                          return (
                            <Badge
                              key={questions[index].id}
                              className={cn(progressBadgeBase, statusClasses, isActive && 'ring-2 ring-ring ring-offset-2')}
                              aria-label={`Question ${index + 1} ${labelBase}`}
                            >
                              {index + 1}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">{correctCount} of {questions.length} correct</p>
                    </CardContent>
                  </Card>
                )}
                {loading && <p className="text-sm text-muted-foreground">Loading questions...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {!loading && !currentQuestion && (
                  <p className="text-sm text-muted-foreground">No questions available.</p>
                )}
                {!loading && currentQuestion && (
                  <p className="text-sm text-muted-foreground">Answer the prompt below to continue.</p>
                )}
              </>
            )}
          </div>
          {!showSummary && <AnswerInput />}
        </main>
      </div>
    </div>
  );
};

export default ChatLayout;
