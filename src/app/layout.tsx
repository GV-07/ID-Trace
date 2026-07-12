'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login' && pathname !== '/') {
      router.push('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState<number>(2024);

  useEffect(() => {
    setMounted(true);
    setYear(new Date().getFullYear());
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
        <title>ID-Trace | Professional Terminal</title>
        <meta name="description" content="Global Identity Registry & Manufacturer Trace." />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <FirebaseClientProvider>
          <AuthGate>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t py-8 bg-card/50 backdrop-blur-sm">
              <div className="container mx-auto px-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">
                  &copy; {mounted ? year : '2025'} ID-Trace Global Terminal. Secure Origin Tracking.
                </p>
              </div>
            </footer>
          </AuthGate>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
