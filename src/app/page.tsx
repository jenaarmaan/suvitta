'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURI } from '@/lib/file-helpers';
import type { GenerateAnswerOutput } from '@/ai/flows/generate-answer';
import { generateAnswer } from '@/ai/flows/generate-answer';
import { suggestQueries } from '@/ai/flows/suggest-queries';
import { translateAnswer } from '@/ai/flows/translate-answer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, LoaderCircle, Mic, MicOff, File as FileIcon, Lightbulb, CheckCircle, XCircle, Languages, MessageSquareQuote, FileText, Copy } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';


// Dynamically import heavy components
const UploadSection = dynamic(() => import('@/components/suvitta/upload-section'));

// SpeechRecognition might not be available on the window object, so we declare it
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Result Card Component (consolidated)
type TranslatedContent = {
  summary: string;
  explanation: string;
  clauseQuote: string;
};

function ResultCard({ answer }: { answer: GenerateAnswerOutput }) {
  const { toast } = useToast();
  const [isTranslating, startTranslation] = useTransition();
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);

  const isCovered = answer.decision.toLowerCase().includes('covered');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
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
            <CardTitle className={`font-headline text-3xl flex items-center gap-2 ${isCovered ? 'text-green-600' : 'text-red-600'}`}>
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
              <div className="flex items-center gap-2"><MessageSquareQuote className="h-5 w-5"/> Explanation</div>
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground prose prose-sm max-w-none">
              <p>{content.explanation}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="clause">
            <AccordionTrigger className="text-lg">
              <div className="flex items-center gap-2"><FileText className="h-5 w-5"/> Found in your document</div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground">{content.clauseQuote}</blockquote>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(content.clauseQuote)}>
                <Copy className="mr-2 h-4 w-4" /> Copy Clause
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Suggested Queries Component (consolidated)
function SuggestedQueries({ queries, onQueryClick, isLoading }: { queries: string[]; onQueryClick: (query: string) => void; isLoading: boolean; }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 font-headline text-primary"><Lightbulb /> Suggested Queries</CardTitle></CardHeader>
        <CardContent className="space-y-2">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</CardContent>
      </Card>
    );
  }
  if (queries.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 font-headline text-primary"><Lightbulb /> Suggested Queries</CardTitle></CardHeader>
      <CardContent className="flex flex-col space-y-2">
        {queries.map((query, index) => (
          <Button key={index} variant="outline" className="text-left justify-start h-auto whitespace-normal" onClick={() => onQueryClick(query)}>
            {query}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}


export default function Home() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [suggestedQueriesList, setSuggestedQueriesList] = useState<string[]>([]);
  const [answer, setAnswer] = useState<GenerateAnswerOutput | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isParsing, startParsingTransition] = useTransition();
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [isGenerating, startGenerationTransition] = useTransition();
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [isReadyForQuery, setIsReadyForQuery] = useState(false);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
            variant: 'destructive',
            title: 'Voice Input Error',
            description: `An error occurred: ${event.error}. Please try again.`
        });
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);
  
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
         toast({
            variant: 'destructive',
            title: 'Voice Input Not Supported',
            description: 'Your browser does not support voice recognition.'
        });
        return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          recognitionRef.current.start();
          setIsListening(true);
        })
        .catch(err => {
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please enable microphone permissions in your browser settings.'
            });
        });
    }
  };

  const handleFileChange = async (selectedFiles: File[] | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const selectedFile = selectedFiles[0];
    
    resetState();
    
    setFile(selectedFile);
    
    startParsingTransition(async () => {
      try {
        toast({
          title: 'File Ready',
          description: `"${selectedFile.name}" has been loaded. You can now ask questions.`,
        });

        const dummyTextForSuggestions = `This document outlines the terms and conditions for health insurance coverage. It includes details on covered procedures, such as knee surgery, and exclusions. Pre-existing conditions are covered after a waiting period of 24 months. Emergency hospitalization is covered from day one. For claims, policyholders must notify the company within 48 hours of admission.`;

        startSuggestionTransition(async () => {
            try {
                const suggestions = await suggestQueries({ documentContent: dummyTextForSuggestions });
                setSuggestedQueriesList(suggestions.suggestedQueries);
            } catch (e) {
                console.error('Failed to suggest queries:', e);
            }
        });
        
        setIsReadyForQuery(true);
      } catch (e) {
        const error = e instanceof Error ? e.message : 'An unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Error processing file',
          description: error,
        });
        resetState();
      }
    });
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || !file) return;
    setError(null);
    setAnswer(null);

    startGenerationTransition(async () => {
      try {
        const documentDataUri = await readFileAsDataURI(file);

        const result = await generateAnswer({
          documentDataUri,
          question: currentQuery,
        });
        setAnswer(result);
      } catch (e) {
        console.error("Analysis failed:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
        setError(
          `Failed to generate an answer. The AI model may be temporarily unavailable or the document could not be read. Please try again later. Details: ${errorMessage}`
        );
         toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: `Failed to get an answer. ${errorMessage}`,
        });
      }
    });
  };

  const handleSuggestedQueryClick = (query: string) => {
    setCurrentQuery(query);
  };
  
  const resetState = () => {
    setFile(null);
    setSuggestedQueriesList([]);
    setAnswer(null);
    setCurrentQuery('');
    setError(null);
    setIsReadyForQuery(false);
  };

  if (!isReadyForQuery) {
    return <UploadSection onFileChange={handleFileChange} isParsing={isParsing} />;
  }

  return (
    <>
    <div className="container mx-auto px-4 py-8 max-w-6xl">
       <div className="text-center mb-4">
        <Button variant="outline" onClick={resetState} aria-label="Upload a different document">Upload Another Document</Button>
      </div>
       {file && (
        <div className="mb-4">
            <h3 className="font-headline text-lg font-semibold text-primary mb-2">Uploaded File:</h3>
            <div className="flex items-center gap-2 bg-muted p-2 rounded-md max-w-md">
                <FileIcon className="h-4 w-4 text-muted-foreground"/>
                <span className="text-sm text-foreground truncate">{file.name}</span>
            </div>
        </div>
       )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-2xl font-semibold mb-4 text-primary">
                Ask a Question
              </h2>
              <p className="text-muted-foreground mb-4">
                Use the space below to ask about your uploaded document.
              </p>
              <form onSubmit={handleQuerySubmit} className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Type your question like: Is ACL surgery covered?"
                    className="min-h-[120px] text-base pr-12"
                    value={currentQuery}
                    onChange={(e) => setCurrentQuery(e.target.value)}
                    aria-label="Your question"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleVoiceInput}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <MicOff className="text-red-500" />
                    ) : (
                      <Mic className="text-primary" />
                    )}
                  </Button>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={isGenerating || !currentQuery.trim()}
                  aria-label="Get Answer"
                >
                  {isGenerating ? (
                    <LoaderCircle className="animate-spin mr-2" />
                  ) : (
                    <Send className="mr-2" />
                  )}
                  Get Answer
                </Button>
              </form>
            </CardContent>
          </Card>
          <SuggestedQueries
            queries={suggestedQueriesList}
            onQueryClick={handleSuggestedQueryClick}
            isLoading={isSuggesting}
          />
        </div>
        <div className="space-y-6">
          {isGenerating && (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                <Sparkles className="h-16 w-16 text-accent animate-pulse" />
                <p className="mt-4 text-lg font-headline text-muted-foreground">
                  Suvitta AI is analyzing your document...
                </p>
                <p className="text-muted-foreground">This may take a moment.</p>
              </CardContent>
            </Card>
          )}
          {answer && <ResultCard answer={answer} />}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-6">
                <h3 className="font-headline text-lg text-destructive">
                  An Error Occurred
                </h3>
                <p className="text-destructive/80">{error}</p>
              </CardContent>
            </Card>
          )}
          {!isGenerating && !answer && !error && (
             <Card className="bg-transparent border-none shadow-none">
              <CardContent className="p-0">
                 <Image 
                    src="https://placehold.co/600x400.png"
                    alt="Financial document analysis illustration"
                    data-ai-hint="data analysis abstract"
                    width={600}
                    height={400}
                    className="rounded-lg object-cover"
                    priority
                    />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
     <div className="md:hidden sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 z-10">
        <Button className="w-full" size="lg" onClick={() => document.querySelector('textarea')?.focus()}>
          <Mic className="mr-2" /> Ask a Question
        </Button>
      </div>
    </>
  );
}
