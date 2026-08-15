import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import SessionTimeoutNotice from "./components/SessionTimeoutNotice";
import SupabaseAuthCallback from "./components/SupabaseAuthCallback";
import RfqPrompt from "./components/RfqPrompt";
import WhatsAppFloatButton from "./components/WhatsAppFloatButton";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Sustainly Green | B2B Sustainability Marketplace",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "sustainable marketplace",
    "green suppliers India",
    "B2B sustainability",
    "sustainable products",
    "responsible sourcing",
    "verified suppliers",
    "ESG procurement",
    "renewable energy suppliers",
  ],
  authors: [{ name: SITE_NAME, url: "/" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.webmanifest",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favi.png",
    shortcut: "/favi.png",
    apple: "/favi.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: SITE_NAME,
    title: "Sustainly Green | B2B Sustainability Marketplace",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo.png",
        width: 607,
        height: 207,
        alt: "Sustainly Green",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sustainly Green | B2B Sustainability Marketplace",
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b3d24",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/browse?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <SupabaseAuthCallback />
        <SessionTimeoutNotice />
        <RfqPrompt />
        <WhatsAppFloatButton />
        {children}
      </body>
    </html>
  );
}
