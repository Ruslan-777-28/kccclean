import "./globals.css";
import { ReactNode } from "react";
import ClientShell from "./client-shell";

export const metadata = {
  title: "ConnectNow",
  description: "1-on-1 real-time communication platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head></head>
      <body className="font-body antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
