'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Camera, 
  Scan, 
  Upload, 
  Shield, 
  Sparkles,
  RefreshCw,
  History,
  Lock,
  MapPin,
  Package,
  Globe,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { identifyBarcode } from '@/ai/flows/identify-barcode-flow';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useAuth, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { computeSaltedHash } from '@/lib/hash-utils';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { VerificationLog, Product } from '@/lib/types';
import { resolveGS1Region } from '@/lib/gs1-utils';

export default function ImportVerification() {
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [registryEntry, setRegistryEntry] = useState<Product | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected' | 'unknown' | null>(null);

  useEffect(() => {
    startCamera();
    if (auth && !user) signInAnonymously(auth).catch(() => {});
    return () => stopCamera();
  }, [auth, user]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      setHasCameraPermission(false);
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setRegistryEntry(null);
    setVerificationStatus(null);
    setVerifyProgress(0);
    startCamera();
  };

  const saveVerificationLog = async (productId: string, isMatch: boolean, status: 'approved' | 'rejected') => {
    if (!db || !user) return;
    
    const logId = crypto.randomUUID();
    const logData: VerificationLog = {
      id: logId,
      productId: productId,
      scannedBarcode: productId,
      verificationTimestamp: new Date().toISOString(),
      isMatch: isMatch,
      status: status,
      creatorUid: user.uid
    };

    const logRef = doc(db, 'verificationLogs', logId);
    setDoc(logRef, logData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: logRef.path,
        operation: 'create',
        requestResourceData: logData
      }));
    });
  };

  const processVerification = async (dataUri: string) => {
    if (!db || !user) return;
    setIsCapturing(true);
    setVerifyProgress(20);
    
    try {
      const response = await identifyBarcode({ photoDataUri: dataUri });
      setVerifyProgress(50);

      if (!response.success || !response.data) {
        toast({ variant: "destructive", title: "Scan Failed", description: response.error || "No ID detected." });
        setVerifyProgress(0);
        setIsCapturing(false);
        return;
      }

      const inputSerial = response.data.barcode;

      const docRef = doc(db, 'registrations', inputSerial);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const storedData = docSnap.data() as Product;
        setRegistryEntry(storedData);
        
        setVerifyProgress(80);
        const checkHash = await computeSaltedHash(inputSerial, storedData.salt);

        const isMatch = checkHash === storedData.hash;
        const status = isMatch ? 'approved' : 'rejected';
        setVerificationStatus(status);
        
        await saveVerificationLog(inputSerial, isMatch, status);

        toast({
          title: isMatch ? "Approved" : "Rejected",
          variant: isMatch ? "default" : "destructive",
          description: isMatch ? "Trace match confirmed." : "Origin discrepancy detected.",
        });
      } else {
        // Fallback to GS1 parsing for unknown items (PRD Step 3.C)
        const region = resolveGS1Region(inputSerial);
        setRegistryEntry({
          id: inputSerial,
          barcode: inputSerial,
          productName: response.data.productName || 'Unknown Product',
          brand: response.data.brand || 'Unknown',
          manufacturer: response.data.manufacturer || 'Unknown',
          originAddress: response.data.originAddress || `Registered HQ: ${region}`,
          registeredRegion: region,
          hash: '',
          salt: '',
          exportTimestamp: '',
          status: 'rejected'
        });
        setVerificationStatus('unknown');
        await saveVerificationLog(inputSerial, false, 'rejected');
        toast({ variant: "destructive", title: "Unknown ID", description: "Record not found in global registry." });
      }

      setVerifyProgress(100);
      stopCamera();
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Terminal node handshake error." });
      setVerifyProgress(0);
    } finally {
      setIsCapturing(false);
    }
  };

  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    await processVerification(canvas.toDataURL('image/jpeg', 0.8));
  }, [isCapturing]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-primary flex items-center gap-3 italic uppercase">
            <Shield className="h-12 w-12" /> Validation Terminal
          </h1>
          <p className="text-muted-foreground font-bold text-sm tracking-tight">Authenticity Node & Origin Verification.</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
          <Sparkles className="h-4 w-4" /> Global Node Active
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className={cn("lg:col-span-7", (verificationStatus || verificationStatus === 'unknown') && "hidden lg:block")}>
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
            
            {/* Validation HUD */}
            <div className="absolute inset-0 pointer-events-none border-[1rem] border-black/20 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary/50 rounded-full relative animate-pulse">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest italic">Authenticity Scan</div>
              </div>
            </div>

            {isCapturing && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-white backdrop-blur-md">
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Consulting Global Registry</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-2">Performing Cryptographic Handshake</p>
                <Progress value={verifyProgress} className="h-1.5 w-64 mt-10 bg-white/10" />
              </div>
            )}
            {!verificationStatus && (
              <div className="absolute bottom-12 inset-x-12 flex gap-4">
                <Button className="flex-1 h-20 text-2xl font-black italic uppercase rounded-[2rem] shadow-2xl" disabled={isCapturing} onClick={captureAndVerify}>
                  <Scan className="mr-3 h-8 w-8" /> Verify Trace
                </Button>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white h-20 w-20 p-0 rounded-[2rem] hover:bg-white/20" onClick={() => fileInputRef.current?.click()} disabled={isCapturing}>
                  <Upload className="h-8 w-8" />
                </Button>
              </div>
            )}
          </Card>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => processVerification(reader.result as string);
            reader.readAsDataURL(file);
          }} />
        </div>

        <div className={cn("lg:col-span-5", !verificationStatus && "hidden lg:block")}>
          {verificationStatus ? (
            <div className="space-y-8">
              <Card className={cn("border-none shadow-2xl rounded-[4rem] overflow-hidden", 
                verificationStatus === 'approved' ? "bg-green-600/5" : "bg-destructive/5")}>
                <div className={cn("p-12 text-center text-white space-y-4", 
                  verificationStatus === 'approved' ? "bg-green-600" : "bg-destructive")}>
                  {verificationStatus === 'approved' ? <ShieldCheck className="h-20 w-20 mx-auto animate-pulse" /> : <ShieldAlert className="h-20 w-20 mx-auto animate-bounce" />}
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                    {verificationStatus === 'approved' ? 'Trace Approved' : 'Trace Rejected'}
                  </h2>
                  <p className="opacity-80 font-bold uppercase text-[10px] tracking-[0.2em]">
                    {verificationStatus === 'approved' ? 'Manufacturer Origin Confirmed' : 'Integrity Failure Detected'}
                  </p>
                </div>
                <CardContent className="p-10 space-y-8">
                  {registryEntry && (
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Package className="h-6 w-6" /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Product / Brand</p>
                          <p className="font-black text-lg text-foreground uppercase italic">{registryEntry.productName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{registryEntry.brand}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Globe className="h-6 w-6" /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Registered Region</p>
                          <p className="font-black text-lg text-foreground italic uppercase">{registryEntry.registeredRegion}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary"><MapPin className="h-6 w-6" /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Origin Facility</p>
                          <p className="text-sm font-black leading-relaxed text-foreground">{registryEntry.originAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-6 border-t border-dashed">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Serial Number</p>
                    <p className="font-mono font-black text-xl text-primary">{registryEntry?.barcode || 'NOT_ARCHIVED'}</p>
                  </div>
                  
                  <div className="p-6 bg-muted/50 rounded-[2rem] flex items-center gap-4 border-2 border-dashed">
                    <Lock className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground italic">Secure Audit Trail</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">Verification logged to Global Distributed Ledger.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-black italic">
                    <Database className="h-4 w-4" /> Node Telemetry Updated
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full h-20 text-2xl font-black italic uppercase rounded-[2.5rem] shadow-xl" onClick={handleReset}>
                <RefreshCw className="mr-3 h-8 w-8" /> Next Validation
              </Button>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-primary/20 rounded-[4rem] flex flex-col items-center justify-center p-16 text-center text-muted-foreground/30 bg-muted/5">
              <Shield className="h-24 w-24 mb-6 opacity-5" />
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Awaiting Scan</h3>
              <p className="text-xs font-bold uppercase tracking-widest mt-2">Node ready for cryptographic trace...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
