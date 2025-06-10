
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link'; // Import Link

const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Basic signup schema
const signupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

// Combined type for form values
type FormValues = z.infer<typeof loginFormSchema> & Partial<z.infer<typeof signupFormSchema>>;


export function LoginForm() {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false); // State to toggle between login and signup

  const form = useForm<FormValues>({
    resolver: zodResolver(isSignupMode ? signupFormSchema : loginFormSchema),
    // Provide default values for ALL fields that might be part of the form,
    // regardless of the current mode. This prevents uncontrolled -> controlled warnings.
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // Effect to reset form when toggling mode
  useEffect(() => {
    // When switching modes, reset the form to clear previous inputs.
    // The resolver will ensure validation against the correct schema.
    form.reset({
      name: '',
      email: '',
      password: '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignupMode]); // Only trigger reset when isSignupMode changes


  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isSignupMode) {
        // We can assert data.name because signupFormSchema requires it
        await signup(data.email, data.password, data.name!); 
        toast({ title: "Signup Successful", description: "Welcome to CommuniVerse!" });
      } else {
        await login(data.email, data.password);
        toast({ title: "Login Successful", description: "Welcome back!" });
      }
    } catch (error: any) {
      console.error(isSignupMode ? "Signup failed:" : "Login failed:", error);
      toast({
        title: isSignupMode ? "Signup Failed" : "Login Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isSignupMode && (
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
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </>
          ) : isSignupMode ? (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Sign Up
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" /> Login
            </>
          )}
        </Button>
         <p className="text-center text-sm text-muted-foreground">
          {isSignupMode ? "Already have an account? " : "Don't have an account? "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            onClick={() => setIsSignupMode(!isSignupMode)}
          >
            {isSignupMode ? "Login here" : "Sign up here"}
          </Button>
        </p>
      </form>
    </Form>
  );
}
