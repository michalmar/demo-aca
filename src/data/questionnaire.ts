export interface Question {
  id: string;
  text: string;
  type: 'text' | 'multichoice' | 'scale';
  options?: string[];
  scaleMax?: number;
}

export const questionnaire = {
  id: 'getting-to-know-you',
  title: 'Getting to Know You',
  description: 'Answer the following to personalize your learning path.',
  questions: [
    { id: 'nickname', text: 'What nickname do you like to use?', type: 'text' },
    { id: 'favSubject', text: 'Which subject do you enjoy most?', type: 'multichoice', options: ['Math', 'Science', 'History', 'Art', 'Sports'] },
    { id: 'confidence', text: 'How confident do you feel about school this year?', type: 'scale', scaleMax: 10 },
    { id: 'hobby', text: 'What hobby makes you lose track of time?', type: 'text' },
    { id: 'studyStyle', text: 'Pick a study style you prefer.', type: 'multichoice', options: ['Quiet reading', 'Group discussion', 'Hands-on projects', 'Watching videos'] },
  ] as Question[],
};
