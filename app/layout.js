import "./globals.css";

export const metadata = {
  title: "Seismic Desk | Earthquake Monitor",
  description: "An internal earthquake monitoring dashboard for a Zero Trust Private Access lab.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
