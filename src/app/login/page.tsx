'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Lock, UserPlus, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LoginTerminal() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        // Login Flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (!userDoc.exists()) {
          // Audit Log for failure
          await setDoc(doc(db, 'authLogs', crypto.randomUUID()), {
            email,
            timestamp: new Date().toISOString(),
            status: 'fail',
            reason: 'User not registered in identity registry'
          });
          throw new Error('Access Rejected: User Not Registered in System.');
        }

        // Audit Log for success
        await setDoc(doc(db, 'users', userCredential.user.uid, 'authLogs', crypto.randomUUID()), {
          email,
          timestamp: new Date().toISOString(),
          status: 'success'
        });

        toast({ title: "Access Granted", description: `Welcome back, Officer.` });
        router.push('/');
      } else {
        // Registration Flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        const userData = {
          uid: userCredential.user.uid,
          fullName,
          email,
          regDate: new Date().toISOString(),
          role: 'officer'
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        
        toast({ title: "Identity Created", description: "You are now archived in the registry." });
        router.push('/');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Access Rejected",
        description: error.message || "Invalid credentials provided."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white/70 backdrop-blur-3xl">
        <CardHeader className="bg-primary p-10 text-white text-center">
          <Fingerprint className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">
            {isLogin ? 'Officer Login' : 'Register Identity'}
          </CardTitle>
          <CardDescription className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">
            ID-Trace Access Terminal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="p-10 space-y-6">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Name</label>
                <Input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer Name"
                  required
                  className="rounded-2xl h-12 border-2 focus:ring-primary font-bold"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Address</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@id-trace.global"
                required
                className="rounded-2xl h-12 border-2 focus:ring-primary font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Access Key</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-2xl h-12 border-2 focus:ring-primary font-bold"
              />
            </div>
          </CardContent>
          <CardFooter className="p-10 pt-0 flex flex-col gap-4">
            <Button type="submit" className="w-full h-14 text-lg font-black italic uppercase rounded-2xl shadow-xl" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : isLogin ? <><Lock className="mr-2 h-5 w-5" /> Authenticate</> : <><UserPlus className="mr-2 h-5 w-5" /> Create Identity</>}
            </Button>
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline"
            >
              {isLogin ? 'Request New Registration' : 'Return to Login'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
