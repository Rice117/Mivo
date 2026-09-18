import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "./ui";

export const metadata: Metadata = {
  title: "Azuska Z",
  description: "Agents IA pour analyse, stratégie marketing, design et création publicitaire",
};

// Réglage indispensable sur iPhone : sans « viewport-fit=cover », la page
// passe sous l'encoche ; sans « width=device-width », tout s'affiche minuscule.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
