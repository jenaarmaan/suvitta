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

interface ResultCardProps {
  answer: GenerateAnswerOutput;
}

type TranslatedContent = {
  summary: string;
  explanation: string;
  clauseQuote: string;
};

export default function ResultCard({ answer }: ResultCardProps) {
  const [isTranslating, startTranslation] = useTransition();
  const [translatedContent, setTranslatedContent] =
    useState<TranslatedContent | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const isCovered = answer.decision.toLowerCase().includes('covered');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
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
        console.error('Translation failed', e);
      }
    });
  };

  const content = {
    summary: translatedContent?.summary || answer.summary,
    explanation: translatedContent?.explanation || answer.explanation,
    clauseQuote: translatedContent?.clauseQuote || answer.clauseQuote,
  };

  return (
    <Card className="glass border-none shadow-2xl rounded-3xl overflow-hidden" role="region" aria-label="Analysis Result">
      <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                <div className={`h-2 w-2 rounded-full ${isCovered ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Decision Core</span>
            </div>
            <CardTitle
              className={`font-headline text-5xl md:text-6xl flex items-center gap-4 ${
                isCovered ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isCovered ? <CheckCircle className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
              {answer.decision}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-primary/5">
            <Languages className="h-5 w-5 text-primary ml-2" />
             <Select onValueChange={handleLanguageChange} defaultValue="en">
              <SelectTrigger disabled={isTranslating} className="w-40 bg-transparent border-none focus:ring-0 text-md font-medium">
                 {isTranslating ? <LoaderCircle className="animate-spin" /> : <SelectValue placeholder="Language" />}
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
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
      <CardContent className="p-8 space-y-8">
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Executive Summary</h3>
          <p className="text-xl md:text-2xl text-foreground font-medium leading-relaxed">{content.summary}</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="explanation" className="border border-primary/5 rounded-2xl px-6 bg-white/30 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-left">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MessageSquareQuote className="h-6 w-6 text-blue-600"/>
                    </div>
                    <div>
                        <span className="text-lg font-bold block leading-none">Why this decision?</span>
                        <span className="text-sm text-muted-foreground font-normal">Detailed process reasoning</span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="text-lg text-muted-foreground leading-relaxed pb-6">
              <p className="border-t border-primary/5 pt-6">{content.explanation}</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="clause" className="border border-primary/5 rounded-2xl px-6 bg-white/30 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-left">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <FileText className="h-6 w-6 text-purple-600"/>
                    </div>
                    <div>
                        <span className="text-lg font-bold block leading-none">Source Clause</span>
                        <span className="text-sm text-muted-foreground font-normal">Extracted straight from document</span>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6">
              <div className="relative group border-t border-primary/5 pt-6">
                <blockquote className="border-l-4 border-primary/30 pl-6 italic text-xl text-muted-foreground bg-primary/5 py-8 rounded-r-2xl pr-8">
                    "{content.clauseQuote}"
                </blockquote>
                <div className="mt-6 flex justify-end">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="rounded-xl px-6 py-4 font-semibold hover:bg-primary hover:text-white transition-all gap-2"
                        onClick={() => copyToClipboard(content.clauseQuote)}
                    >
                        {copySuccess ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        {copySuccess ? 'Text Copied' : 'Copy Source Clause'}
                    </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {answer.amount && (
            <div className="mt-8 border-t border-primary/10 pt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-full">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-2xl text-foreground">Identified Value</h4>
                        <p className="text-muted-foreground">Detected from context</p>
                    </div>
                </div>
                <div className="text-4xl font-headline font-black text-green-600">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(answer.amount)}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
