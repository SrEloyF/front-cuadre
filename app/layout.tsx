import type { Metadata } from "next";
import "./globals.css";

import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Cuadre",
  description: "Proyecto para el negocio Villanueva",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-100 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
