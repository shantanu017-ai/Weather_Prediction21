import React from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: 'GP-01 Air Quality Intelligence & Source Attribution Platform',
  description: 'AI/ML-powered air quality monitoring, satellite data fusion, and probabilistic source attribution platform for India, focused on Maharashtra and Kolhapur.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk';

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" className="dark">
        <body>
          <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>GP-01 Air Quality Monitoring & Source Attribution Platform · CPCB NAQI Standard</span>
                <span>Fusing Ground CAAQMS · NASA FIRMS · Sentinel-5P · Open-Meteo ERA5</span>
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
