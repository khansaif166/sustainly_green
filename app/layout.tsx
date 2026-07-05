import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionTimeoutNotice from "./components/SessionTimeoutNotice";
import SupabaseAuthCallback from "./components/SupabaseAuthCallback";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

// const serif = Instrument_Serif({
//   subsets: ["latin"],
//   variable: "--font-serif",
// });

export const metadata: Metadata = {
  title: "Sustainly Green - The Hub of Sustainability",
  description: "Global B2B sustainable marketplace",
   icons: {
    icon: "/favi.png",         
    shortcut: "/favi.png",    
    apple: "/favi.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${jakarta.variable} font-sans antialiased`} suppressHydrationWarning>
        <SupabaseAuthCallback />
        <SessionTimeoutNotice />
        {children}
      </body>
    </html>
  );
}
