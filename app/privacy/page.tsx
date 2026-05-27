'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16 px-4 relative flex items-center justify-center">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(255 85% 68%), transparent)' }} />
      </div>

      <div className="w-full max-w-3xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-white"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}>
              ⚡
            </div>
            <span className="font-bold text-lg gradient-text">Synap™</span>
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-1">Last Updated: May 26, 2026</p>
        </div>

        {/* Content Card */}
        <div className="glass rounded-2xl p-8 md:p-10 border border-border space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Synap (accessible at <strong>https://www.synap.bond</strong>). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
            </p>
            <p>
              When you visit our website, and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy policy, we seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when registering on the website, expressing an interest in obtaining information about us or our products, or otherwise contacting us.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> We collect your email address, password, and public profile data (e.g., full name, avatar) if you log in via Google OAuth or standard registration.</li>
              <li><strong>Academic Uploads:</strong> We collect PDF documents, audio recordings, and YouTube URLs you upload to create transcriptions and generated study notes.</li>
              <li><strong>Browser API Keys:</strong> If you choose to enter your own custom Groq API Key to bypass free tier limits, this key is stored strictly on your local browser (<code>localStorage</code>) and is never sent to, read, or stored on our servers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use personal information collected via our website for a variety of business purposes described below:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To facilitate account creation and logon process.</li>
              <li>To generate highly detailed study notes, quizzes, and flashcards utilizing our connected large language models.</li>
              <li>To maintain and improve the security, performance, and stability of the application.</li>
              <li>To deliver advertising banners via our premium ad-network partners (e.g. Google AdSense / Carbon Ads) to cover infrastructure and API costs.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Share of Information</h2>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Your transcript data is securely sent to LLM processors (such as Groq SDK / API) solely to compile study notes, and is never sold or used for training models.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Cookies and Tracking</h2>
            <p>
              We may use cookies and similar tracking technologies to access or store information (like session states). Our advertising partners (Google AdSense) may use cookies to serve personalized ads based on your visits to this and other websites. You can choose to disable cookies in your browser settings if you wish.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to request deletion of your account and all associated note cards, flashcards, quizzes, and transcripts at any time. You can trigger this instantly using the "Reset/Delete Account Data" button in your dashboard, or by contacting us.</p>
          </section>

          <div className="pt-6 border-t border-border flex justify-between items-center text-xs">
            <Link href="/login" className="text-primary hover:underline font-medium">
              &larr; Back to Sign In
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
