'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Coffee, ExternalLink, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Read donation links from environment variables
  const coffeeUrl = process.env.NEXT_PUBLIC_COFFEE_URL || 'https://www.buymeacoffee.com';
  const kofiUrl = process.env.NEXT_PUBLIC_KOFI_URL || 'https://ko-fi.com/synap';
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'santa24559@okhdfcbank';
  const paymentLink = process.env.NEXT_PUBLIC_PAYMENT_LINK || ''; // Custom Razorpay/Cosmofeed hosted checkout link

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard! Thank you ❤️');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const upiUri = `upi://pay?pa=${upiId}&pn=Synap%20AI&cu=INR&tn=Support%20Synap%20AI`;
  // Glowing QR Code centered using standard open QR server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=255-255-255&bgcolor=21-15-46&data=${encodeURIComponent(upiUri)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />

      {/* Glow highlight behind card */}
      <div className="absolute w-[360px] h-[360px] bg-rose-500/20 rounded-full blur-[80px] opacity-40 pointer-events-none z-0" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-10 animate-scale-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mt-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-500 animate-pulse-soft">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Support Synap's Developer</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Synap is built by a student, completely for free. We pay monthly server and API costs to keep high-speed note generation and transcribing running. Your support keeps us alive!
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-3.5">
          
          {paymentLink ? (
            /* Razorpay / Cosmofeed Payment Page (Highly Professional Gateway Checkout) */
            <a
              href={paymentLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 group transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs">
                  ₹
                </span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                    Pay via UPI, Cards, Netbanking
                  </h4>
                  <p className="text-[10px] text-muted-foreground">Secure payment checkout (Razorpay/Gateway)</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
            </a>
          ) : (
            /* Frictionless Direct UPI Payment System */
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold font-mono">
                  ₹
                </span>
                <div className="text-left flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground">
                    Support via UPI (India Only)
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate">Direct bank transfer via GPay, PhonePe, Paytm</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Mobile Direct Pay Link */}
                <a
                  href={upiUri}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active-press shadow-md shadow-emerald-500/10"
                >
                  ⚡ Pay Instantly
                </a>
                
                {/* QR Code Toggle */}
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-foreground transition-all cursor-pointer active-press flex items-center justify-center gap-1.5"
                >
                  📷 {showQr ? 'Hide QR' : 'Show QR'}
                </button>
              </div>

              {/* Collapsible QR Scan Box */}
              {showQr && (
                <div className="flex flex-col items-center justify-center py-4 bg-muted/40 rounded-xl border border-border/60 animate-scale-in text-center gap-2">
                  <div className="p-2 bg-[#150f2e] border border-emerald-500/30 rounded-lg shadow-inner shadow-emerald-500/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI QR Code" 
                      className="w-[150px] h-[150px] object-contain rounded" 
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed mt-1">
                    Scan this QR code using GPay, PhonePe, or Paytm to donate instantly
                  </p>
                </div>
              )}

              {/* Copy UPI Section */}
              <div className="flex items-center gap-2 mt-0.5 border-t border-border/40 pt-2.5">
                <div className="flex-1 bg-muted/60 border border-border px-3 py-1.5 rounded-lg font-mono text-[10px] text-foreground select-all truncate">
                  {upiId}
                </div>
                <button
                  onClick={handleCopyUpi}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer active-press shrink-0"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Ko-fi */}
          <a
            href={kofiUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-[#FF5E5B]/20 bg-[#FF5E5B]/5 hover:bg-[#FF5E5B]/10 hover:border-[#FF5E5B]/40 group transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF5E5B]/20 text-[#FF5E5B]">
                <Heart className="w-4 h-4" />
              </span>
              <div className="text-left">
                <h4 className="text-xs font-bold text-foreground group-hover:text-[#FF5E5B] transition-colors">
                  Support on Ko-fi (International)
                </h4>
                <p className="text-[10px] text-muted-foreground">Supports PayPal & Card (Works seamlessly in India)</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#FF5E5B] transition-colors" />
          </a>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border/40 text-center">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
