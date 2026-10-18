import type { Metadata } from "next";
import "./globals.css";
import "./foundation.css";

export const metadata: Metadata = {
  title: "Make My Marriage | A wedding planned together",
  description:
    "Bring your people, wedding events, guest replies, and planning details into one thoughtful shared place.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
