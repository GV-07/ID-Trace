'use client';

import Link from 'next/link';
import { ShieldCheck, Globe, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight text-primary font-headline uppercase">ID-Trace</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/export" className="text-sm font-medium hover:text-primary transition-colors">Export Registry</Link>
            <Link href="/import" className="text-sm font-medium hover:text-primary transition-colors">Import Verification</Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-accent-foreground">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold">AI Active</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4">
          <Link href="/" className="text-sm font-medium px-4 py-2 hover:bg-accent rounded-md" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
          <Link href="/export" className="text-sm font-medium px-4 py-2 hover:bg-accent rounded-md" onClick={() => setIsMenuOpen(false)}>Export Registry</Link>
          <Link href="/import" className="text-sm font-medium px-4 py-2 hover:bg-accent rounded-md" onClick={() => setIsMenuOpen(false)}>Import Verification</Link>
        </div>
      )}
    </nav>
  );
}
