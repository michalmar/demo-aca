import React from 'react';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

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
    <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-surface/60 pt-4">
      <div className="max-w-3xl mx-auto px-2 pb-4">
        {loading && <p className="text-sm text-gray-400 mb-3">Preparing questionnaire...</p>}
        {!loading && !q && <p className="text-sm text-gray-400 mb-3">No questions to answer right now.</p>}
        {!loading && q && (
          <Card className="space-y-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Question {currentIndex + 1} of {questions.length}
              </div>
              <p className="text-base leading-relaxed mt-1">{q.text}</p>
            </div>
            {q.type === 'text' && (
              <TextArea
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
                    variant={answers[q.id] === opt ? 'primary' : 'ghost'}
                    onClick={() => onChange(opt)}
                    className={answers[q.id] === opt ? '' : 'border border-surface'}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            )}
            {q.type === 'scale' && (
              <div className="flex items-center gap-2">
                <Input
                  type="range"
                  min={0}
                  max={q.scaleMax}
                  value={answers[q.id] || '0'}
                  onChange={e => onChange(e.target.value)}
                  className="flex-1"
                />
                <div className="text-sm w-12 text-center">{answers[q.id] || '0'} / {q.scaleMax}</div>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" disabled={currentIndex === 0} onClick={prev}>Back</Button>
              {currentIndex < questions.length - 1 && (
                <Button onClick={next} disabled={!answers[q.id]}>Next</Button>
              )}
              {currentIndex === questions.length - 1 && (
                <Button onClick={submit} disabled={!completed}>{completed ? 'Submit' : 'Finish Answers'}</Button>
              )}
            </div>
          </Card>
        )}
        <p className="text-xs text-gray-400 mt-3">
          {questions.length > 0 ? `Progress • ${currentIndex + 1} / ${questions.length}` : 'Awaiting questions'}
          {` • ${title}`}
        </p>
      </div>
    </div>
  );
};

export default AnswerInput;
