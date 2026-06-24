'use client';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'] });

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={outfit.className}>
      <head>
        <title>EcoLink</title>
        <meta name="description" content="Guia de Ecopontos de Uberaba" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: '80vh' }}>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
