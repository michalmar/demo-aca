import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Question } from '../data/questionnaire';

interface Props { question: Question; answered: boolean; }

const QuestionBubble: React.FC<Props> = ({ question, answered }) => {
  return (
    <Card className={cn('mb-3 max-w-xl border-muted bg-card text-card-foreground transition-opacity', answered && 'opacity-70')}>
      <CardContent className="px-4 py-3">
        <p className="text-sm leading-relaxed">{question.text}</p>
      </CardContent>
    </Card>
  );
};

export default QuestionBubble;
