import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'me.com', 'mail.com', 'protonmail.com', 'zoho.com'];

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || BLOCKED_DOMAINS.includes(domain)) {
      toast({
        title: 'Personal email not allowed',
        description: 'Please use your university or work email (e.g. name@kth.se, name@company.com).',
        variant: 'destructive',
      });
      return;
    }
    setStep('verify');
    toast({
      title: 'Verification code sent! 📧',
      description: `Check your inbox at ${email} for a 6-digit code.`,
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit code sent to your email.',
        variant: 'destructive',
      });
      return;
    }
    login(email);
    toast({
      title: 'Welcome to Spotter! 🎓',
      description: 'You can now recommend spots and leave reviews.',
    });
    onOpenChange(false);
    setStep('signup');
    setEmail('');
    setVerificationCode('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep('signup');
      setVerificationCode('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'signup' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Sign in to Spotter</DialogTitle>
              <DialogDescription>
                Use your university or work email to join.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="space-y-4">
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
                <p className="text-xs text-muted-foreground">
                  University & work emails accepted (KTH, SU, SSE, etc.). No personal emails.
                </p>
              </div>
              <Button type="submit" className="w-full gap-2 bg-gradient-hero">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Verify your email</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to <strong>{email}</strong>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-code">Verification Code</Label>
                <Input
                  id="auth-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2 bg-gradient-hero">
                Verify <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Didn't get the code? Check spam or{' '}
                <button type="button" className="underline" onClick={() => setStep('signup')}>try another email</button>.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
