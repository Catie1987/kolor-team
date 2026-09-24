import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip"
import { RouteLoaderProvider } from "@/components/provider/router-loader-provider";
import { Toaster } from "@/components/ui/toast"

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase: new URL("https://kisco-dashboard.vercel.app/"),
  title: {
    default: "Kisco Team",
    template: "%s | Kisco Team",
  },
  description: "Provide data, comparison, trend for report purpose",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    ><RouteLoaderProvider>
        <TooltipProvider>
          <ClerkProvider>
            <body className="">{children}</body>
            <Toaster />
          </ClerkProvider>
        </TooltipProvider>
      </RouteLoaderProvider>
    </html>
  );
}
