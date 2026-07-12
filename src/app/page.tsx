'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PackagePlus, ShieldCheck, BarChart3, ArrowRight, ShieldAlert, History } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Dashboard() {
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-bg');
  const exportImg = PlaceHolderImages.find(img => img.id === 'export-card');
  const importImg = PlaceHolderImages.find(img => img.id === 'import-card');

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-16 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight">
            The Standard for Global Product Trust.
          </h1>
          <p className="text-lg opacity-90 max-w-xl">
            Cryptographically secure product verification bridging the gap between manufacturers and global customs checkpoints.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" variant="secondary" asChild className="font-semibold shadow-lg">
              <Link href="/import">Verify Product <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-white/10 border-white/20 hover:bg-white/20">
              <Link href="/export">Export Entry</Link>
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          {heroImg && (
            <Image 
              src={heroImg.imageUrl} 
              alt={heroImg.description} 
              fill 
              className="object-cover" 
              data-ai-hint={heroImg.imageHint}
            />
          )}
        </div>
      </section>

      {/* Main Flow Selection */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="overflow-hidden group hover:shadow-xl transition-all border-none shadow-md">
          <div className="h-48 relative overflow-hidden">
            {exportImg && (
              <Image 
                src={exportImg.imageUrl} 
                alt={exportImg.description} 
                fill 
                className="object-cover transition-transform group-hover:scale-105" 
                data-ai-hint={exportImg.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
              <PackagePlus className="h-6 w-6" />
              <span className="font-bold text-lg">Origin Site</span>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="font-headline">Export Registry</CardTitle>
            <CardDescription>Register new product units, generate secure hash IDs, and prepare shipments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/export">Register Shipments</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden group hover:shadow-xl transition-all border-none shadow-md">
          <div className="h-48 relative overflow-hidden">
            {importImg && (
              <Image 
                src={importImg.imageUrl} 
                alt={importImg.description} 
                fill 
                className="object-cover transition-transform group-hover:scale-105" 
                data-ai-hint={importImg.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-primary font-bold">
              <ShieldCheck className="h-6 w-6" />
              <span className="text-lg">Import Terminal</span>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="font-headline">Product Verification</CardTitle>
            <CardDescription>Scan arrivals to verify authenticity. Instant hash comparison against export database.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full font-semibold" asChild>
              <Link href="/import">Start Verification</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Section */}
      <section className="grid sm:grid-cols-3 gap-6">
        <Card className="bg-white/50 backdrop-blur border-primary/10">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <History className="h-4 w-4" /> Global Scans (24h)
            </CardDescription>
            <CardTitle className="text-3xl font-bold">128,492</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/50 backdrop-blur border-secondary/10">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-green-600">
              <ShieldCheck className="h-4 w-4" /> Success Rate
            </CardDescription>
            <CardTitle className="text-3xl font-bold">99.98%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/50 backdrop-blur border-destructive/10">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4 w-4" /> Counterfeits Blocked
            </CardDescription>
            <CardTitle className="text-3xl font-bold">4,103</CardTitle>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}