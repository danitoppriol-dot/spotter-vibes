import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, SpotCategory } from '@/lib/mockData';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AddSpotDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SpotCategory | ''>('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Spot submitted! 🎉',
      description: `"${name}" will appear on the map once it reaches 5 endorsements from other students.`,
    });
    setOpen(false);
    setName('');
    setCategory('');
    setAddress('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-hero shadow-glow">
          <Plus className="h-4 w-4" /> Add Spot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Recommend a New Spot</DialogTitle>
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSpotDialog;
