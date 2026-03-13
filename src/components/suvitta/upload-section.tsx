'use client';
import React from 'react';

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="max-w-3xl z-10">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="text-foreground">Decode Your </span>
          <span className="text-gradient">Financial Future</span>
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Upload any policy or document. Get instant, AI-powered answers backed by legal clauses.
        </p>
      </div>

      <div
        className="mt-12 w-full max-w-xl cursor-pointer glass rounded-2xl p-1 w-full"
      >
        <div 
           className="border-2 border-dashed border-primary/20 bg-card/50 rounded-2xl p-12 transition-all duration-300 hover:border-primary/50 hover:bg-card/80 group"
           onClick={() => document.getElementById('file-upload')?.click()}
        >
            <input type="file" id="file-upload" className="hidden" onChange={handleFileSelect} accept="application/pdf,image/png,image/jpeg,.docx,.doc" />
            <div className="flex flex-col items-center justify-center space-y-6">
              {isParsing ? (
                <>
                  <div className="relative">
                    <LoaderCircle className="h-20 w-20 animate-spin text-primary" />
                    <UploadCloud className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-foreground">
                      Analyzing Document...
                    </p>
                    <p className="text-muted-foreground animate-pulse">
                      Exacting text and identifying key clauses
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="h-16 w-16 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-semibold text-foreground">
                      Drop your document here
                    </p>
                    <p className="text-muted-foreground">
                        PDF, DOCX, or Images (Max 10MB)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 w-full justify-center">
                    <div className="h-px bg-border flex-1 max-w-[60px]" />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">or</span>
                    <div className="h-px bg-border flex-1 max-w-[60px]" />
                  </div>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/20"
                  >
                    Browse Files
                  </Button>
                </>
              )}
            </div>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground grayscale opacity-60">
        <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-green-500 rounded-full" />
            <span>Secure End-to-End</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-blue-500 rounded-full" />
            <span>No Data Storage</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-purple-500 rounded-full" />
            <span>Clause Verified</span>
        </div>
      </div>
    </div>
  );
}
