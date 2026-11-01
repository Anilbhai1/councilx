'use client';

/**
 * COUNCIL X | THE SYNDICATE
 * Stealth God Mode Admin Panel (app/admin/page.tsx)
 * 
 * Strict Architectural Compliance:
 * 1. UNCONDITIONAL VISIBILITY: /admin renders the Brutalist Login Form unconditionally.
 * 2. ZERO notFound() or redirect logic on the /admin landing page.
 * 3. Authenticates directly against /api/admin using process.env.ADMIN_EMAIL & ADMIN_PASSWORD.
 * 4. Only protects the inner dashboard view once authenticated via JWT.
 */

import React, { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_premium: boolean;
  subscription_tier?: string;
  created_at?: string;
  base_free_limit?: number;
}

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string>('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Restore authenticated session if present
  useEffect(() => {
    try {
      const savedToken =
        sessionStorage.getItem('@councilx_admin_jwt') ||
        localStorage.getItem('@councilx_admin_jwt');
      if (savedToken) {
        setToken(savedToken);
        setIsAuthenticated(true);
        fetchUsers(savedToken);
      }
    } catch (e) { }
  }, []);

  const fetchUsers = async (jwtToken: string) => {
    setFetchingUsers(true);
    try {
      const res = await fetch('/api/admin?action=users', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'x-admin-token': jwtToken
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('EMAIL AND PASSWORD REQUIRED');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          email: email.trim(),
          password: password.trim()
        })
      });

      if (!res.ok) {
        setErrorMessage('INVALID MASTER CIPHER - ACCESS DENIED');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data && data.success && data.token) {
        setToken(data.token);
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('@councilx_admin_jwt', data.token);
          localStorage.setItem('@councilx_admin_jwt', data.token);
        } catch (e) { }
        fetchUsers(data.token);
      } else {
        setErrorMessage('AUTHENTICATION FAILED');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'NETWORK TIMEOUT');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantGodAccess = async (userId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-admin-token': token
        },
        body: JSON.stringify({
          action: 'override',
          userId,
          status: 'Premium_Lifetime'
        })
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, is_premium: true, subscription_tier: 'Premium_Lifetime' } : u))
        );
        setActionMessage(`GOD ACCESS GRANTED: User ${userId} updated to Premium_Lifetime.`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e: any) {
      setActionMessage(`Error granting access: ${e?.message}`);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('@councilx_admin_jwt');
      localStorage.removeItem('@councilx_admin_jwt');
    } catch (e) { }
    setIsAuthenticated(false);
    setToken('');
    setUsers([]);
  };

  // 1. INNER DASHBOARD (PROTECTED: Accessible when authenticated via JWT)
  if (isAuthenticated) {
    return (
      <div style={styles.dashboardContainer}>
        {/* Terminal Header */}
        <header style={styles.dashHeader}>
          <div>
            <div style={styles.terminalTag}>[ROOT@COUNCILX-ENCLAVE ~]# GOD_MODE_V2.0</div>
            <h1 style={styles.dashTitle}>COUNCIL X // STEALTH GOD MODE</h1>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            [ DISCONNECT SESSION ]
          </button>
        </header>

        {actionMessage && (
          <div style={styles.bannerAlert}>
            ⚡ {actionMessage}
          </div>
        )}

        {/* Telemetry Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>SYSTEM SECURITY</span>
            <span style={styles.statValue}>MAXIMUM CLEARANCE</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>DATABASE NODES</span>
            <span style={styles.statValue}>{users.length} REGISTERED</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>PAYWALL BYPASS ENGINE</span>
            <span style={styles.statValue}>ACTIVE</span>
          </div>
        </div>

        {/* User Management Table */}
        <section style={styles.tableSection}>
          <div style={styles.tableHeaderBar}>
            <h2 style={styles.tableTitle}>REGISTERED CITIZENS & INVESTORS</h2>
            <button onClick={() => fetchUsers(token)} style={styles.refreshBtn}>
              {fetchingUsers ? 'POLLING...' : '↻ REFRESH TABLE'}
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>USER / EMAIL</th>
                  <th style={styles.th}>JOIN DATE</th>
                  <th style={styles.th}>CURRENT STATUS</th>
                  <th style={styles.th}>GOD OVERRIDE SWITCH</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={styles.emptyTd}>
                      {fetchingUsers ? 'Querying encrypted database...' : 'No users retrieved.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isGodTier = u.subscription_tier === 'Premium_Lifetime' || u.is_premium;
                    return (
                      <tr key={u.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.userEmail}>{u.email || u.id}</div>
                          {u.full_name && <div style={styles.userName}>{u.full_name}</div>}
                        </td>
                        <td style={styles.td}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={styles.td}>
                          <span style={isGodTier ? styles.badgeGod : styles.badgeFree}>
                            {isGodTier ? (u.subscription_tier || 'PREMIUM') : 'FREE'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {isGodTier ? (
                            <span style={styles.godActiveBadge}>✓ UNLIMITED ACCESS</span>
                          ) : (
                            <button
                              onClick={() => handleGrantGodAccess(u.id)}
                              style={styles.grantBtn}
                            >
                              [ Grant God Access ]
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  // 2. UNCONDITIONAL BRUTALIST LOGIN FORM (Rendered unconditionally at /admin)
  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.terminalIndicator}>[ SECURE ENCLAVE ACCESS ]</div>
        <h1 style={styles.loginHeading}>COUNCIL X</h1>
        <p style={styles.loginSub}>AUTHENTICATE MASTER CLEARANCE</p>

        {errorMessage && (
          <div style={styles.errorAlert}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>ADMIN_IDENTITY</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@councilx.ai"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ACCESS_CIPHER</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'AUTHENTICATING ENCLAVE...' : '[ ENTER GOD MODE ]'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#050505',
    color: '#E0E0E0',
    fontFamily: 'monospace, "Courier New", Courier, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  loginCard: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #222222',
    borderTop: '2px solid #D4AF37',
    padding: '40px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
  },
  terminalIndicator: {
    color: '#D4AF37',
    fontSize: '11px',
    letterSpacing: '2px',
    marginBottom: '12px'
  },
  loginHeading: {
    color: '#FFFFFF',
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '4px',
    margin: '0 0 4px 0'
  },
  loginSub: {
    color: '#888888',
    fontSize: '11px',
    letterSpacing: '1px',
    marginBottom: '28px'
  },
  errorAlert: {
    backgroundColor: '#260B0B',
    border: '1px solid #FF4444',
    color: '#FF6666',
    padding: '10px 14px',
    fontSize: '11px',
    letterSpacing: '1px',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    color: '#888888',
    fontSize: '10px',
    letterSpacing: '1.5px'
  },
  input: {
    backgroundColor: '#000000',
    border: '1px solid #262626',
    color: '#FFFFFF',
    padding: '12px 14px',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none'
  },
  submitBtn: {
    backgroundColor: '#000000',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    padding: '14px',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '2px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.2s ease'
  },
  dashboardContainer: {
    minHeight: '100vh',
    backgroundColor: '#050505',
    color: '#E0E0E0',
    fontFamily: 'monospace, "Courier New", Courier, sans-serif',
    padding: '30px'
  },
  dashHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1E1E1E',
    paddingBottom: '20px',
    marginBottom: '24px'
  },
  terminalTag: {
    color: '#D4AF37',
    fontSize: '11px',
    letterSpacing: '2px',
    marginBottom: '6px'
  },
  dashTitle: {
    color: '#FFFFFF',
    fontSize: '24px',
    letterSpacing: '2px',
    margin: 0
  },
  logoutBtn: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #333',
    color: '#888',
    padding: '10px 16px',
    fontFamily: 'inherit',
    fontSize: '11px',
    letterSpacing: '1px',
    cursor: 'pointer'
  },
  bannerAlert: {
    backgroundColor: '#141405',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    padding: '12px 16px',
    fontSize: '12px',
    letterSpacing: '1px',
    marginBottom: '20px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #1A1A1A',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  statLabel: {
    color: '#777777',
    fontSize: '10px',
    letterSpacing: '1.5px'
  },
  statValue: {
    color: '#D4AF37',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '1px'
  },
  tableSection: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #1A1A1A',
    padding: '24px'
  },
  tableHeaderBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  tableTitle: {
    color: '#FFFFFF',
    fontSize: '14px',
    letterSpacing: '1.5px',
    margin: 0
  },
  refreshBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #333',
    color: '#D4AF37',
    padding: '6px 12px',
    fontFamily: 'inherit',
    fontSize: '10px',
    letterSpacing: '1px',
    cursor: 'pointer'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    borderBottom: '1px solid #222'
  },
  th: {
    padding: '12px 14px',
    color: '#888',
    fontSize: '11px',
    letterSpacing: '1px'
  },
  tr: {
    borderBottom: '1px solid #141414'
  },
  td: {
    padding: '14px',
    fontSize: '13px'
  },
  userEmail: {
    color: '#FFFFFF',
    fontWeight: 600
  },
  userName: {
    color: '#666',
    fontSize: '11px',
    marginTop: '2px'
  },
  badgeGod: {
    backgroundColor: '#1E1A05',
    color: '#D4AF37',
    border: '1px solid #D4AF37',
    padding: '4px 8px',
    fontSize: '10px',
    letterSpacing: '1px'
  },
  badgeFree: {
    backgroundColor: '#111',
    color: '#777',
    padding: '4px 8px',
    fontSize: '10px',
    letterSpacing: '1px'
  },
  grantBtn: {
    backgroundColor: '#000',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    padding: '6px 12px',
    fontFamily: 'inherit',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '1px'
  },
  godActiveBadge: {
    color: '#00FF66',
    fontSize: '11px',
    letterSpacing: '1px'
  },
  emptyTd: {
    padding: '30px',
    textAlign: 'center',
    color: '#666',
    fontSize: '12px'
  }
};
