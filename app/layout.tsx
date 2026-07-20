import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import SessionTimeoutNotice from "./components/SessionTimeoutNotice";
import SupabaseAuthCallback from "./components/SupabaseAuthCallback";
import RfqPrompt from "./components/RfqPrompt";
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MNNFGHF6FC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MNNFGHF6FC');
          `}
        </Script>
      </head>
      <body className={`${poppins.variable} ${jakarta.variable} font-sans antialiased`} suppressHydrationWarning>
        <SupabaseAuthCallback />
        <SessionTimeoutNotice />
        <RfqPrompt />
        {children}
      </body>
    </html>
  );
}
