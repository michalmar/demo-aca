import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const SettingsPage: React.FC = () => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-foreground">Settings</h2>
      <p className="text-sm text-muted-foreground">
        Configure your preferences
      </p>
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Settings coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
