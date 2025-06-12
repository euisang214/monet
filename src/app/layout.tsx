import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import TestModeIndicator from "@/components/ui/TestModeIndicator";


export const metadata: Metadata = {
  title: "Monet - Professional Networking Platform",
  description: "Connect with industry professionals for career guidance and opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TestModeIndicator />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
