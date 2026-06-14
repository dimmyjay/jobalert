import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Search App",
  description: "Subscribe to job alerts and receive fresh remote jobs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}