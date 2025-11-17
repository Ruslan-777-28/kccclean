'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error('Contextual Firestore Permission Error:', error.message);
      
      // We are deliberately throwing the error here in development
      // to make it visible in the Next.js error overlay, which is
      // more prominent than a toast. This aids in faster debugging.
      if (process.env.NODE_ENV === 'development') {
        // The custom error object provides a much better debugging experience.
        throw error;
      }

      // In production, we'd show a user-friendly toast.
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description:
          'You do not have permission to perform this action. Please contact support if you believe this is an error.',
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  // This component does not render anything itself.
  return null;
}
