'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';

interface SuggestedQueriesProps {
  queries: string[];
  onQueryClick: (query: string) => void;
  isLoading: boolean;
}

export default function SuggestedQueries({
  queries,
  onQueryClick,
  isLoading,
}: SuggestedQueriesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-primary">
            <Lightbulb /> Suggested Queries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (queries.length === 0) {
    return null;
  }

  return (
    <Card className="glass border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="flex items-center gap-3 font-headline text-2xl font-bold text-foreground">
          <div className="p-2 bg-yellow-400/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>
          Expert Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 flex flex-col space-y-3">
        {queries.map((query, index) => (
          <Button
            key={index}
            variant="ghost"
            className="text-left justify-start h-auto whitespace-normal p-4 rounded-2xl bg-white/40 hover:bg-primary/10 border border-primary/5 hover:border-primary/20 transition-all group"
            onClick={() => onQueryClick(query)}
          >
            <div className="flex gap-3 items-start">
                <span className="text-primary/40 font-bold group-hover:text-primary transition-colors">0{index + 1}</span>
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">{query}</span>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
