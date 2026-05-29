import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import PwaInstallPrompt from '@/components/layout/PwaInstallPrompt';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import ScrollReveal from '@/components/layout/ScrollReveal';
import { Analytics } from '@vercel/analytics/react';
import DeepLinkProvider from '@/components/providers/DeepLinkProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });


export const metadata: Metadata = {
  metadataBase: new URL('https://www.synap.bond'),
  title: {
    default: 'Synap — AI Study Assistant',
    template: '%s | Synap',
  },
  description:
    'Upload lecture audio or PDFs and get instant AI-generated study notes, flashcards, quizzes, and an AI tutor — for free.',
  keywords: ['AI study assistant', 'lecture notes', 'flashcards', 'quiz generator', 'transcription', 'active recall', 'AI study notes', 'AI flashcard generator', 'AI quiz generator', 'lecture notes AI', 'PDF to flashcards', 'YouTube to notes'],
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  openGraph: {
    title: 'Synap — AI Study Assistant',
    description: 'Your AI-powered study companion',
    type: 'website',
    url: 'https://www.synap.bond',
    siteName: 'Synap',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Synap',
    'alternateName': ['Synap AI', 'Synap Study Assistant'],
    'url': 'https://www.synap.bond',
    'description': 'Upload lecture audio or PDFs and get instant AI-generated study notes, flashcards, quizzes, and an AI tutor.',
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Synap',
    'applicationCategory': 'EducationalApplication',
    'operatingSystem': 'All',
    'url': 'https://www.synap.bond',
    'description': 'AI-powered study assistant for generating notes, flashcards, and quizzes from course materials.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5143493824024577"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <DeepLinkProvider />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        <Analytics />
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


