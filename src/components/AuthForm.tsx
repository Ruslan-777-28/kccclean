'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  avatar: z.any().optional(),
});

type AuthFormProps = {
  mode: 'login' | 'signup';
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { auth, db, storage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const schema = mode === 'login' ? loginSchema : signupSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'signup' ? { displayName: '', email: '', password: '' } : { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!auth || !db || !storage) {
      toast({
        variant: 'destructive',
        title: 'Initialization Error',
        description: 'Firebase is not ready. Please try again in a moment.',
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { displayName, email, password, avatar } = values as z.infer<typeof signupSchema>;
        const avatarFile = avatar instanceof FileList && avatar.length > 0 ? avatar[0] : null;
        const user = await signUp(auth, db, storage, email, password, displayName, avatarFile);
        toast({ title: 'Success', description: 'Account created successfully!' });
        router.push(`/profile/${user.uid}`);
        router.refresh();
      } else {
        const { email, password } = values as z.infer<typeof loginSchema>;
        const user = await signIn(auth, email, password);
        toast({ title: 'Success', description: 'Logged in successfully!' });
        router.push(`/profile/${user.uid}`);
        router.refresh();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
      form.setValue('avatar', e.target.files);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {mode === 'signup' && (
          <>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24 border">
                <AvatarImage src={avatarPreview ?? undefined} />
                <AvatarFallback>Avatar</AvatarFallback>
              </Avatar>
              <FormField
                control={form.control}
                name="avatar"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <Input id="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                    </FormControl>
                     <Label htmlFor="avatar-upload" className="cursor-pointer text-sm text-primary underline-offset-4 hover:underline">
                      Upload Avatar
                    </Label>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  );
}
