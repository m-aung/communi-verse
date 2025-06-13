
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
import { useAuth } from '@/hooks/useAuth'; 
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
  const { userProfile: authUserProfile, loading: authLoading, firebaseUser } = useAuth(); // Use userProfile
  // Removed local userProfile state, will rely on authUserProfile from context for display
  // isLoading state now primarily reflects authLoading from context for initial setup.
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { // Default values are for form structure
      name: '',
      bio: '',
      avatarUrl: '',
    },
  });

  // Effect to populate form when authUserProfile from context is available or changes
  useEffect(() => {
    if (authLoading) { // If context is loading, wait.
      return;
    }

    if (!firebaseUser) { // If not authenticated (no firebaseUser)
      toast({ title: "Not Authenticated", description: "Please login to view your profile.", variant: "destructive" });
      router.push('/login');
      return; 
    }
    
    // If authenticated (firebaseUser exists) and context is not loading
    if (authUserProfile) { // If profile from context exists
      form.reset({
        name: authUserProfile.name,
        bio: authUserProfile.bio || '',
        avatarUrl: authUserProfile.avatarUrl || '',
      });
    } else if (firebaseUser && !authLoading) { 
      // Fallback: firebaseUser exists, auth not loading, but no full UserProfile from context yet
      // (e.g. listener still initializing or new user before profile fully propagates to listener)
      // We can pre-fill with Firebase data if available, but this might be brief
      // as the listener in AuthProvider should soon provide the full UserProfile.
      const baseName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User';
      const baseAvatar = firebaseUser.photoURL || `https://placehold.co/40x40.png?text=${baseName.substring(0,1).toUpperCase()}`;
      form.reset({
        name: baseName,
        bio: '',
        avatarUrl: baseAvatar,
      });
      // It's also possible the profile doc doesn't exist in Firestore yet.
      // The save operation (onSubmit) will handle creating it if needed.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserProfile, firebaseUser, authLoading, router]); // form.reset included indirectly via form

  const onSubmit = async (data: ProfileFormValues) => {
    if (!firebaseUser) { 
      toast({ title: "Not Authenticated", description: "Login required to save profile.", variant: "destructive" });
      return;
    }
    
    const profileIdToUpdate = firebaseUser.id;
    setIsSaving(true);

    try {
      // The profile in context (authUserProfile) is live from Firestore listener.
      // We use it to preserve fields not in the form, like isOnline.
      const profileDataForSave: UserProfile = {
        id: profileIdToUpdate,
        name: data.name,
        email: firebaseUser.email || (authUserProfile?.email || ''),
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        isOnline: authUserProfile?.isOnline !== undefined ? authUserProfile.isOnline : false,
        // coinBalance: authUserProfile?.coinBalance // Preserve coinBalance if it were part of UserProfile from context
      };

      let savedProfile;
      if (authUserProfile) { // If profile already exists (known from context)
        savedProfile = await updateUserProfile(profileIdToUpdate, profileDataForSave);
      } else {
        // Profile doesn't exist in context, means it likely doesn't exist in DB yet, so create.
        savedProfile = await createUserProfile(profileDataForSave);
      }
      
      if (savedProfile) {
        // AuthProvider's listener will pick up the change and update authUserProfile context.
        // Form can be reset with savedProfile data, though listener should do this.
        // For immediate feedback:
         form.reset({ 
           name: savedProfile.name,
           bio: savedProfile.bio || '',
           avatarUrl: savedProfile.avatarUrl || '',
         }); 
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      } else {
        throw new Error("Profile update or creation failed at service level.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Error", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!firebaseUser && !authLoading) { // Should have been redirected by useEffect, but as a safeguard
    return <p className="text-center text-destructive py-10">Redirecting to login...</p>;
  }
  
  // Watched values for dynamic avatar/name display if form is dirty
  const watchedAvatarUrl = form.watch('avatarUrl');
  const watchedName = form.watch('name');

  const currentName = watchedName || authUserProfile?.name || firebaseUser?.displayName || 'User';
  const currentAvatar = watchedAvatarUrl || authUserProfile?.avatarUrl || firebaseUser?.photoURL || `https://placehold.co/40x40.png?text=${currentName.substring(0,1).toUpperCase()}`;
  const displayEmail = firebaseUser?.email || authUserProfile?.email || 'Not available';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={currentAvatar} alt={currentName} data-ai-hint="user avatar large" />
            <AvatarFallback className="text-3xl">
              {currentName ? currentName.substring(0, 2).toUpperCase() : 'U'}
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
        
        {authUserProfile && authUserProfile.isOnline !== undefined && (
          <FormItem>
              <Label>Online Status</Label>
              <p className={`text-sm font-medium p-2 rounded-md ${authUserProfile.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  Currently {authUserProfile.isOnline ? 'Online' : 'Offline'}
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
