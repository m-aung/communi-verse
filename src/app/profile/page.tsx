
import { ProfileForm } from '@/components/profile/profile-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function UserProfilePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Your Profile</CardTitle>
          <CardDescription>Manage your CommuniVerse account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: 'My Profile - CommuniVerse',
};
