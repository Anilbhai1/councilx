import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Council X | The 216 Supreme Syndicate',
  description: 'The World\'s 216 Greatest Minds in Your Private War Room.',
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
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#050505', color: '#E0E0E0' }}>
        {children}
      </body>
    </html>
  );
}
