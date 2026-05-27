import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import PwaInstallPrompt from '@/components/layout/PwaInstallPrompt';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import ScrollReveal from '@/components/layout/ScrollReveal';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });


export const metadata: Metadata = {
  title: {
    default: 'Synap — AI Study Assistant',
    template: '%s | Synap',
  },
  description:
    'Upload lecture audio or PDFs and get instant AI-generated study notes, flashcards, quizzes, and an AI tutor — for free.',
  keywords: ['AI study assistant', 'lecture notes', 'flashcards', 'quiz generator', 'transcription'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Synap',
    description: 'Your AI-powered study companion',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5143493824024577"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#cdd6f4',
              border: '1px solid #313244',
            },
            success: { iconTheme: { primary: '#a6e3a1', secondary: '#1e1e2e' } },
            error: { iconTheme: { primary: '#f38ba8', secondary: '#1e1e2e' } },
          }}
        />
        <PwaInstallPrompt />
        <ScrollReveal />
      </body>
    </html>
  );
}


