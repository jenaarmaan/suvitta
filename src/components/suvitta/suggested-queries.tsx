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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-primary">
          <Lightbulb /> Suggested Queries
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col space-y-2">
        {queries.map((query, index) => (
          <Button
            key={index}
            variant="outline"
            className="text-left justify-start h-auto whitespace-normal"
            onClick={() => onQueryClick(query)}
          >
            {query}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
