import type { Metadata } from "next";
import "./globals.css";
import Footer from "./components/layouts/Footer";
import { Poppins, Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
