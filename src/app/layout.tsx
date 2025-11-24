
"use client";

import "./globals.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";
import IncomingCallModal from "@/components/IncomingCallModal";
import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

function AppContent({ children }: { children: React.ReactNode }) {
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
        <title>ConnectNow</title>
        <meta name="description" content="1-on-1 real-time communication platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
