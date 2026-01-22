import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberFiction",
  description: "Canvas Scroll Animation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/locomotive-scroll@4.1.4/dist/locomotive-scroll.min.css" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}