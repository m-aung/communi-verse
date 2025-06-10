import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coins, Home, ShoppingCart, UserCircle2 } from 'lucide-react';

export function SiteHeader() {
  // Mock data
  const isLoggedIn = true;
  const userCoins = 1250;

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
          {isLoggedIn ? (
            <>
              <div className="flex items-center text-sm text-foreground">
                <Coins className="mr-1 h-4 w-4 text-yellow-500" />
                <span>{userCoins}</span>
              </div>
              <Button variant="ghost" size="icon">
                <UserCircle2 className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm">
              Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
