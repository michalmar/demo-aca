import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useQuestionnaire } from '../context/QuestionnaireContext';

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
    title
  } = useQuestionnaire();
  const q = questions[currentIndex];

  const onChange = (val: string) => {
    if (!q) return;
    setAnswer(q.id, val);
  };

  return (
    <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border/60 pt-4">
      <div className="max-w-3xl mx-auto px-2 pb-4">
        {loading && <p className="text-sm text-muted-foreground mb-3">Preparing questionnaire...</p>}
        {!loading && !q && <p className="text-sm text-muted-foreground mb-3">No questions to answer right now.</p>}
        {!loading && q && (
          <Card className="bg-card/95 backdrop-blur">
            <CardHeader className="space-y-2 pb-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wide">
                Question {currentIndex + 1} of {questions.length}
              </CardDescription>
              <CardTitle className="text-base leading-relaxed">
                {q.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {q.type === 'text' && (
                <Textarea
                  placeholder="Type your answer..."
                  value={answers[q.id] || ''}
                  onChange={e => onChange(e.target.value)}
                />
              )}
              {q.type === 'multichoice' && (
                <div className="flex flex-wrap gap-2">
                  {q.options!.map(opt => (
                    <Button
                      key={opt}
                      variant={answers[q.id] === opt ? 'default' : 'outline'}
                      onClick={() => onChange(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
              {q.type === 'scale' && (
                <div className="flex items-center gap-3">
                  <Input
                    type="range"
                    min={0}
                    max={q.scaleMax}
                    value={answers[q.id] || '0'}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1"
                  />
                  <div className="text-sm font-medium w-16 text-center">
                    {answers[q.id] || '0'} / {q.scaleMax}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-2 pt-0">
              <Button variant="outline" disabled={currentIndex === 0} onClick={prev}>
                Back
              </Button>
              {currentIndex < questions.length - 1 && (
                <Button onClick={next} disabled={!answers[q.id]}>
                  Next
                </Button>
              )}
              {currentIndex === questions.length - 1 && (
                <Button onClick={submit} disabled={!completed}>
                  {completed ? 'Submit' : 'Finish Answers'}
                </Button>
              )}
            </CardFooter>
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
