import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arctic Aura Background Remover",
  description:
    "Modern UI and API gateway for withoutbg, built for the Arctic Aura Designs tunnel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
