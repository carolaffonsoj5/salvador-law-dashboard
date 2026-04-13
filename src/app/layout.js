import './globals.css';

export const metadata = {
  title: 'Alpha Breezy HVAC — Dashboard',
  description: 'Dashboard de Gestão Semanal — Alpha Breezy HVAC Corp',
  manifest: '/manifest.json',
  themeColor: '#0B1D3A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Alpha Breezy',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
