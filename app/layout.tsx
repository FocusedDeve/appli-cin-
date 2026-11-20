import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Popcorn & Chill",
  description: "Noraly, your AI movie sommelier: tell her what you feel like watching and get movies, series and anime picked for you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <ToastProvider>
          <Navbar />
          {children}
          <Footer />
        </ToastProvider>

      </body>
    </html>
  );
}
