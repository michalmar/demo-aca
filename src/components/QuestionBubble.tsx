import React from 'react';
import { Question } from '../data/questionnaire';

interface Props { question: Question; answered: boolean; }

const QuestionBubble: React.FC<Props> = ({ question, answered }) => {
  return (
    <div className={answered ? 'opacity-70' : ''}>
      <div className="max-w-xl rounded-2xl bg-surface px-4 py-3 mb-3 border border-surface/70">
        <p className="text-sm leading-relaxed">{question.text}</p>
      </div>
    </div>
  );
};

export default QuestionBubble;
