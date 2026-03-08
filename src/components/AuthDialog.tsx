import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowRight, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Allowed university domain patterns
const WHITELISTED_DOMAINS = [
  // Sweden
  'kth.se', 'su.se', 'uu.se', 'lu.se', 'gu.se', 'chalmers.se', 'liu.se', 'ltu.se', 'hhs.se', 'ki.se', 'umu.se', 'mdh.se', 'bth.se', 'hb.se', 'hig.se', 'hkr.se', 'mau.se',
  // Italy
  'polimi.it', 'unimi.it', 'unibo.it', 'uniroma1.it', 'unipd.it', 'unifi.it', 'unina.it', 'polito.it', 'unitn.it', 'units.it', 'unige.it', 'unipi.it', 'unict.it', 'uniba.it', 'unicatt.it', 'luiss.it', 'unibocconi.it', 'uniroma2.it', 'uniroma3.it', 'unisa.it', 'univr.it',
  // Denmark
  'ku.dk', 'dtu.dk', 'au.dk', 'sdu.dk', 'cbs.dk', 'itu.dk',
  // Norway
  'uio.no', 'ntnu.no', 'uib.no', 'nmbu.no', 'nhh.no',
  // Finland
  'aalto.fi', 'helsinki.fi', 'tuni.fi', 'oulu.fi', 'jyu.fi',
  // Netherlands
  'tudelft.nl', 'uva.nl', 'vu.nl', 'uu.nl', 'rug.nl', 'tue.nl', 'utwente.nl', 'leidenuniv.nl', 'eur.nl',
  // Germany
  'tum.de', 'lmu.de',
  // France
  'hec.fr', 'sciencespo.fr', 'ens.fr',
  // Spain
  'ub.edu', 'uam.es', 'uc3m.es',
  // UK
  'ox.ac.uk', 'cam.ac.uk', 'imperial.ac.uk', 'ucl.ac.uk', 'lse.ac.uk', 'kcl.ac.uk', 'ed.ac.uk',
  // Switzerland
  'ethz.ch', 'epfl.ch', 'uzh.ch', 'unibe.ch',
];

const ACADEMIC_PATTERNS = [
  /\.edu$/,
  /\.ac\.uk$/, /\.ac\.at$/, /\.ac\.be$/, /\.ac\.il$/, /\.ac\.jp$/, /\.ac\.nz$/,
  /\.edu\.au$/, /\.edu\.cn$/, /\.edu\.sg$/, /\.edu\.hk$/, /\.edu\.tw$/,
  /\.uni-.*\.de$/, /\.tu-.*\.de$/,
  /\.univ-.*\.fr$/,
  /\.studenti\..+\.it$/,
];

function isAllowedDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Check whitelisted domains (exact or subdomain match)
  if (WHITELISTED_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) return true;

  // Check academic patterns
  if (ACADEMIC_PATTERNS.some((p) => p.test(domain))) return true;

  return false;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' && !isAllowedDomain(email)) {
      toast({
        title: 'University email required',
        description: 'Only .edu and recognized university emails are accepted (e.g. name@kth.se, name@polimi.it).',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    if (mode === 'signup') {
      const { error, needsVerification } = await signUp(email, password);
      if (error) {
        toast({ title: 'Sign up failed', description: error, variant: 'destructive' });
      } else if (needsVerification) {
        toast({ title: 'Check your email! 📧', description: `We sent a confirmation link to ${email}. Click it to activate your account.` });
        onOpenChange(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Sign in failed', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Welcome back! 🎓', description: 'You are now signed in.' });
        onOpenChange(false);
      }
    }
    setIsSubmitting(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) { setMode('signin'); setEmail(''); setPassword(''); }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {mode === 'signin' ? 'Sign in to Spotter' : 'Join Spotter'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin'
              ? 'Welcome back! Sign in with your email.'
              : 'Use your university email (.edu or equivalent) to join.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@university.edu"
                className="pl-9"
                required
              />
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground">
                Only university emails accepted (.edu, kth.se, polimi.it, etc.)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a password (6+ chars)' : 'Your password'}
                className="pl-9"
                minLength={6}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full gap-2 bg-gradient-hero shadow-glow" disabled={isSubmitting}>
            {isSubmitting ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <>Don't have an account?{' '}
                <button type="button" className="text-primary underline" onClick={() => setMode('signup')}>
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button type="button" className="text-primary underline" onClick={() => setMode('signin')}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
