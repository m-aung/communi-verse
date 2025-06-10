
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
import { getCurrentUser, getUserProfile, updateUserProfile } from '@/lib/services/userService';
import type { UserProfile } from '@/lib/types';
import { Loader2, Save, UserCircle2 } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must not exceed 50 characters." }),
  bio: z.string().max(200, { message: "Bio must not exceed 200 characters." }).optional().default(""),
  avatarUrl: z.string().url({ message: "Please enter a valid URL for the avatar." }).optional().or(z.literal('')).default(""),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const profile = await getUserProfile(currentUser.id);
          setUserProfile(profile);
          if (profile) {
            form.reset({
              name: profile.name,
              bio: profile.bio || '',
              avatarUrl: profile.avatarUrl || '',
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [form, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userProfile) return;
    setIsSaving(true);
    try {
      const updatedProfile = await updateUserProfile(userProfile.id, {
        name: data.name,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      });
      if (updatedProfile) {
        setUserProfile(updatedProfile);
        form.reset(data); // Keep form values as submitted
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      } else {
        throw new Error("Profile update returned null");
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

  if (!userProfile) {
    return <p className="text-center text-destructive">Could not load user profile.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={watchedAvatarUrl || userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="user avatar large" />
            <AvatarFallback className="text-3xl">
              {watchedName ? watchedName.substring(0, 2).toUpperCase() : userProfile.name.substring(0, 2).toUpperCase()}
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
          <Input type="email" value={userProfile.email || 'Not set'} readOnly disabled className="bg-muted/50" />
           <FormDescription>Your email address cannot be changed here.</FormDescription>
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
        
        <FormItem>
            <Label>Online Status</Label>
            <p className={`text-sm font-medium p-2 rounded-md ${userProfile.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                Currently {userProfile.isOnline ? 'Online' : 'Offline'}
            </p>
            <FormDescription>Your online status is managed from the dashboard.</FormDescription>
        </FormItem>

        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
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
