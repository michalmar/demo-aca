import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QuestionnaireProvider } from './context/QuestionnaireContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import ChatLayout from './layout/ChatLayout';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <QuestionnaireProvider>
        <SidebarProvider>
          <ChatLayout />
        </SidebarProvider>
      </QuestionnaireProvider>
    </ThemeProvider>
  );
};

export default App;
