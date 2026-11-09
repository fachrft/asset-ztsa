import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seismic Desk | Earthquake Monitor",
  description: "An internal earthquake monitoring dashboard for a Zero Trust Private Access lab.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
