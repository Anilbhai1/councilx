import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Council X',
  description: 'Privacy Policy and Data Protection Terms for Council X and The Syndicate platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      maxWidth: '860px',
      margin: '0 auto',
      padding: '48px 24px 80px',
      color: '#D1D5DB',
      lineHeight: '1.7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{ borderBottom: '1px solid #222', paddingBottom: '24px', marginBottom: '36px' }}>
        <a href="/" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
          ← Return to Council X
        </a>
        <h1 style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 800, marginTop: '16px', letterSpacing: '-0.5px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
          Last Updated: November 2026
        </p>
      </header>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>1. Introduction</h2>
        <p>
          Council X ("we", "our", or "us") operates the Council X platform, an institutional AI financial intelligence and historical mastermind syndicate. We respect your privacy and are committed to protecting your personal data in accordance with international data protection standards.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>2. Information We Collect</h2>
        <p>We may collect and process the following data:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Account Information:</strong> Email address, name, and profile identifier provided during registration.</li>
          <li style={{ marginBottom: '8px' }}><strong>Usage & Telemetry:</strong> Log data, browser types, device identifiers, interaction counts, and consultation transcripts.</li>
          <li style={{ marginBottom: '8px' }}><strong>Billing & Transaction Records:</strong> Order IDs, subscription plan tiers, and payment status via our payment gateway partners (e.g., Razorpay). We do not store full credit card numbers or banking passwords.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>3. Google AdSense & Third-Party Advertising</h2>
        <p>
          We use Google AdSense and third-party advertising partners to serve ads and rewarded transmissions to non-premium members.
        </p>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li style={{ marginBottom: '8px' }}>Google, as a third-party vendor, uses cookies to serve ads on Council X.</li>
          <li style={{ marginBottom: '8px' }}>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.</li>
          <li style={{ marginBottom: '8px' }}>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37' }}>Google Ads Settings</a>.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>4. Cookies & Tracking Technologies</h2>
        <p>
          We use essential and analytics cookies to maintain your authenticated session, remember your preferences, and safeguard platform security. You can manage or disable cookie settings in your browser at any time.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>5. How We Use Your Information</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>To generate personalized AI financial inquiries and syndicate deliberations.</li>
          <li style={{ marginBottom: '8px' }}>To track free credit allocations, reward token issuance, and subscription quotas.</li>
          <li style={{ marginBottom: '8px' }}>To prevent platform abuse, fraudulent credit generation, and unauthorized access.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>6. Data Security & Retention</h2>
        <p>
          We employ 256-bit SSL encryption and strict database role-level security (RLS) to safeguard your data. We retain personal information only for as long as necessary to provide platform services or comply with legal obligations.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>7. Contact Information</h2>
        <p>
          If you have questions regarding this Privacy Policy or your data rights, please contact our Data Protection Officer at:
        </p>
        <p style={{ marginTop: '8px' }}>
          Email: <a href="mailto:Arshitchodavadiya@gmail.com" style={{ color: '#D4AF37', fontWeight: 600 }}>Arshitchodavadiya@gmail.com</a>
        </p>
      </section>
    </div>
  );
}

