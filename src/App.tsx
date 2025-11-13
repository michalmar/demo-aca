import React from 'react';
import { QuestionnaireProvider } from './context/QuestionnaireContext';
import ChatLayout from './layout/ChatLayout';

const App: React.FC = () => {
  return (
    <QuestionnaireProvider>
      <ChatLayout />
    </QuestionnaireProvider>
  );
};

export default App;
