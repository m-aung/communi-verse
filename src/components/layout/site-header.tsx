
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coins, Home, LogOut, ShoppingCart, UserCircle2, LogInIcon, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

export function SiteHeader() {
  const { userProfile, loading, logout } = useAuth(); // Changed user to userProfile
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      setIsMobileMenuOpen(false); 
    } catch (error: any) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  const commonNavLinks = (
    <>
      <SheetClose asChild>
        <Button variant="ghost" size="sm" asChild className="w-full justify-start">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </Button>
      </SheetClose>
      <SheetClose asChild>
        <Button variant="ghost" size="sm" asChild className="w-full justify-start">
          <Link href="/store">
            <ShoppingCart className="mr-2 h-4 w-4" /> Store
          </Link>
        </Button>
      </SheetClose>
    </>
  );

  const userSpecificLinksMobile = (
    <>
      {loading ? (
        <div className="flex flex-col space-y-2 px-2 py-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : userProfile ? ( // Check userProfile
        <>
          <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
            Hi, {userProfile.name.split(' ')[0]}
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="sm" asChild className="w-full justify-start">
              <Link href="/profile">
                <UserCircle2 className="mr-2 h-4 w-4" /> Profile
              </Link>
            </Button>
          </SheetClose>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive/90">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </>
      ) : (
        <SheetClose asChild>
          <Button variant="default" size="sm" asChild className="w-full justify-start">
            <Link href="/login">
              <LogInIcon className="mr-2 h-4 w-4" /> Login
            </Link>
          </Button>
        </SheetClose>
      )}
    </>
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap">
        <Link href="/" className="text-2xl font-bold font-headline text-primary">
          CommuniVerse
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="mr-1 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/store">
              <ShoppingCart className="mr-1 h-4 w-4" /> Store
            </Link>
          </Button>
          
          {loading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-10" /> 
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : userProfile ? ( // Check userProfile
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">Hi, {userProfile.name.split(' ')[0]}</span>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <UserCircle2 className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" /> <span>Logout</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">
                <LogInIcon className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-4">
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-2">
                <Link href="/" className="text-xl font-bold font-headline text-primary mb-4" onClick={() => setIsMobileMenuOpen(false)}>
                  CommuniVerse
                </Link>
                {commonNavLinks}
                <hr className="my-2"/>
                {userSpecificLinksMobile}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
