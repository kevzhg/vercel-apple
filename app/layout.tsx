import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Social Media Analytics - Apple Presentation",
  description: "Advanced social media campaign analysis and visualization platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
