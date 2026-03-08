import { Link, useLocation } from 'react-router-dom';
import { MapPin, Compass, LogIn, LogOut, User, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import AuthDialog from '@/components/AuthDialog';

const Navbar = () => {
  const location = useLocation();
  const { isLoggedIn, email, logout, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
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
            {location.pathname !== '/shared-maps' && (
              <Button variant="ghost" size="sm" asChild className="gap-1.5">
                <Link to="/shared-maps">
                  <Users className="h-4 w-4" /> Shared Maps
                </Link>
              </Button>
            )}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
                {isAdmin && location.pathname !== '/admin' && (
                  <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                    <Link to="/admin">
                      <Shield className="h-4 w-4" /> Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={logout}>
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAuthOpen(true)}>
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default Navbar;
