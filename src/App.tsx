import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QuestionnaireProvider } from './context/QuestionnaireContext';
import ChatLayout from './layout/ChatLayout';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <QuestionnaireProvider>
        <ChatLayout />
      </QuestionnaireProvider>
    </ThemeProvider>
  );
};

export default App;
