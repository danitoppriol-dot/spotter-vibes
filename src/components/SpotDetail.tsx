import { useState, useEffect } from 'react';
import { Spot, CATEGORIES, LAYERS, MapLayer } from '@/lib/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Star, ThumbsUp, MapPin, TrendingUp, Clock, ExternalLink, Send, Heart, Ghost, CheckCircle2, Timer, Flag, Pencil, Trash2, Zap, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/AuthDialog';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface SpotDetailProps {
  spot: Spot | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

function StarRating({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= (interactive ? (hover || rating) : Math.round(rating))
              ? 'fill-secondary text-secondary'
              : 'text-muted'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
        />
      ))}
      {!interactive && <span className="ml-1 text-sm font-medium text-foreground">{rating.toFixed(1)}</span>}
    </div>
  );
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function useCountdown(expiresAt?: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m left`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return timeLeft;
}

const REPORT_REASONS = [
  'Incorrect information',
  'Inappropriate content',
  'Spam / fake place',
  'Closed permanently',
  'Duplicate spot',
  'Other',
];

const SpotDetail = ({ spot, open, onClose, onUpdate }: SpotDetailProps) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewHasOutlets, setReviewHasOutlets] = useState(false);
  const [reviewSilenceLevel, setReviewSilenceLevel] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [createdBy, setCreatedBy] = useState<string | null>(null);
  const { toast } = useToast();
  const { isLoggedIn, user } = useAuth();
  const countdown = useCountdown(spot?.expiresAt);

  useEffect(() => {
    if (!user || !spot) return;
    supabase
      .from('saved_places')
      .select('id')
      .eq('user_id', user.id)
      .eq('place_id', spot.id)
      .then(({ data }: any) => setIsSaved((data || []).length > 0));

    // Check if user owns this spot
    supabase
      .from('places')
      .select('created_by')
      .eq('id', spot.id)
      .single()
      .then(({ data }: any) => setCreatedBy(data?.created_by || null));
  }, [user, spot?.id]);

  const isOwner = user && createdBy === user.id;

  const handleToggleSave = async () => {
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    if (!spot) return;
    setSavingToggle(true);
    if (isSaved) {
      await supabase.from('saved_places').delete().eq('user_id', user.id).eq('place_id', spot.id);
      setIsSaved(false);
      toast({ title: 'Removed from favorites' });
    } else {
      await (supabase.from('saved_places').insert({ user_id: user.id, place_id: spot.id } as any) as any);
      setIsSaved(true);
      toast({ title: 'Saved to favorites ❤️' });
    }
    setSavingToggle(false);
  };

  if (!spot) return null;

  const category = CATEGORIES.find((c) => c.id === spot.category);
  const isStudySpot = spot.category === 'study';

  const handleRecommend = async () => {
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const dist = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, spot.lat, spot.lng);
      if (dist > 500) {
        toast({
          title: 'Too far away 📍',
          description: `You need to be within 500m to endorse. You're ${Math.round(dist)}m away.`,
          variant: 'destructive',
        });
        return;
      }
    } catch { /* graceful degradation */ }

    const { error } = await supabase.from('recommendations').insert({
      user_id: user.id, place_id: spot.id,
    } as any);
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already recommended', description: 'You already endorsed this spot!' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return;
    }
    toast({ title: 'Spot recommended! 👍', description: `You endorsed "${spot.name}".` });
    onUpdate?.();
  };

  const handleOpenReview = () => {
    if (!isLoggedIn) { setAuthOpen(true); return; }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    if (reviewRating === 0) {
      toast({ title: 'Add a rating', description: 'Please select a star rating.', variant: 'destructive' });
      return;
    }
    if (!reviewText.trim()) {
      toast({ title: 'Comment required', description: 'Please write a comment for your review.', variant: 'destructive' });
      return;
    }
    if (isStudySpot && reviewSilenceLevel === 0) {
      toast({ title: 'Silence level required', description: 'Please rate the silence level.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const insertData: any = {
      user_id: user.id,
      place_id: spot.id,
      rating: reviewRating,
      text: reviewText.trim(),
    };
    if (isStudySpot) {
      insertData.has_outlets = reviewHasOutlets;
      insertData.silence_level = reviewSilenceLevel;
    }
    const { error } = await supabase.from('reviews').insert(insertData as any);
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Review submitted! ✍️' });
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewText('');
    setReviewHasOutlets(false);
    setReviewSilenceLevel(0);
    onUpdate?.();
  };

  const handleReport = async () => {
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    if (!reportReason) {
      toast({ title: 'Select a reason', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await (supabase.from('reports').insert({
      user_id: user.id, place_id: spot.id, reason: reportReason, details: reportDetails || null,
    } as any) as any);
    setIsSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already reported', description: 'You already reported this spot.' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Spot reported 🚩', description: 'Thanks! A moderator will review it.' });
    }
    setShowReportForm(false);
    setReportReason('');
    setReportDetails('');
  };

  const handleEdit = async () => {
    if (!user || !isOwner) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('places')
      .update({ name: editName, description: editDescription } as any)
      .eq('id', spot.id);
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Spot updated ✏️' });
    setShowEditForm(false);
    onUpdate?.();
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;
    if (!confirm(`Delete "${spot.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('places').delete().eq('id', spot.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Spot deleted 🗑️' });
    onClose();
    onUpdate?.();
  };

  const openEdit = () => {
    setEditName(spot.name);
    setEditDescription(spot.description);
    setShowEditForm(true);
  };

  const googleMapsUrl = spot.googleMapsUrl || `https://maps.google.com/?q=${spot.lat},${spot.lng}`;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setShowReviewForm(false); setShowReportForm(false); setShowEditForm(false); } }}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="pb-4">
            <div className="space-y-2">
              <SheetTitle className="font-display text-xl">{spot.name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={`${category?.color} text-primary-foreground`}>
                  {category?.icon} {category?.label}
                </Badge>
                {spot.isOfficial ? (
                  <Badge variant="outline" className="gap-1 border-accent text-accent">
                    <CheckCircle2 className="h-3 w-3" /> Official
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-muted-foreground/50 text-muted-foreground">
                    <Ghost className="h-3 w-3" /> Unconfirmed
                  </Badge>
                )}
                {spot.trending && (
                  <Badge variant="outline" className="gap-1 border-secondary text-secondary">
                    <TrendingUp className="h-3 w-3" /> Trending
                  </Badge>
                )}
                {spot.hasOutlets && (
                  <Badge variant="outline" className="gap-1 border-secondary text-secondary">
                    <Zap className="h-3 w-3" /> Outlets
                  </Badge>
                )}
                {spot.avgSilenceLevel != null && spot.avgSilenceLevel > 0 && (
                  <Badge variant="outline" className="gap-1 border-primary text-primary">
                    <Volume2 className="h-3 w-3" /> Silence {spot.avgSilenceLevel.toFixed(1)}/5
                  </Badge>
                )}
                {countdown && countdown !== 'Expired' && (
                  <Badge variant="outline" className="gap-1 border-accent text-accent">
                    <Timer className="h-3 w-3" /> {countdown}
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5">
            {spot.photoUrl && (
              <img src={spot.photoUrl} alt={spot.name} className="h-44 w-full rounded-lg object-cover" />
            )}

            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <MapPin className="h-4 w-4" /> {spot.address} <ExternalLink className="h-3 w-3" />
            </a>

            {spot.openingHours && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {spot.openingHours}
              </div>
            )}

            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <StarRating rating={spot.rating} />
                <p className="text-xs text-muted-foreground">{spot.reviewCount} reviews</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{spot.recommendations}</p>
                  <p className="text-xs text-muted-foreground">endorsements</p>
                </div>
              </div>
            </div>

            {spot.questionnaire && Object.keys(spot.questionnaire).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(spot.questionnaire).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs capitalize">
                    {key.replace(/_/g, ' ')}: {value}
                  </Badge>
                ))}
              </div>
            )}

            {!spot.isOfficial && (
              <div className="rounded-lg border border-muted bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  👻 This spot is <strong>unconfirmed</strong>. It needs {Math.max(0, 4 - spot.recommendations)} more endorsements or a ≥3.5 rating to become official.
                </p>
              </div>
            )}

            <p className="text-sm leading-relaxed text-foreground/80">{spot.description}</p>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button className="flex-1 gap-2 bg-gradient-hero" onClick={handleRecommend}>
                <ThumbsUp className="h-4 w-4" /> Endorse
              </Button>
              <Button
                variant={isSaved ? 'secondary' : 'outline'}
                className="gap-2"
                onClick={handleToggleSave}
                disabled={savingToggle}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleOpenReview}>
                Write Review
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => { if (!isLoggedIn) { setAuthOpen(true); return; } setShowReportForm(true); }}
                title="Report spot"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={openEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive hover:text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            )}

            {/* Edit form */}
            {showEditForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h4 className="font-display text-sm font-semibold">Edit Spot</h4>
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5 bg-gradient-hero" onClick={handleEdit} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowEditForm(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}

            {/* Report form */}
            {showReportForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h4 className="font-display text-sm font-semibold">Report Spot</h4>
                <div className="space-y-1">
                  <Label className="text-xs">Reason *</Label>
                  <Select value={reportReason} onValueChange={setReportReason}>
                    <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                    <SelectContent>
                      {REPORT_REASONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Details (optional)</Label>
                  <Textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Any additional details..." rows={2} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleReport} disabled={isSubmitting}>
                    <Flag className="h-3 w-3" /> {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowReportForm(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}

            <Button variant="outline" className="w-full gap-2" asChild>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4" /> Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            {showReviewForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h4 className="font-display text-sm font-semibold">Your Review</h4>
                <div className="space-y-1">
                  <Label className="text-xs">Rating *</Label>
                  <StarRating rating={reviewRating} interactive onRate={setReviewRating} />
                </div>

                {/* Study-specific fields */}
                {isStudySpot && (
                  <>
                    <div className="flex items-center justify-between rounded-md border bg-background p-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-secondary" />
                        <Label className="text-xs font-medium">Power Outlets Available? *</Label>
                      </div>
                      <Switch checked={reviewHasOutlets} onCheckedChange={setReviewHasOutlets} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5" /> Silence Level * <span className="text-muted-foreground">(1=noisy, 5=silent)</span>
                      </Label>
                      <StarRating rating={reviewSilenceLevel} interactive onRate={setReviewSilenceLevel} />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Comment *</Label>
                  <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                    placeholder={isStudySpot ? "Describe WiFi quality, seating, atmosphere..." : "What did you like about this place?"}
                    rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1.5 bg-gradient-hero" onClick={handleSubmitReview} disabled={isSubmitting}>
                    <Send className="h-3 w-3" /> {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-display text-sm font-semibold">Reviews ({spot.reviews.length})</h3>
              {spot.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
              ) : (
                spot.reviews.map((review, i) => (
                  <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }} className="space-y-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{review.userName}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.text && <p className="text-sm text-foreground/70">{review.text}</p>}
                    {isStudySpot && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {review.hasOutlets != null && (
                          <span className="flex items-center gap-1">
                            <Zap className={`h-3 w-3 ${review.hasOutlets ? 'text-secondary' : 'text-muted'}`} />
                            {review.hasOutlets ? 'Outlets ✓' : 'No outlets'}
                          </span>
                        )}
                        {review.silenceLevel != null && (
                          <span className="flex items-center gap-1">
                            <Volume2 className="h-3 w-3" /> Silence: {review.silenceLevel}/5
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default SpotDetail;
