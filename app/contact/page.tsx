import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Council X',
  description: 'Contact Council X support, developer relations, and platform administration.',
};

export default function ContactPage() {
  return (
    <div style={{
      maxWidth: '720px',
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
          Contact Council Support
        </h1>
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
          Official Developer & Platform Administration Channels
        </p>
      </header>

      <div style={{
        backgroundColor: '#0F0F0F',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px'
      }}>
        <h2 style={{ color: '#F3F4F6', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          Direct Platform Support
        </h2>
        <p style={{ marginBottom: '20px' }}>
          For inquiries regarding enterprise partnerships, billing inquiries, Google AdSense compliance, or technical troubleshooting, reach out directly to platform administration:
        </p>

        <div style={{
          backgroundColor: '#161616',
          border: '1px solid #262626',
          borderRadius: '8px',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Primary Administrative Email
            </div>
            <div style={{ fontSize: '16px', color: '#D4AF37', fontWeight: 700, marginTop: '4px' }}>
              Arshitchodavadiya@gmail.com
            </div>
          </div>
          <a
            href="mailto:Arshitchodavadiya@gmail.com"
            style={{
              backgroundColor: '#D4AF37',
              color: '#0A0A0A',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Send Email
          </a>
        </div>

        <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px' }}>
            ⚡ <strong>Response Time:</strong> We strive to address all user support inquiries within 24–48 hours.
          </p>
          <p style={{ margin: 0 }}>
            🛡️ <strong>Security Disclosures:</strong> If reporting a vulnerability, please include detailed reproduction steps.
          </p>
        </div>
      </div>
    </div>
  );
}

