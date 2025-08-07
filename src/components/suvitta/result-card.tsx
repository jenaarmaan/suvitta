'use client';

import { useState, useTransition } from 'react';
import type { GenerateAnswerOutput } from '@/ai/flows/generate-answer';
import { translateAnswer } from '@/ai/flows/translate-answer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Copy, LoaderCircle, Languages, FileText, MessageSquareQuote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResultCardProps {
  answer: GenerateAnswerOutput;
}

type TranslatedContent = {
  summary: string;
  explanation: string;
  clauseQuote: string;
};

export default function ResultCard({ answer }: ResultCardProps) {
  const { toast } = useToast();
  const [isTranslating, startTranslation] = useTransition();
  const [translatedContent, setTranslatedContent] =
    useState<TranslatedContent | null>(null);

  const isCovered = answer.decision.toLowerCase().includes('covered');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
    });
  };

  const handleLanguageChange = async (lang: string) => {
    if (lang === 'en') {
      setTranslatedContent(null);
      return;
    }
    startTranslation(async () => {
      try {
        const [summary, explanation, clauseQuote] = await Promise.all([
          translateAnswer({ text: answer.summary, targetLanguage: lang }),
          translateAnswer({ text: answer.explanation, targetLanguage: lang }),
          translateAnswer({ text: answer.clauseQuote, targetLanguage: lang }),
        ]);
        setTranslatedContent({
          summary: summary.translatedText,
          explanation: explanation.translatedText,
          clauseQuote: clauseQuote.translatedText,
        });
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Translation Failed',
          description: 'Could not translate the content.',
        });
      }
    });
  };

  const content = {
    summary: translatedContent?.summary || answer.summary,
    explanation: translatedContent?.explanation || answer.explanation,
    clauseQuote: translatedContent?.clauseQuote || answer.clauseQuote,
  };

  return (
    <Card className="shadow-2xl shadow-primary/10" role="region" aria-label="Analysis Result">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardDescription>AI Decision</CardDescription>
            <CardTitle
              className={`font-headline text-3xl flex items-center gap-2 ${
                isCovered ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isCovered ? <CheckCircle /> : <XCircle />}
              {answer.decision}
            </CardTitle>
          </div>
          <div className="w-36">
             <Select onValueChange={handleLanguageChange} defaultValue="en">
              <SelectTrigger disabled={isTranslating} aria-label="Select language for translation">
                 {isTranslating ? <LoaderCircle className="animate-spin mr-2" /> : <Languages className="mr-2 h-4 w-4" />}
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Quick Summary</h3>
          <p className="text-muted-foreground">{content.summary}</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="explanation">
            <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                    <MessageSquareQuote className="h-5 w-5"/> Explanation
                </div>
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground prose prose-sm max-w-none">
              <p>{content.explanation}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="clause">
            <AccordionTrigger className="text-lg">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5"/> Found in your document
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground">
                {content.clauseQuote}
              </blockquote>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(content.clauseQuote)}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy Clause
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
