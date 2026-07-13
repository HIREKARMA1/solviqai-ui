'use client';

import { Lock, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  title: string;
  description?: string;
  onGoToCounselor?: () => void;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
};

export default function CareerModuleLocked({
  title,
  description = 'Complete your counseling session first to unlock this module.',
  onGoToCounselor,
  showUpgrade = false,
  onUpgrade,
}: Props) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center p-6">
      <Card className="w-full max-w-md border-dashed border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-blue-50/40 dark:from-gray-900 dark:to-blue-950/20">
        <CardContent className="flex flex-col items-center text-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-200/80 dark:bg-gray-800">
            <Lock className="h-7 w-7 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {onGoToCounselor && (
              <Button className="gap-2" onClick={onGoToCounselor}>
                <MessageCircle className="h-4 w-4" />
                Go to Counselor
              </Button>
            )}
            {showUpgrade && onUpgrade && (
              <Button variant="outline" className="gap-2 border-[#f58020] text-[#f58020]" onClick={onUpgrade}>
                <Sparkles className="h-4 w-4" />
                Upgrade Required
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
