
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { getUserProfile, updateUserProfile, createUserProfile } from '@/lib/services/userService';
import type { UserProfile } from '@/lib/types';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must not exceed 50 characters." }),
  bio: z.string().max(200, { message: "Bio must not exceed 200 characters." }).optional().default(""),
  avatarUrl: z.string().url({ message: "Please enter a valid URL for the avatar." }).optional().or(z.literal('')).default(""),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { user: authUser, loading: authLoading, firebaseUser } = useAuth(); // Get user from useAuth
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Local loading state for this component
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      bio: '',
      avatarUrl: '',
    },
  });

  const watchedAvatarUrl = form.watch('avatarUrl');
  const watchedName = form.watch('name');

  useEffect(() => {
    if (authLoading) { // If global auth state is loading
      setIsLoading(true); // Component is also in a loading state
      return;
    }
    // If global auth state is resolved (authLoading is false)
    // Component's primary loading dependency (auth) is resolved.
    // We will set isLoading to false after attempting to fetch profile or redirecting.

    if (!authUser || !firebaseUser) { // Now, check if user is actually authenticated
      toast({ title: "Not Authenticated", description: "Please login to view your profile.", variant: "destructive" });
      router.push('/login');
      setIsLoading(false); // Stop loading as we are redirecting
      return; // Exit effect if redirecting
    }

    // If authenticated, proceed to fetch profile data
    async function fetchProfile() {
      setIsLoading(true); // Set loading true for the profile fetch operation
      try {
        const profile = await getUserProfile(authUser.id);
        if (profile) {
          setUserProfile(profile);
          form.reset({
            name: profile.name,
            bio: profile.bio || '',
            avatarUrl: profile.avatarUrl || '',
          });
        } else {
          // Profile might not exist yet in Firestore, use Firebase details as a base
          const baseName = authUser.name || (firebaseUser.email?.split('@')[0] || 'New User');
          const baseAvatar = authUser.avatarUrl || firebaseUser.photoURL || `https://placehold.co/40x40.png?text=${baseName.substring(0,1).toUpperCase()}`;
          
          // Set a temporary userProfile state for the form based on auth data
          // This doesn't mean the profile exists in DB yet, but pre-fills the form.
          setUserProfile({ 
            id: authUser.id,
            name: baseName,
            email: firebaseUser.email || '',
            avatarUrl: baseAvatar,
            bio: '',
            isOnline: false, 
          });
          form.reset({
            name: baseName,
            bio: '',
            avatarUrl: baseAvatar,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
      } finally {
        setIsLoading(false); // Profile fetch operation finished
      }
    }
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authLoading, firebaseUser, router]); // form and toast removed, reset happens inside fetchProfile

  const onSubmit = async (data: ProfileFormValues) => {
    if (!authUser || !firebaseUser) { 
      toast({ title: "Not Authenticated", description: "Login required to save profile.", variant: "destructive" });
      return;
    }
    
    const profileIdToUpdate = authUser.id;
    setIsSaving(true);

    try {
      // Check if profile exists to decide between update or create
      const existingProfile = await getUserProfile(profileIdToUpdate);
      
      const profileDataForSave: UserProfile = {
        id: profileIdToUpdate,
        name: data.name,
        email: firebaseUser.email || (existingProfile?.email || ''), // Preserve existing email if any
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        isOnline: existingProfile?.isOnline !== undefined ? existingProfile.isOnline : false, // Preserve existing online status
      };

      let savedProfile;
      if (existingProfile) {
        savedProfile = await updateUserProfile(profileIdToUpdate, profileDataForSave);
      } else {
        savedProfile = await createUserProfile(profileDataForSave);
      }
      
      if (savedProfile) {
        setUserProfile(savedProfile); 
        form.reset({ 
          name: savedProfile.name,
          bio: savedProfile.bio || '',
          avatarUrl: savedProfile.avatarUrl || '',
        }); 
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      } else {
        throw new Error("Profile update or creation failed.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Error", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!authUser && !authLoading) {
    return <p className="text-center text-destructive py-10">Redirecting to login...</p>;
  }
  
  const currentName = form.getValues('name') || authUser?.name || 'User';
  const currentAvatar = form.getValues('avatarUrl') || authUser?.avatarUrl || '';
  const displayEmail = firebaseUser?.email || userProfile?.email || 'Not available';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={currentAvatar} alt={currentName} data-ai-hint="user avatar large" />
            <AvatarFallback className="text-3xl">
              {currentName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem className="w-full max-w-md">
                <FormLabel>Avatar URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/avatar.png" {...field} />
                </FormControl>
                <FormDescription>Enter a URL for your profile picture.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <Label>Email</Label>
          <Input type="email" value={displayEmail} readOnly disabled className="bg-muted/50" />
           <FormDescription>Your email address is managed by your authentication provider.</FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a little about yourself" {...field} />
              </FormControl>
              <FormDescription>A short description about you (max 200 characters).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {userProfile && userProfile.isOnline !== undefined && (
          <FormItem>
              <Label>Online Status</Label>
              <p className={`text-sm font-medium p-2 rounded-md ${userProfile.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  Currently {userProfile.isOnline ? 'Online' : 'Offline'}
              </p>
              <FormDescription>Your online status is managed from the dashboard.</FormDescription>
          </FormItem>
        )}


        <Button type="submit" disabled={isSaving || authLoading} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

    