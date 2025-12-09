"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";
import IncomingCallModal from "@/components/IncomingCallModal";
import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellContent>{children}</ShellContent>
    </AuthProvider>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { incomingCall, clearIncoming } = useIncomingCalls(user?.uid ?? null);

  return (
    <>
      {incomingCall && (
        <IncomingCallModal
          callId={incomingCall.callId}
          callerId={incomingCall.callerId}
          onClose={clearIncoming}
        />
      )}

      <FirebaseErrorListener />

      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </>
  );
}
