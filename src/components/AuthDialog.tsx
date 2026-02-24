import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowRight, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'me.com', 'mail.com', 'protonmail.com', 'zoho.com'];

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();

  const validateEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || BLOCKED_DOMAINS.includes(domain)) {
      toast({
        title: 'Personal email not allowed',
        description: 'Please use your university or work email (e.g. name@kth.se).',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !validateEmail(email)) return;
    
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
            {mode === 'signin' ? 'Sign in to Spotter' : 'Create your account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin'
              ? 'Welcome back! Sign in with your email.'
              : 'Use your university or work email to join.'}
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
                placeholder="your.name@kth.se"
                className="pl-9"
                required
              />
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground">
                University & work emails accepted (KTH, SU, SSE, etc.). No personal emails.
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
          <Button type="submit" className="w-full gap-2 bg-gradient-hero" disabled={isSubmitting}>
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
