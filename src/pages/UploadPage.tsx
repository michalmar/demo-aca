import React from 'react';
import UploadTopic from '@/components/UploadTopic';

interface UploadPageProps {
  onSuccess: () => Promise<void>;
}

const UploadPage: React.FC<UploadPageProps> = ({ onSuccess }) => {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-foreground">Upload New Topic</h2>
        <p className="text-sm text-muted-foreground">
          Add educational content to generate flashcards and quizzes
        </p>
      </div>
      <UploadTopic onSuccess={onSuccess} />
    </>
  );
};

export default UploadPage;
