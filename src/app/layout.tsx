import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Script from "next/script";

export const metadata: Metadata = {
  title: "SMILE - Student-Made Interactive Learning Environment",
  description: "Empower educators and students with AI-driven inquiry-based learning",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome CDN - matching Flask */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </Providers>
        {/* Load Font Awesome script for icons */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
