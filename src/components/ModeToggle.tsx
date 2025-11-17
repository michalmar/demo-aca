import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useTheme } from '@/components/ThemeProvider';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-2 py-1 text-xs">
      <Sun className="h-4 w-4 text-muted-foreground" aria-hidden />
      <Switch
        checked={isDark}
        onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle theme"
      />
      <Moon className="h-4 w-4 text-muted-foreground" aria-hidden />
    </div>
  );
}
