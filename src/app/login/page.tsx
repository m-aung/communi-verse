
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png" // Updated image path
              alt="CommuniVerse Logo"
              width={100} // Adjusted size
              height={100} // Adjusted size
              data-ai-hint="cosmic chat"
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
