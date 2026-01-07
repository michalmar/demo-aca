import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { cn } from '@/lib/utils';

const AnswerInput: React.FC = () => {
  const {
    questions,
    currentIndex,
    setAnswer,
    answers,
    next,
    prev,
    completed,
    submit,
    loading,
    title,
    resetAnswers,
    questionnaireType
  } = useQuestionnaire();
  const q = questions[currentIndex];
  const [clearing, setClearing] = React.useState(false);

  const answerRecord = q ? answers[q.id] : undefined;
  const answerValue = typeof answerRecord?.value === 'string' ? answerRecord.value : '';
  const isFlashcard = questionnaireType === 'flashcard';
  const isRevealed = answerRecord?.revealed === true;
  const hasAnswer = isFlashcard ? isRevealed : answerValue.trim().length > 0;

  const onChange = (val: string) => {
    if (!q) return;
    setAnswer(q.id, val);
  };

  const onClear = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await resetAnswers();
    } finally {
      setClearing(false);
    }
  };

  const onFlashcardFlip = (forceReveal?: boolean) => {
    if (!q) return;
    const nextState = typeof forceReveal === 'boolean' ? forceReveal : !isRevealed;
    setAnswer(q.id, nextState);
  };

  const flashcardBack = React.useMemo(() => {
    if (!q) return '';
    if (Array.isArray(q.rightAnswer)) {
      return q.rightAnswer.join('\n');
    }
    return q.rightAnswer ?? '';
  }, [q]);

  const sliderValue = answerValue !== '' ? answerValue : '0';
  const cardTitle = q ? (isFlashcard ? (isRevealed ? 'Explanation' : 'Term') : q.text) : '';

  return (
    <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/60 pt-4">
      <div className="max-w-3xl mx-auto px-2 pb-4">
        {loading && <p className="text-sm text-muted-foreground mb-3">Preparing questionnaire...</p>}
        {!loading && !q && <p className="text-sm text-muted-foreground mb-3">No questions to answer right now.</p>}
        {!loading && q && (
          <Card className="bg-card/95 backdrop-blur">
            {isFlashcard ? (
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                  <span>Flashcard {currentIndex + 1} / {questions.length}</span>
                  <span>{title}</span>
                </div>
                
              </CardHeader>
            ) : (
              <CardHeader className="space-y-2 pb-4">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  Question {currentIndex + 1} of {questions.length}
                </CardDescription>
                <CardTitle className="text-base leading-relaxed">
                  {cardTitle}
                </CardTitle>
              </CardHeader>
            )}

            <CardContent className="space-y-4">
              {isFlashcard && (
                <button
                  type="button"
                  onClick={onFlashcardFlip}
                  className={cn(
                    'flashcard-container w-full rounded-lg border border-muted bg-background/80 p-0 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                  )}
                  aria-pressed={isRevealed}
                  aria-label={isRevealed ? 'Hide explanation' : 'Reveal explanation'}
                >
                  <div className={cn('flashcard-inner h-full min-h-[200px] rounded-lg', isRevealed && 'is-flipped')}>
                    <div className="flashcard-face front flex h-full flex-col justify-between gap-4 bg-card/95 p-5">
                      <div className="space-y-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Front
                        </span>
                        <p className="text-base leading-relaxed text-card-foreground">
                          {q.text}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Click to flip</p>
                    </div>
                    <div className="flashcard-face back flex h-full flex-col justify-between gap-4 bg-card/95 p-5">
                      <div className="space-y-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                          Back
                        </span>
                        <p className="whitespace-pre-line text-base leading-relaxed text-card-foreground">
                          {flashcardBack || 'No explanation provided.'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Click to flip</p>
                    </div>
                  </div>
                </button>
              )}
              {!isFlashcard && q.type === 'text' && (
                <Textarea
                  placeholder="Type your answer..."
                  value={answerValue}
                  onChange={e => onChange(e.target.value)}
                />
              )}
              {!isFlashcard && q.type === 'multichoice' && (
                <div className="flex flex-wrap gap-2">
                  {q.options!.map(opt => (
                    <Button
                      key={opt}
                      variant={answerValue === opt ? 'default' : 'outline'}
                      onClick={() => onChange(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
              {!isFlashcard && q.type === 'scale' && (
                <div className="flex items-center gap-3">
                  <Input
                    type="range"
                    min={0}
                    max={q.scaleMax}
                    value={sliderValue}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1"
                  />
                  <div className="text-sm font-medium w-16 text-center">
                    {sliderValue} / {q.scaleMax}
                  </div>
                </div>
              )}
            </CardContent>

            {isFlashcard ? (
              <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-0">
                <div className="text-xs text-muted-foreground">
                  {completed
                    ? 'All cards reviewed. Start over to reinforce the deck.'
                    : isRevealed
                      ? ''
                      : ''}
                </div>
                <div className="flex items-center gap-2">
                  {completed ? (
                    <Button size="sm" variant="outline" onClick={onClear} disabled={clearing}>
                      {clearing ? 'Resetting…' : 'Start over'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!isRevealed) {
                          onFlashcardFlip(true);
                          return;
                        }
                        next();
                      }}
                      disabled={(currentIndex >= questions.length - 1 && isRevealed) || clearing}
                    >
                      {isRevealed ? (currentIndex >= questions.length - 1 ? 'Reviewed' : 'Next card') : 'Reveal first'}
                    </Button>
                  )}
                </div>
              </CardFooter>
            ) : (
              <CardFooter className="flex items-center justify-between gap-2 pt-0">
                <Button variant="outline" disabled={currentIndex === 0 || clearing} onClick={prev}>
                  Back
                </Button>
                <Button variant="secondary" onClick={onClear} disabled={clearing || loading}>
                  {clearing ? 'Clearing...' : 'Clear'}
                </Button>
                {currentIndex < questions.length - 1 && (
                  <Button onClick={next} disabled={!hasAnswer || clearing}>
                    Next
                  </Button>
                )}
                {currentIndex === questions.length - 1 && (
                  <Button onClick={submit} disabled={!completed || clearing}>
                    {completed ? 'Submit' : 'Finish Answers'}
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          {questions.length > 0 ? `Progress • ${currentIndex + 1} / ${questions.length}` : 'Awaiting questions'}
          {` • ${title}`}
        </p>
      </div>
    </div>
  );
};

export default AnswerInput;
