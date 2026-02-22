import { Link, useLocation } from 'react-router-dom';
import { MapPin, Compass, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Spotter</span>
        </Link>

        <div className="flex items-center gap-2">
          {location.pathname !== '/explore' && (
            <Button variant="ghost" size="sm" asChild className="gap-1.5">
              <Link to="/explore">
                <Compass className="h-4 w-4" /> Explore
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5">
            <LogIn className="h-4 w-4" /> Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
