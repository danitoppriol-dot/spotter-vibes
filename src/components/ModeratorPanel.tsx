import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, UserPlus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Spot } from '@/lib/mockData';

interface ModeratorPanelProps {
  spots: Spot[];
  onUpdate: () => void;
}

const ModeratorPanel = ({ spots, onUpdate }: ModeratorPanelProps) => {
  const { isAdmin, isModerator } = useAuth();
  const { toast } = useToast();
  const [newModEmail, setNewModEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isModerator) return null;

  const handleToggleVisibility = async (spotId: string, currentlyVisible: boolean) => {
    const { error } = await supabase
      .from('places')
      .update({ is_visible: !currentlyVisible } as any)
      .eq('id', spotId);

    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: currentlyVisible ? 'Posto nascosto' : 'Posto visibile', description: 'Aggiornato con successo.' });
    onUpdate();
  };

  const handleDeletePlace = async (spotId: string, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${name}"?`)) return;
    
    const { error } = await supabase.from('places').delete().eq('id', spotId);
    if (error) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Posto eliminato', description: `"${name}" è stato rimosso.` });
    onUpdate();
  };

  const handleAddModerator = async () => {
    if (!newModEmail) return;
    setIsAdding(true);

    // Find user by email in profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .ilike('display_name', newModEmail.split('@')[0]) as any;

    // Actually we need to find by email - let's query auth users through a different approach
    // We'll look up the user_id by checking profiles where university matches the domain
    // Better approach: use the email directly to find the user
    const { data: authData, error: authError } = await supabase.rpc('find_user_by_email' as any, { _email: newModEmail });
    
    let userId: string | null = null;
    
    if (authError || !authData) {
      // Fallback: try profiles table with display_name matching
      const emailPrefix = newModEmail.split('@')[0];
      const emailDomain = newModEmail.split('@')[1];
      const { data: fallbackProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('display_name', emailPrefix)
        .eq('university', emailDomain) as any;
      
      if (fallbackProfiles && fallbackProfiles.length > 0) {
        userId = fallbackProfiles[0].user_id;
      }
    } else {
      userId = Array.isArray(authData) && authData.length > 0 ? authData[0] : authData;
    }

    if (!userId) {
      toast({ title: 'Utente non trovato', description: 'Questo utente non è registrato.', variant: 'destructive' });
      setIsAdding(false);
      return;
    }

    const { error } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'moderator',
    } as any);

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Già moderatore', description: 'Questo utente è già un moderatore.' });
      } else {
        toast({ title: 'Errore', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Moderatore aggiunto! 🛡️', description: `${newModEmail} è ora un moderatore.` });
      setNewModEmail('');
    }
    setIsAdding(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Shield className="h-4 w-4" /> Mod Panel
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Shield className="h-5 w-5" /> Pannello Moderatore
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isAdmin && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Aggiungi Moderatore</h3>
                <div className="flex gap-2">
                  <Input
                    value={newModEmail}
                    onChange={(e) => setNewModEmail(e.target.value)}
                    placeholder="email@esempio.com"
                    type="email"
                  />
                  <Button size="sm" className="gap-1 shrink-0" onClick={handleAddModerator} disabled={isAdding}>
                    <UserPlus className="h-4 w-4" /> {isAdding ? '...' : 'Aggiungi'}
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Gestisci Posti ({spots.length})</h3>
            {spots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun posto nel database.</p>
            ) : (
              spots.map((spot) => (
                <div key={spot.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{spot.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {spot.recommendations} rec
                      </Badge>
                      <Badge variant={spot.isVisible ? 'default' : 'secondary'} className="text-xs">
                        {spot.isVisible ? 'Visibile' : 'Nascosto'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleVisibility(spot.id, spot.isVisible)}
                      title={spot.isVisible ? 'Nascondi' : 'Mostra'}
                    >
                      {spot.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeletePlace(spot.id, spot.name)}
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ModeratorPanel;
