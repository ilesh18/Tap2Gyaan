import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function InterviewPrep() {
  return (
    <div className="page-enter max-w-3xl mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-black text-white mb-2">Interview Prep</h1>
      <p className="text-slate-400 text-sm mb-8 text-center">Practice with our AI-powered interview buddy</p>

      <a
        href="https://interview-buddy-v2.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-brand-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-accent-hover transition-all flex items-center gap-3 text-lg"
      >
        Start Interview Prep
        <ExternalLink size={20} />
      </a>
    </div>
  );
}
