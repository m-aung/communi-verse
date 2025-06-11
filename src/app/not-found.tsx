
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
      <Image
        src="https://placehold.co/300x200.png" 
        alt="Lost in CommuniVerse"
        width={200}
        height={133}
        data-ai-hint="sad robot space"
        className="mb-8 rounded-lg shadow-md"
      />
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold font-headline mb-3">Oops! Page Not Found.</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        It seems like you've ventured into an uncharted territory of CommuniVerse. The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Link>
      </Button>
    </div>
  );
}

export const metadata = {
    title: 'Page Not Found - CommuniVerse',
};
