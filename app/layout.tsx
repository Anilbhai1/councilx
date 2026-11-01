import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Council X | The 216 Supreme Syndicate',
  description: 'The World\'s 216 Greatest Minds in Your Private War Room. AI Financial Oracle & Sovereign Mastermind Syndicate.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <Script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-451688541136672"
          strategy="afterInteractive"
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#050505', color: '#E0E0E0', display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>

        {/* Minimalist Global Footer with Mandatory Legal Links */}
        <footer style={{
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          backgroundColor: '#0A0A0A',
          padding: '24px 16px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '10px'
          }}>
            <a href="/privacy-policy" style={{ color: '#D4AF37', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              Privacy Policy
            </a>
            <span style={{ color: '#444' }}>•</span>
            <a href="/terms-of-service" style={{ color: '#D4AF37', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              Terms of Service
            </a>
            <span style={{ color: '#444' }}>•</span>
            <a href="/contact" style={{ color: '#D4AF37', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              Contact Us
            </a>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#777', letterSpacing: '0.5px' }}>
            © {new Date().getFullYear()} Council X | The 216 Supreme Syndicate. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
