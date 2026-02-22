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

const AddSpotDialog = ({ open, onOpenChange }: AddSpotDialogProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SpotCategory | ''>('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('.se') && !email.endsWith('.edu')) {
      toast({
        title: 'University email required',
        description: 'Please use your university email (e.g. name@kth.se) to sign up.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoggedIn(true);
    toast({
      title: 'Welcome to Spotter! 🎓',
      description: 'You can now recommend spots to fellow students.',
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
        {!isLoggedIn ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Sign up to add a spot</DialogTitle>
              <DialogDescription>
                Use your university email to join Spotter and start recommending places.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">University Email</Label>
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
                  Only .se and .edu university emails are accepted.
                </p>
              </div>
              <Button type="submit" className="w-full gap-2 bg-gradient-hero">
                Sign Up & Continue <ArrowRight className="h-4 w-4" />
              </Button>
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
