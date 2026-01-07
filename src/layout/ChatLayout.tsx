import React from 'react';
import { Menu } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import type { MenuView } from '@/components/nav-menus';
import AnswerInput from '../components/AnswerInput';
import UploadTopic from '../components/UploadTopic';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

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
    resetAnswers,
    questionnaireType,
    refreshQuestionnaires,
  } = useQuestionnaire();

  const [retaking, setRetaking] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<MenuView>('questionnaire');

  const statusColorMap: Record<AnswerState, string> = {
    correct: 'bg-emerald-500 text-emerald-50',
    incorrect: 'bg-destructive text-destructive-foreground',
    pending: 'bg-muted text-muted-foreground',
  };

  const progressBadgeBase =
    'grid h-8 w-8 place-items-center rounded-full border border-transparent text-sm font-semibold transition-colors';
  const summaryBadgeBase =
    'grid h-7 w-7 place-items-center rounded-full border border-transparent px-0 text-xs font-semibold';

  const answeredStates: AnswerState[] = questions.map((question) => {
    const record = answers[question.id];
    if (questionnaireType === 'flashcard') {
      return record?.revealed ? 'correct' : 'pending';
    }
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

  const correctCount = answeredStates.filter((state) => state === 'correct').length;
  const incorrectCount = answeredStates.filter((state) => state === 'incorrect').length;
  const totalQuestions = questions.length;
  const scorePercent = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;
  const isFlashcard = questionnaireType === 'flashcard';
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

  const handleUploadSuccess = async () => {
    if (refreshQuestionnaires) {
      await refreshQuestionnaires();
    }
  };

  const handleQuestionnaireSelect = (id: string) => {
    setQuestionnaireId(id);
    setCurrentView('questionnaire');
  };

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'upload':
        return 'Upload Topic';
      case 'responses':
        return 'Responses';
      case 'settings':
        return 'Settings';
      case 'help':
        return 'Help & Support';
      default:
        return title;
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-foreground">Upload New Topic</h2>
              <p className="text-sm text-muted-foreground">
                Add educational content to generate flashcards and quizzes
              </p>
            </div>
            <UploadTopic onSuccess={handleUploadSuccess} />
          </>
        );
      case 'responses':
        return (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Responses</h2>
            <p className="text-sm text-muted-foreground">
              View and manage your questionnaire responses
            </p>
            <Card className="mt-4">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No responses yet.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure your preferences
            </p>
            <Card className="mt-4">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Settings coming soon.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'help':
        return (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Help & Support</h2>
            <p className="text-sm text-muted-foreground">
              Get help with using the app
            </p>
            <Card className="mt-4">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Need help? Contact support@example.com
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {showSummary ? (
              <Card className="bg-card/90 backdrop-blur">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base font-semibold">
                    {isFlashcard ? 'Review Summary' : 'Results Summary'}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {isFlashcard
                      ? `You reviewed ${correctCount} of ${totalQuestions} cards (${scorePercent}%).`
                      : `You answered ${correctCount} of ${totalQuestions} questions correctly (${scorePercent}%).`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {answeredStates.map((state, index) => (
                      <Badge
                        key={questions[index].id}
                        className={cn(summaryBadgeBase, statusColorMap[state])}
                      >
                        {index + 1}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {isFlashcard ? 'Reviewed' : 'Correct'}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-emerald-500">
                        {correctCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {isFlashcard ? 'Remaining' : 'Incorrect'}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-destructive">
                        {isFlashcard ? totalQuestions - correctCount : incorrectCount}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {isFlashcard ? 'Progress' : 'Score'}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {scorePercent}%
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    {isFlashcard
                      ? 'Want another pass? Retake the deck to reinforce the terms.'
                      : 'Need more practice? Retake the questionnaire to try again.'}
                  </div>
                  <Button onClick={handleRetake} disabled={retaking} variant="secondary">
                    {retaking
                      ? 'Preparing…'
                      : isFlashcard
                        ? 'Retake deck'
                        : 'Retake questionnaire'}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                {!loading && questions.length > 0 && (
                  <Card className="mb-6 bg-card/80 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        {isFlashcard ? 'Card Progress' : 'Answer Progress'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        {answeredStates.map((state, index) => {
                          const statusClasses = statusColorMap[state];
                          const isActive = index === currentIndex;
                          const labelBase =
                            state === 'correct'
                              ? isFlashcard
                                ? 'reviewed'
                                : 'correct'
                              : state === 'incorrect'
                                ? 'incorrect'
                                : isFlashcard
                                  ? 'not reviewed'
                                  : 'pending';
                          return (
                            <Badge
                              key={questions[index].id}
                              className={cn(
                                progressBadgeBase,
                                statusClasses,
                                isActive && 'ring-2 ring-ring ring-offset-2'
                              )}
                              aria-label={`Question ${index + 1} ${labelBase}`}
                            >
                              {index + 1}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isFlashcard
                          ? `${correctCount} of ${questions.length} cards reviewed`
                          : `${correctCount} of ${questions.length} correct`}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {loading && (
                  <p className="text-sm text-muted-foreground">Loading questions...</p>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {!loading && !questions[currentIndex] && (
                  <p className="text-sm text-muted-foreground">No questions available.</p>
                )}
                {!loading && questions[currentIndex] && (
                  <p className="text-sm text-muted-foreground">
                    {isFlashcard
                      ? 'Flip each card to reveal the explanation.'
                      : 'Answer the prompt below to continue.'}
                  </p>
                )}
              </>
            )}
          </>
        );
    }
  };

  return (
    <>
      <AppSidebar
        questionnaires={questionnaires}
        activeQuestionnaireId={questionnaireId}
        onQuestionnaireSelect={handleQuestionnaireSelect}
        activeView={currentView}
        onViewChange={setCurrentView}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <span className="text-muted-foreground">Student Forms</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{getBreadcrumbTitle()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6">
            {renderContent()}
          </div>
          {currentView === 'questionnaire' && !showSummary && <AnswerInput />}
        </main>
      </SidebarInset>
    </>
  );
};

export default ChatLayout;
