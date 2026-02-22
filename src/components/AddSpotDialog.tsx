import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, SpotCategory } from '@/lib/mockData';
import { Mail, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddSpotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BLOCKED_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'me.com', 'mail.com', 'protonmail.com', 'zoho.com'];

const AddSpotDialog = ({ open, onOpenChange }: AddSpotDialogProps) => {
  const [step, setStep] = useState<'signup' | 'verify' | 'form'>('signup');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SpotCategory | ''>('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

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
    // MVP: accept any 6-digit code
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit code sent to your email.',
        variant: 'destructive',
      });
      return;
    }
    setStep('form');
    toast({
      title: 'Email verified! 🎓',
      description: 'Welcome to Spotter — start recommending spots.',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Spot submitted! 🎉',
      description: `"${name}" will appear on the map once 5 students recommend it.`,
    });
    onOpenChange(false);
    setName('');
    setCategory('');
    setAddress('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'signup' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Sign up to add a spot</DialogTitle>
              <DialogDescription>
                Use your university or work email to join Spotter.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@kth.se"
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  University & work emails accepted (KTH, SU, SSE, etc.). No personal emails (Gmail, Yahoo…).
                </p>
              </div>
              <Button type="submit" className="w-full gap-2 bg-gradient-hero">
                Sign Up & Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : step === 'verify' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Verify your email</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to <strong>{email}</strong>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-code">Verification Code</Label>
                <Input
                  id="verify-code"
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
                Didn't get the code? Check spam or <button type="button" className="underline" onClick={() => setStep('signup')}>try another email</button>.
              </p>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Recommend a New Spot</DialogTitle>
              <DialogDescription>
                Your spot will appear on the map once 5 students recommend it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spot-name">Place Name</Label>
                <Input id="spot-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Café Fåtöljen" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as SpotCategory)}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot-address">Address</Label>
                <Input id="spot-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street name, Stockholm" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot-desc">Why is this spot great?</Label>
                <Textarea id="spot-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell students what makes this place special..." rows={3} required />
              </div>
              <Button type="submit" className="w-full bg-gradient-hero">Submit Spot</Button>
              <p className="text-center text-xs text-muted-foreground">
                ℹ️ Spots become visible after 5 unique student recommendations.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSpotDialog;
