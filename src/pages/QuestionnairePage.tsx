import React from 'react';
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

type AnswerState = 'pending' | 'correct' | 'incorrect';

interface QuestionnairePageProps {
  title: string;
  description: string;
  questions: { id: string }[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  answeredStates: AnswerState[];
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  scorePercent: number;
  isFlashcard: boolean;
  showSummary: boolean;
  retaking: boolean;
  onRetake: () => void;
}

const statusColorMap: Record<AnswerState, string> = {
  correct: 'bg-emerald-500 text-emerald-50',
  incorrect: 'bg-destructive text-destructive-foreground',
  pending: 'bg-muted text-muted-foreground',
};

const progressBadgeBase =
  'grid h-8 w-8 place-items-center rounded-full border border-transparent text-sm font-semibold transition-colors';
const summaryBadgeBase =
  'grid h-7 w-7 place-items-center rounded-full border border-transparent px-0 text-xs font-semibold';

const QuestionnairePage: React.FC<QuestionnairePageProps> = ({
  title,
  description,
  questions,
  currentIndex,
  loading,
  error,
  answeredStates,
  correctCount,
  incorrectCount,
  totalQuestions,
  scorePercent,
  isFlashcard,
  showSummary,
  retaking,
  onRetake,
}) => {
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
            <Button onClick={onRetake} disabled={retaking} variant="secondary">
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
};

export default QuestionnairePage;
