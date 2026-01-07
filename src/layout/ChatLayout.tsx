import React from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import type { MenuView } from '@/components/nav-menus';
import AnswerInput from '../components/AnswerInput';
import { useQuestionnaire } from '../context/QuestionnaireContext';
import {
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  UploadPage,
  ResponsesPage,
  SettingsPage,
  HelpPage,
  QuestionnairePage,
  QuestionnairesListPage,
} from '@/pages';
import { fetchConfig } from '@/services/api';

type AnswerState = 'pending' | 'correct' | 'incorrect';

const ChatLayout: React.FC = () => {
  const {
    questions,
    loading,
    error,
    currentIndex,
    title,
    description,
    questionnaires,
    questionnaireId,
    setQuestionnaireId,
    answers,
    submitted,
    resetAnswers,
    questionnaireType,
    refreshQuestionnaires,
  } = useQuestionnaire();

  const [retaking, setRetaking] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<MenuView>('questionnaire');
  const [openaiModel, setOpenaiModel] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchConfig().then((config) => {
      if (config?.openaiModel) {
        setOpenaiModel(config.openaiModel);
      }
    });
  }, []);

  const answeredStates: AnswerState[] = questions.map((question) => {
    const record = answers[question.id];
    if (questionnaireType === 'flashcard') {
      return record?.revealed ? 'correct' : 'pending';
    }
    const value = (record?.value ?? '').trim();
    if (!value) {
      return 'pending' as const;
    }
    if (record?.correct === 'yes') {
      return 'correct' as const;
    }
    if (record?.correct === 'no') {
      return 'incorrect' as const;
    }
    return 'pending' as const;
  });

  const correctCount = answeredStates.filter((state) => state === 'correct').length;
  const incorrectCount = answeredStates.filter((state) => state === 'incorrect').length;
  const totalQuestions = questions.length;
  const scorePercent = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;
  const isFlashcard = questionnaireType === 'flashcard';
  const showSummary = submitted && !loading;

  const handleRetake = async () => {
    if (retaking) return;
    setRetaking(true);
    try {
      await resetAnswers();
    } finally {
      setRetaking(false);
    }
  };

  const handleUploadSuccess = async () => {
    if (refreshQuestionnaires) {
      await refreshQuestionnaires();
    }
  };

  const handleQuestionnaireSelect = (id: string) => {
    setQuestionnaireId(id);
    setCurrentView('questionnaire');
  };

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'upload':
        return 'Upload Topic';
      case 'responses':
        return 'Responses';
      case 'questionnaires-list':
        return 'Questionnaires';
      case 'settings':
        return 'Settings';
      case 'help':
        return 'Help & Support';
      default:
        return title;
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return <UploadPage onSuccess={handleUploadSuccess} />;
      case 'responses':
        return <ResponsesPage />;
      case 'questionnaires-list':
        return <QuestionnairesListPage />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <HelpPage />;
      default:
        return (
          <QuestionnairePage
            title={title}
            description={description}
            questions={questions}
            currentIndex={currentIndex}
            loading={loading}
            error={error}
            answeredStates={answeredStates}
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            totalQuestions={totalQuestions}
            scorePercent={scorePercent}
            isFlashcard={isFlashcard}
            showSummary={showSummary}
            retaking={retaking}
            onRetake={handleRetake}
          />
        );
    }
  };

  return (
    <>
      <AppSidebar
        questionnaires={questionnaires}
        activeQuestionnaireId={questionnaireId}
        onQuestionnaireSelect={handleQuestionnaireSelect}
        activeView={currentView}
        onViewChange={setCurrentView}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <span className="text-muted-foreground">Student Forms</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{getBreadcrumbTitle()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {openaiModel && (
              <Badge variant="secondary" className="text-xs">
                Model: {openaiModel}
              </Badge>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6">
            {renderContent()}
          </div>
          {currentView === 'questionnaire' && !showSummary && <AnswerInput />}
        </main>
      </SidebarInset>
    </>
  );
};

export default ChatLayout;
