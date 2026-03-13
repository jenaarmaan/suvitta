'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { readFileAsDataURI } from '@/lib/file-helpers';
import type { GenerateAnswerOutput } from '@/ai/flows/generate-answer';
import { generateAnswer } from '@/ai/flows/generate-answer';
import { suggestQueries } from '@/ai/flows/suggest-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, LoaderCircle, Mic, MicOff, File as FileIcon, MessageSquareQuote } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const UploadSection = dynamic(() => import('@/components/suvitta/upload-section'));
const SuggestedQueries = dynamic(() => import('@/components/suvitta/suggested-queries'));
const ResultCard = dynamic(() => import('@/components/suvitta/result-card'));


declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Home() {
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
        setError(`Speech recognition error: ${event.error}. Please try again.`);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);
  
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
        setError('Your browser does not support voice recognition.');
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
            setError('Please enable microphone permissions in your browser settings.');
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
        setError(null);
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
        setError(`Error processing file: ${error}`);
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
    <div className="container mx-auto px-4 py-12 max-w-7xl relative">
       <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-headline font-bold tracking-tight">SUVITTA AI</span>
        </div>
        <Button variant="ghost" onClick={resetState} className="rounded-full px-6 border border-primary/20 hover:bg-primary/5 transition-colors">
            Analyze New Document
        </Button>
      </div>

       {file && (
        <div className="mb-8 p-4 glass rounded-2xl flex items-center justify-between border-primary/10">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <FileIcon className="h-6 w-6 text-primary"/>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground leading-none mb-1">Active Intelligence</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-md">{file.name}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Document Ready</span>
            </div>
        </div>
       )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4 space-y-8 h-full">
          <Card className="glass border-none shadow-2xl overflow-hidden rounded-3xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/20 rounded-lg">
                    <MessageSquareQuote className="h-5 w-5 text-accent" />
                </div>
                <h2 className="font-headline text-2xl font-bold text-foreground">
                  Quick Query
                </h2>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Ask specific questions about coverage, limits, or terms within this document.
              </p>
              <form onSubmit={handleQuerySubmit} className="space-y-6">
                <div className="relative group">
                  <Textarea
                    placeholder="e.g., What is the annual limit for Plan A?"
                    className="min-h-[160px] text-lg bg-background/50 border-primary/10 focus:border-primary/30 rounded-2xl p-4 transition-all"
                    value={currentQuery}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentQuery(e.target.value)}
                    aria-label="Your question"
                  />
                  <div className="absolute right-4 bottom-4 flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`rounded-full transition-all ${isListening ? 'bg-red-500/10 text-red-500 scale-110' : 'text-primary'}`}
                        onClick={handleVoiceInput}
                        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                        {isListening ? (
                        <MicOff className="h-5 w-5" />
                        ) : (
                        <Mic className="h-5 w-5" />
                        )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                  disabled={isGenerating || !currentQuery.trim()}
                  aria-label="Generate Analysis"
                >
                  {isGenerating ? (
                    <LoaderCircle className="animate-spin mr-2" />
                  ) : (
                    <Send className="mr-2 h-5 w-5" />
                  )}
                  {isGenerating ? 'Analyzing...' : 'Generate Analysis'}
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

        <div className="lg:col-span-8 space-y-8">
          {isGenerating && (
            <Card className="glass border-none shadow-2xl rounded-3xl overflow-hidden min-h-[500px] flex items-center justify-center">
              <CardContent className="p-12 text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <Sparkles className="h-24 w-24 text-primary relative z-10 animate-float mx-auto" />
                </div>
                <h3 className="text-3xl font-headline font-bold text-foreground mb-4">
                  Suvitta AI Thinking
                </h3>
                <div className="flex flex-col items-center gap-3">
                    <p className="text-xl text-muted-foreground max-w-md">
                        Searching through document clauses for precisely the information you need.
                    </p>
                    <div className="flex gap-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                    </div>
                </div>
              </CardContent>
            </Card>
          )}

          {answer && <ResultCard answer={answer} />}

          {error && (
            <Card className="border-destructive/30 bg-destructive/5 rounded-3xl overflow-hidden">
              <CardContent className="p-8 flex items-start gap-4">
                <div className="p-3 bg-destructive/10 rounded-xl mt-1">
                    <MicOff className="h-6 w-6 text-destructive" />
                </div>
                <div>
                    <h3 className="font-headline text-xl font-bold text-destructive mb-2">
                    Analysis Interrupted
                    </h3>
                    <p className="text-destructive/80 leading-relaxed">{error}</p>
                    <Button variant="outline" className="mt-4 border-destructive/20 hover:bg-destructive/10 text-destructive" onClick={() => setError(null)}>Acknowledge</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isGenerating && !answer && !error && (
             <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <Card className="relative glass border-none shadow-2xl rounded-[32px] overflow-hidden">
                    <CardContent className="p-0">
                        <div className="relative h-[600px] w-full">
                            <Image 
                                src="/hero_ui_illustration_1773253838313.png"
                                alt="Financial document analysis illustration"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
                            <div className="absolute bottom-12 left-12 right-12">
                                <h4 className="text-4xl font-headline font-bold text-foreground mb-4">Ready to Assist</h4>
                                <p className="text-xl text-muted-foreground max-w-xl">
                                    Your document is indexed. Type a question on the left or select a suggested query to begin the analysis.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
             </div>
          )}
        </div>
      </div>
    </div>
     <div className="md:hidden sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 z-10">
        <Button className="w-full" size="lg" onClick={() => document.querySelector('textarea')?.focus()} aria-label="Ask a question using voice">
          <Mic className="mr-2" /> Ask a Question
        </Button>
      </div>
    </>
  );
}
