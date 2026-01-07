import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ResponsesPage: React.FC = () => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-foreground">Responses</h2>
      <p className="text-sm text-muted-foreground">
        View and manage your questionnaire responses
      </p>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No responses yet.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsesPage;
