import { Link, useLocation } from 'react-router-dom';
import { MapPin, Compass, LogIn, LogOut, User, Users, Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import AuthDialog from '@/components/AuthDialog';

const Navbar = () => {
  const location = useLocation();
  const { isLoggedIn, email, logout, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const navLinks = (
    <>
      {location.pathname !== '/explore' && (
        <Button variant="ghost" size="sm" asChild className="gap-1.5 justify-start" onClick={closeMobile}>
          <Link to="/explore">
            <Compass className="h-4 w-4" /> Explore
          </Link>
        </Button>
      )}
      {location.pathname !== '/shared-maps' && (
        <Button variant="ghost" size="sm" asChild className="gap-1.5 justify-start" onClick={closeMobile}>
          <Link to="/shared-maps">
            <Users className="h-4 w-4" /> Shared Maps
          </Link>
        </Button>
      )}
      {isLoggedIn ? (
        <>
          <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
          {isAdmin && location.pathname !== '/admin' && (
            <Button variant="ghost" size="sm" className="gap-1.5 justify-start" asChild onClick={closeMobile}>
              <Link to="/admin">
                <Shield className="h-4 w-4" /> Admin
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 justify-start" asChild onClick={closeMobile}>
            <Link to="/profile">
              <User className="h-4 w-4" /> Profile
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 justify-start" onClick={() => { logout(); closeMobile(); }}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" className="gap-1.5 justify-start" onClick={() => { setAuthOpen(true); closeMobile(); }}>
          <LogIn className="h-4 w-4" /> Sign In
        </Button>
      )}
    </>
  );

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

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 md:flex">
            {navLinks}
          </div>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="flex flex-col gap-1 border-t bg-card p-3 md:hidden">
            {isLoggedIn && (
              <p className="mb-1 truncate px-3 text-xs text-muted-foreground">{email}</p>
            )}
            {navLinks}
          </div>
        )}
      </nav>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default Navbar;
