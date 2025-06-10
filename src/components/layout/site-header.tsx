
"use client"; // Needs to be client component to use useAuth hook

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coins, Home, LogOut, ShoppingCart, UserCircle2, LogInIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const { toast } = useToast();
  // const userCoins = 1250; // This was mock, needs to be fetched for the logged-in user

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    } catch (error: any) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold font-headline text-primary">
          CommuniVerse
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-4">
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
          ) : user ? (
            <>
              {/* <div className="flex items-center text-sm text-foreground">
                <Coins className="mr-1 h-4 w-4 text-yellow-500" />
                <span>{userCoins}</span> 
              </div> */}
              <span className="text-sm text-muted-foreground hidden sm:inline">Hi, {user.name.split(' ')[0]}</span>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <UserCircle2 className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">
                <LogInIcon className="mr-1 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
