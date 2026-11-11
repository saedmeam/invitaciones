import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Invitaciones de Matrimonio',
  description:
    'Plataforma multi-evento para invitaciones digitales de matrimonio, confirmación RSVP, envíos por WhatsApp y correo, y álbum QR en Google Drive.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
