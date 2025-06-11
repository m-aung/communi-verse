
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image'; // Added import

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="https://placehold.co/150x100.png"
              alt="CommuniVerse Welcome"
              width={120}
              height={80}
              data-ai-hint="abstract community"
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl font-headline">Login to CommuniVerse</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: 'Login - CommuniVerse',
};
