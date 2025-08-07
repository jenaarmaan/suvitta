'use client';

import { useState } from 'react';
import { UploadCloud, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadSectionProps {
  onFileChange: (file: File[] | null) => void;
  isParsing: boolean;
}

export default function UploadSection({ onFileChange, isParsing }: UploadSectionProps) {

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFileChange(Array.from(event.target.files));
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4">
      <div className="max-w-2xl">
        <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary tracking-tight">
          Understand Your Financial Documents Instantly
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          Upload any policy, ask anything in plain English. FinSolve AI provides instant, clause-backed answers you can trust.
        </p>
      </div>
      <div
        className={`mt-10 w-full max-w-lg cursor-pointer rounded-xl border-2 border-dashed border-primary/20 bg-card p-8 text-center transition-colors duration-300`}
      >
        <input type="file" id="file-upload" className="hidden" onChange={handleFileSelect} accept="application/pdf,image/png,image/jpeg,.docx" />
        <div className="flex flex-col items-center justify-center space-y-4">
          {isParsing ? (
            <>
              <LoaderCircle className="h-16 w-16 animate-spin text-accent" />
              <p className="text-lg font-medium text-muted-foreground">
                Analyzing your document...
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="h-16 w-16 text-accent" />
              <p className="text-lg font-medium text-foreground">
                Drag & drop your document here
              </p>
              <p className="text-muted-foreground">or</p>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90"
                onClick={() => document.getElementById('file-upload')?.click()}
                aria-label="Upload a document by browsing files"
              >
                Browse Files
              </Button>
            </>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Your documents are secure and never stored after analysis.
      </p>
    </div>
  );
}
