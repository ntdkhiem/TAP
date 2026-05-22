import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAP - Test Assistant Project",
  description: "Real-time math tutor and testing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
