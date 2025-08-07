
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { readFileAsDataURI } from '@/lib/file-helpers';
import type { GenerateAnswerOutput } from '@/ai/flows/generate-answer';
import { generateAnswer } from '@/ai/flows/generate-answer';
import { suggestQueries } from '@/ai/flows/suggest-queries';
import UploadSection from '@/components/suvitta/upload-section';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, LoaderCircle, Mic, MicOff, File as FileIcon } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const SuggestedQueries = dynamic(() => import('@/components/suvitta/suggested-queries'));
const ResultCard = dynamic(() => import('@/components/suvitta/result-card'));


// SpeechRecognition might not be available on the window object, so we declare it
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
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

        // Generate suggestions based on a generic context since we haven't parsed the file yet
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
