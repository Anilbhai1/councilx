import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Council X',
  description: 'Terms and Conditions governing the use of Council X and The Syndicate platform.',
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
          Last Updated: November 2026
        </p>
      </header>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Council X ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use our services.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>2. Financial Information & Non-Advisory Disclaimer</h2>
        <p style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', borderLeft: '3px solid #D4AF37', padding: '16px', borderRadius: '4px' }}>
          <strong>IMPORTANT FINANCIAL DISCLAIMER:</strong> Council X and its Oracle of Wealth feature provide simulated historical perspectives, market commentary, and AI-driven data synthesis for informational and educational purposes only. None of the content constitutes certified financial, investment, legal, or tax advice. We are not registered investment advisers (SEBI, SEC, or equivalent regulatory bodies). Users must conduct independent due diligence or consult licensed professionals before executing financial trades.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>3. Accounts, Credits & Subscriptions</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Freemium Credits:</strong> Non-paying users receive token allotments and can earn Council Credits via rewarded transmissions. 1 Credit corresponds to 1 interaction with the AI Oracle. Credits hold no monetary value and are non-refundable.</li>
          <li style={{ marginBottom: '8px' }}><strong>Paid Subscriptions:</strong> Premium access (e.g., Sovereign Syndicate) is billed on a recurring monthly or annual basis via Razorpay. Subscriptions can be canceled at any time prior to the renewal date.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>4. Acceptable Use Policy</h2>
        <p>You agree not to:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li style={{ marginBottom: '8px' }}>Reverse engineer, scrape, extract, or exploit the proprietary system prompts or masterminds.</li>
          <li style={{ marginBottom: '8px' }}>Automate reward token claims or bypass the payment/credit authorization systems.</li>
          <li style={{ marginBottom: '8px' }}>Deploy automated bots to overwhelm backend API routes or serverless endpoints.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>5. Limitation of Liability</h2>
        <p>
          In no event shall Council X, its creators, or affiliates be liable for any indirect, incidental, punitive, or consequential damages resulting from market volatility, trading losses, server downtime, or AI output accuracy.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>6. Termination & Modifications</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate platform integrity or abuse token mechanisms. We may update these terms periodically, and continued use signifies acceptance of updated terms.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>7. Inquiries & Legal Notices</h2>
        <p>
          For legal inquiries, contact: <a href="mailto:Arshitchodavadiya@gmail.com" style={{ color: '#D4AF37', fontWeight: 600 }}>Arshitchodavadiya@gmail.com</a>
        </p>
      </section>
    </div>
  );
}

