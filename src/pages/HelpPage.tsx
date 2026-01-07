import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const HelpPage: React.FC = () => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-foreground">Help & Support</h2>
      <p className="text-sm text-muted-foreground">
        Get help with using the app
      </p>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Need help? Contact support@example.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;
