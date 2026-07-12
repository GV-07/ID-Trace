'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Save, 
  Scan, 
  Upload, 
  Camera, 
  Fingerprint,
  Cpu,
  Sparkles,
  Package,
  MapPin,
  Globe,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { identifyBarcode, IdentifyBarcodeOutput } from '@/ai/flows/identify-barcode-flow';
import { useFirestore, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { generateSalt, computeSaltedHash } from '@/lib/hash-utils';
import { resolveGS1Region } from '@/lib/gs1-utils';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Product } from '@/lib/types';

export default function ExportRegistry() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<(IdentifyBarcodeOutput & { registeredRegion?: string }) | null>(null);
  const [registeredProduct, setRegisteredProduct] = useState<Product | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function enableCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
      }
    }
    if (!scannedData && !registeredProduct) enableCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [scannedData, registeredProduct]);

  const handleReset = () => {
    setScannedData(null);
    setRegisteredProduct(null);
    setScanProgress(0);
  };

  const processImage = async (dataUri: string) => {
    setIsCapturing(true);
    setScanProgress(20);
    try {
      const response = await identifyBarcode({ photoDataUri: dataUri });
      setScanProgress(70);
      
      if (!response.success || !response.data) {
        toast({ variant: "destructive", title: "Scan Failed", description: response.error || "ID not identified." });
        setScanProgress(0);
        setIsCapturing(false);
        return;
      }

      const region = resolveGS1Region(response.data.barcode);
      setScannedData({
        ...response.data,
        registeredRegion: region,
        originAddress: response.data.originAddress || `Registered HQ: ${region}`,
      });
      setScanProgress(100);
      toast({ title: "Trace Identified", description: "Manufacturer metadata resolved." });
    } catch (err) {
      toast({ variant: "destructive", title: "System Error", description: "Identity extraction failed." });
      setScanProgress(0);
    } finally {
      setIsCapturing(false);
    }
  };

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    await processImage(canvas.toDataURL('image/jpeg', 0.8));
  }, [isCapturing]);

  async function handleStore() {
    if (!scannedData || !db || !user) return;
    const serial = scannedData.barcode;
    setIsSaving(true);
    try {
      const salt = generateSalt(16);
      const hash = await computeSaltedHash(serial, salt);

      const registration: Product = {
        id: serial,
        barcode: serial,
        productName: scannedData.productName || 'Unknown Product',
        brand: scannedData.brand || 'Unknown',
        manufacturer: scannedData.manufacturer || 'Unknown',
        originAddress: scannedData.originAddress || 'No detailed address found.',
        registeredRegion: scannedData.registeredRegion || 'Global',
        hash: hash,
        salt: salt,
        exportTimestamp: new Date().toISOString(),
        status: 'active',
      };

      const docRef = doc(db, 'registrations', serial);
      setDoc(docRef, registration)
        .then(() => {
          setRegisteredProduct(registration);
          toast({ title: "Secured", description: "Identity archived to Global Registry." });
        })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: registration,
          }));
        })
        .finally(() => setIsSaving(false));
    } catch (error) {
      setIsSaving(false);
      toast({ variant: "destructive", title: "Archive Failed", description: "Database handshake rejected." });
    }
  }

  if (isUserLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  if (registeredProduct) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Card className="border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white">
          <div className="bg-primary p-12 text-center text-white space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto animate-bounce" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Trace Archived</h2>
            <p className="opacity-80 text-[10px] font-bold uppercase tracking-widest">Origin and Identity Secured</p>
          </div>
          <CardContent className="p-10 space-y-8">
            <DisplayField label="Serial / ID" value={registeredProduct.barcode} isMono />
            <div className="grid grid-cols-2 gap-6">
              <DisplayField label="Region" value={registeredProduct.registeredRegion} />
              <DisplayField label="Manufacturer" value={registeredProduct.manufacturer} />
            </div>
            <div className="pt-6 border-t border-dashed">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Integrity Signature Locked
              </p>
              <div className="text-[10px] font-mono text-primary/40 font-bold">SHA256: [HIDDEN_FOR_SECURITY]</div>
            </div>
          </CardContent>
          <CardFooter className="p-10 pt-0">
            <Button className="w-full h-14 text-lg font-black uppercase italic rounded-2xl" onClick={handleReset}>
              <RefreshCw className="mr-2 h-5 w-5" /> Next Shipments
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-primary flex items-center gap-3 italic uppercase">
            <Cpu className="h-12 w-12" /> Trace Node
          </h1>
          <p className="text-muted-foreground font-bold text-sm tracking-tight">Global Product Identity & Origin Extraction.</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
          <Sparkles className="h-4 w-4" /> AI Trace Active
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className={cn("lg:col-span-7", scannedData && "hidden lg:block")}>
          <Card className="bg-black border-none shadow-2xl overflow-hidden relative aspect-[4/3] rounded-[4rem] group">
            {hasCameraPermission ? (
              <video ref={videoRef} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" autoPlay muted playsInline />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                <Camera className="h-20 w-20 mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest">Sensor Offline</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none border-[1rem] border-black/20 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary/50 rounded-[2rem] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Focus Zone</div>
              </div>
            </div>
            {isCapturing && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white p-12 backdrop-blur-md">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Resolving Identity</h3>
                <Progress value={scanProgress} className="h-1.5 w-64 mt-8 bg-white/10" />
              </div>
            )}
            <div className="absolute bottom-12 inset-x-12 flex gap-4">
              <Button className="flex-1 h-20 text-2xl font-black italic uppercase rounded-[2rem] shadow-2xl" disabled={isCapturing} onClick={captureAndScan}>
                <Scan className="mr-3 h-8 w-8" /> Scan Label
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white h-20 w-20 p-0 rounded-[2rem] hover:bg-white/20" onClick={() => fileInputRef.current?.click()} disabled={isCapturing}>
                <Upload className="h-8 w-8" />
              </Button>
            </div>
          </Card>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => processImage(reader.result as string);
            reader.readAsDataURL(file);
          }} />
        </div>

        <div className={cn("lg:col-span-5", !scannedData && "hidden lg:block")}>
          {scannedData ? (
            <Card className="border-none shadow-2xl rounded-[4rem] overflow-hidden bg-white/70 backdrop-blur-3xl">
              <CardHeader className="bg-primary p-10 text-white">
                <CardTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Fingerprint className="h-8 w-8" /> Origin Profile
                </CardTitle>
                <CardDescription className="text-white/80 font-bold uppercase text-[10px] tracking-widest mt-1">Exact Record Metadata Resolved</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <DisplayField label="Brand" value={scannedData.brand} />
                  <DisplayField label="Product Name" value={scannedData.productName} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Origin Address</label>
                  <div className="p-6 bg-muted/40 rounded-3xl border-2 border-muted font-black text-sm leading-relaxed text-foreground italic">
                    {scannedData.originAddress}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5"><Globe className="h-3 w-3" /> Registered Region</label>
                  <div className="p-6 bg-primary/5 rounded-3xl border-2 border-primary/10 font-black text-sm text-primary uppercase italic">
                    {scannedData.registeredRegion}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed">
                  <DisplayField label="Serial / ID" value={scannedData.barcode} isMono />
                  <DisplayField label="Batch / Lot" value={scannedData.batchNumber || 'AUTO'} />
                </div>
              </CardContent>
              <CardFooter className="p-10 border-t bg-white/30">
                <Button className="w-full h-20 text-2xl font-black italic uppercase rounded-[2.5rem] shadow-xl" onClick={handleStore} disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin h-8 w-8" /> : <><Save className="mr-3 h-8 w-8" /> Commit Trace</>}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed border-primary/20 rounded-[4rem] flex flex-col items-center justify-center p-16 text-center text-muted-foreground/30 bg-muted/5">
              <Database className="h-24 w-24 mb-6 opacity-5" />
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Awaiting Identity</h3>
              <p className="text-xs font-bold uppercase tracking-widest mt-2">Scan a barcode to populate trace data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DisplayField({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</label>
      <div className={cn("font-black text-sm truncate text-foreground uppercase italic", isMono && "font-mono text-xs text-primary not-italic")}>
        {value || "PENDING"}
      </div>
    </div>
  );
}
