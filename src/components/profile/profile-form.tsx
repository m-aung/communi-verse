
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
import { getUserProfile, updateUserProfile } from '@/lib/services/userService';
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
  const [isLoading, setIsLoading] = useState(true);
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
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!authUser || !firebaseUser) {
      // If not authenticated, redirect to login or show message
      toast({ title: "Not Authenticated", description: "Please login to view your profile.", variant: "destructive" });
      router.push('/login');
      return;
    }

    async function fetchProfile() {
      setIsLoading(true);
      try {
        // authUser.id is the Firebase UID
        const profile = await getUserProfile(authUser.id); 
        if (profile) {
          setUserProfile(profile);
          form.reset({
            name: profile.name,
            bio: profile.bio || '',
            avatarUrl: profile.avatarUrl || '',
          });
        } else {
          // Profile might not exist yet in our DB, use Firebase details as a base
           setUserProfile({ // Create a temporary profile state for the form
            id: authUser.id,
            name: authUser.name,
            email: firebaseUser.email || '',
            avatarUrl: authUser.avatarUrl || '',
            bio: '',
            isOnline: false, // Default, can be fetched/updated separately
          });
          form.reset({
            name: authUser.name,
            bio: '',
            avatarUrl: authUser.avatarUrl || '',
          });
           toast({ title: "Profile not fully setup", description: "Please complete your profile details.", variant: "default" });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [authUser, authLoading, firebaseUser, form, toast, router]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!authUser) {
      toast({ title: "Not Authenticated", description: "Login required.", variant: "destructive" });
      return;
    }
    if (!userProfile && !authUser.id) { // Ensure we have an ID to update
        toast({ title: "Error", description: "User ID not found. Cannot update profile.", variant: "destructive" });
        return;
    }

    const profileIdToUpdate = userProfile ? userProfile.id : authUser.id;

    setIsSaving(true);
    try {
      const updatedProfileData: Partial<UserProfile> = {
        name: data.name,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        // email is usually managed by Firebase Auth, not updated here
      };
      
      // If it was a new profile, it also needs the email and isOnline status
      if(!userProfile) {
        updatedProfileData.email = firebaseUser?.email || '';
        updatedProfileData.isOnline = false; // Default to false, online status button handles this
      }

      const updatedProfile = await updateUserProfile(profileIdToUpdate, updatedProfileData);
      
      if (updatedProfile) {
        setUserProfile(updatedProfile); // Update local state
        form.reset(data); 
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      } else {
         // This case could mean the profile didn't exist and update failed to create.
         // Let's try creating it if updateUserProfile is designed to only update existing.
         // For our mock, updateUserProfile also handles creation/upsert if profileData in createUserProfile is UserProfile type
         // So, if it's null, it's likely an issue with the mock or a real error.
        throw new Error("Profile update returned null. It might be an issue with creating it.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Error", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!authUser && !authLoading) {
     // This case should be handled by the redirect in useEffect, but as a fallback
    return <p className="text-center text-destructive py-10">Please log in to view your profile.</p>;
  }
  
  // Use authUser for initial display if userProfile is still null (e.g., first time setup)
  const displayProfile = userProfile || authUser;
  // Email from firebaseUser as it's more authoritative if available
  const displayEmail = firebaseUser?.email || (displayProfile as UserProfile)?.email || 'Not available';


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={watchedAvatarUrl || displayProfile?.avatarUrl} alt={displayProfile?.name} data-ai-hint="user avatar large" />
            <AvatarFallback className="text-3xl">
              {(watchedName || displayProfile?.name || 'U').substring(0, 2).toUpperCase()}
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
        
        {userProfile && (
          <FormItem>
              <Label>Online Status</Label>
              <p className={`text-sm font-medium p-2 rounded-md ${userProfile.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  Currently {userProfile.isOnline ? 'Online' : 'Offline'}
              </p>
              <FormDescription>Your online status is managed from the dashboard.</FormDescription>
          </FormItem>
        )}


        <Button type="submit" disabled={isSaving || isLoading || authLoading} className="w-full sm:w-auto">
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
