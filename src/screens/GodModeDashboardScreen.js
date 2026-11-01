/**
 * COUNCIL X | THE SYNDICATE
 * Stealth God Mode Admin Dashboard (/admin/dashboard)
 * 
 * Theme: Pure pitch black, minimalist terminal interface (hacker vibe), gold accent text.
 * Data Fetching: Fetches registered users directly from Supabase via secure backend API.
 * Controls: Displays User Email, Join Date, Subscription Status, and the [ Grant God Access ] switch.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotFoundScreen from '../components/NotFoundScreen';

export default function GodModeDashboardScreen({ navigation, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  const appendLog = useCallback((message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs((prev) => [
      { id: `${Date.now()}_${Math.random()}`, time, message, type },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  }, []);

  const getAuthToken = async () => {
    try {
      let token = await AsyncStorage.getItem('@councilx_admin_jwt');
      if (!token && Platform.OS === 'web' && typeof window !== 'undefined') {
        token = window.sessionStorage.getItem('@councilx_admin_jwt');
      }
      return token;
    } catch (e) {
      return null;
    }
  };

  const getBaseUrl = () => {
    return Platform.OS === 'web' && typeof window !== 'undefined'
      ? ''
      : 'http://localhost:3001';
  };

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        setIsUnauthenticated(true);
        return;
      }

      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // Any auth failure or 404 sets unauthenticated -> renders NotFoundScreen
        setIsUnauthenticated(true);
        return;
      }

      const data = await response.json();

      if (data && data.success && Array.isArray(data.users)) {
        setUsers(data.users);
        appendLog(`Retrieved ${data.users.length} registered identities from Supabase kernel.`, 'success');
      }
    } catch (err) {
      appendLog(`ERR_STREAM_FAILED: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appendLog]);

  useEffect(() => {
    AsyncStorage.getItem('@councilx_admin_email').then((em) => {
      if (em) setAdminEmail(em);
    });

    appendLog('GOD_MODE_KERNEL initialized. Privileged enclave active.', 'gold');
    fetchUsers();
  }, [fetchUsers, appendLog]);

  // If unauthenticated, stealth disguise: Render true 404 Page Not Found component
  if (isUnauthenticated) {
    return (
      <NotFoundScreen
        navigation={navigation}
        onGoHome={() => {
          if (navigation && navigation.navigate) {
            navigation.navigate('Home');
          }
        }}
      />
    );
  }

  // The Override Switch (Unlimited Free Access / Bypass Paywall)
  const handleGrantGodAccess = async (user, action = 'grant') => {
    if (!user) return;
    const identifier = user.id || user.email;
    setActionLoadingId(identifier);

    try {
      const token = await getAuthToken();
      const baseUrl = getBaseUrl();

      const response = await fetch(`${baseUrl}/api/admin/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          email: user.originalEmail || user.email,
          overrideStatus: 'Premium_Lifetime',
          action
        })
      });

      if (!response.ok) {
        appendLog(`OVERRIDE_FAILED for ${user.email} (HTTP ${response.status})`, 'error');
        return;
      }

      const data = await response.json();

      if (data && data.success) {
        const isGrant = action === 'grant';
        appendLog(
          isGrant
            ? `OVERRIDE_COMMITTED: God Access granted to [${user.email}]. Lifetime bypass active.`
            : `OVERRIDE_COMMITTED: God Access revoked for [${user.email}]. Reverted to free.`,
          isGrant ? 'gold' : 'info'
        );

        // Optimistically update table row
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === user.id || (user.email && u.email === user.email)) {
              return {
                ...u,
                is_premium: isGrant,
                is_god_mode: isGrant,
                subscription_tier: isGrant ? 'Premium_Lifetime' : 'free',
                plan_type: isGrant ? 'Premium_Lifetime' : 'free'
              };
            }
            return u;
          })
        );
      }
    } catch (err) {
      appendLog(`OVERRIDE_EXCEPTION: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Manual Override for any email address
  const handleManualEmailOverride = async () => {
    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      appendLog('INVALID_TARGET: Enter a valid email address.', 'error');
      return;
    }

    setManualLoading(true);
    const target = manualEmail.trim();

    try {
      const token = await getAuthToken();
      const baseUrl = getBaseUrl();

      const response = await fetch(`${baseUrl}/api/admin/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          email: target,
          overrideStatus: 'Premium_Lifetime',
          action: 'grant'
        })
      });

      if (!response.ok) {
        appendLog(`OVERRIDE_FAILED for ${target} (HTTP ${response.status})`, 'error');
        return;
      }

      const data = await response.json();
      if (data && data.success) {
        appendLog(`OVERRIDE_COMMITTED: Direct God Access granted to ${target}!`, 'gold');
        setManualEmail('');
        fetchUsers(true);
      }
    } catch (err) {
      appendLog(`MANUAL_OVERRIDE_EXCEPTION: ${err.message}`, 'error');
    } finally {
      setManualLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@councilx_admin_jwt');
      await AsyncStorage.removeItem('@councilx_admin_email');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.sessionStorage.removeItem('@councilx_admin_jwt');
        // Clear cookie
        document.cookie = 'councilx_admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        window.history.replaceState(null, '', '/');
      }
    } catch (e) {}

    if (onLogout) {
      onLogout();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Home');
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.subscription_tier && u.subscription_tier.toLowerCase().includes(q))
    );
  });

  const godModeCount = users.filter((u) => u.is_god_mode || u.is_premium).length;

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Terminal Title Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.topPrompt}>
            root@councilx-core:~# ./god_mode --live
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.terminalBtn}
            onPress={() => fetchUsers(true)}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#D4AF37" />
            ) : (
              <Text style={styles.terminalBtnText}>[ ⟳ REFRESH STREAM ]</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.terminalBtn, styles.logoutBtn]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={[styles.terminalBtnText, styles.logoutBtnText]}>
              [ ✕ TERMINATE SESSION ]
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentInner}>
        {/* Terminal Telemetry Banner */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Text style={styles.goldHeader}>
              &gt; COUNCIL X // GOD_MODE_KERNEL v4.2.0 [PRIVILEGED_ROOT]
            </Text>
            <Text style={styles.systemStatusText}>
              HOST: SUPABASE_REALTIME_DB // ENCRYPTION: 256-BIT SHA
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL IDENTITIES</Text>
              <Text style={styles.statValue}>{users.length}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GOD_MODE OVERRIDES</Text>
              <Text style={[styles.statValue, styles.goldText]}>{godModeCount}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PAYWALL BYPASS</Text>
              <Text style={[styles.statValue, styles.greenText]}>ARMED // 100%</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AUTHENTICATED ADMIN</Text>
              <Text style={styles.statSubValue} numberOfLines={1}>
                {adminEmail || 'kernel@councilx.ai'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Email Override Bar */}
        <View style={styles.quickOverrideCard}>
          <Text style={styles.sectionTitle}>
            &gt; DIRECT INJECTION: OVERRIDE BY TARGET EMAIL
          </Text>
          <View style={styles.quickOverrideRow}>
            <TextInput
              style={styles.quickInput}
              value={manualEmail}
              onChangeText={setManualEmail}
              placeholder="target_user@domain.com"
              placeholderTextColor="#3A3A3A"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.quickGrantBtn}
              onPress={handleManualEmailOverride}
              disabled={manualLoading}
              activeOpacity={0.85}
            >
              {manualLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.quickGrantBtnText}>[ Grant God Access ]</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* User Search & Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterPrompt}>&gt; grep -i user:</Text>
          <TextInput
            style={styles.filterInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="filter by email, id, tier..."
            placeholderTextColor="#3A3A3A"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>[clear]</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* User Table Header */}
        <View style={styles.tableCard}>
          <View style={styles.tableHead}>
            <Text style={[styles.thText, styles.colEmail]}>USER EMAIL</Text>
            <Text style={[styles.thText, styles.colDate]}>JOIN DATE</Text>
            <Text style={[styles.thText, styles.colStatus]}>STATUS</Text>
            <Text style={[styles.thText, styles.colActions]}>THE OVERRIDE SWITCH</Text>
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.loadingText}>FETCHING SUPABASE IDENTITIES...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>-- NO MATCHING USER IDENTITIES IN STREAM --</Text>
            </View>
          ) : (
            filteredUsers.map((user, idx) => {
              const isOverridden =
                user.is_god_mode ||
                user.subscription_tier === 'Premium_Lifetime' ||
                user.plan_type === 'Premium_Lifetime';
              const isPremium = user.is_premium || isOverridden;
              const isBusy = actionLoadingId === (user.id || user.email);

              return (
                <View
                  key={user.id || `user_${idx}`}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 && styles.tableRowAlt,
                    isOverridden && styles.tableRowGodMode
                  ]}
                >
                  {/* Column 1: User Email */}
                  <View style={styles.colEmail}>
                    <Text style={styles.userEmailText} numberOfLines={1}>
                      {user.email}
                    </Text>
                    {user.id ? (
                      <Text style={styles.userIdSub} numberOfLines={1}>
                        UID: {user.id}
                      </Text>
                    ) : null}
                  </View>

                  {/* Column 2: Join Date */}
                  <View style={styles.colDate}>
                    <Text style={styles.dateText}>{formatDate(user.created_at)}</Text>
                  </View>

                  {/* Column 3: Subscription Status */}
                  <View style={styles.colStatus}>
                    {isOverridden ? (
                      <View style={styles.badgeGodMode}>
                        <Text style={styles.badgeGodModeText}>★ PREMIUM LIFETIME</Text>
                      </View>
                    ) : isPremium ? (
                      <View style={styles.badgePremium}>
                        <Text style={styles.badgePremiumText}>PREMIUM ({user.subscription_tier || 'active'})</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeFree}>
                        <Text style={styles.badgeFreeText}>FREE TIER</Text>
                      </View>
                    )}
                  </View>

                  {/* Column 4: The Override Switch */}
                  <View style={styles.colActions}>
                    {isOverridden ? (
                      <View style={styles.actionGroup}>
                        <View style={styles.activeTag}>
                          <Text style={styles.activeTagText}>✓ GOD ACCESS ACTIVE</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.revokeBtn}
                          onPress={() => handleGrantGodAccess(user, 'revoke')}
                          disabled={isBusy}
                          activeOpacity={0.8}
                        >
                          {isBusy ? (
                            <ActivityIndicator size="small" color="#FF4444" />
                          ) : (
                            <Text style={styles.revokeBtnText}>[ Revoke ]</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.grantGodBtn, isBusy && styles.btnDisabled]}
                        onPress={() => handleGrantGodAccess(user, 'grant')}
                        disabled={isBusy}
                        activeOpacity={0.85}
                      >
                        {isBusy ? (
                          <ActivityIndicator size="small" color="#D4AF37" />
                        ) : (
                          <Text style={styles.grantGodBtnText}>[ Grant God Access ]</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Live Kernel Terminal Log Stream */}
        <View style={styles.terminalLogCard}>
          <Text style={styles.logHeader}>&gt; KERNEL_AUDIT_LOG_STREAM (TAIL -F)</Text>
          <ScrollView style={styles.logScroll} nestedScrollEnabled>
            {systemLogs.map((log) => (
              <View key={log.id} style={styles.logLine}>
                <Text style={styles.logTime}>[{log.time}]</Text>
                <Text
                  style={[
                    styles.logMsg,
                    log.type === 'gold' && styles.logGold,
                    log.type === 'success' && styles.logGreen,
                    log.type === 'error' && styles.logRed
                  ]}
                >
                  {log.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#050505',
    flexWrap: 'wrap',
    gap: 12
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF66'
  },
  topPrompt: {
    fontSize: 12,
    color: '#00FF66',
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  terminalBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#0A0A0A',
    borderRadius: 2
  },
  terminalBtnText: {
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  logoutBtn: {
    borderColor: '#441111'
  },
  logoutBtnText: {
    color: '#FF5555'
  },
  contentScroll: {
    flex: 1
  },
  contentInner: {
    padding: 20,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center'
  },
  telemetryCard: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    padding: 16,
    borderRadius: 2,
    marginBottom: 16
  },
  telemetryHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
    paddingBottom: 8
  },
  goldHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 2,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginBottom: 2
  },
  systemStatusText: {
    fontSize: 10,
    color: '#666666',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#191919',
    padding: 10,
    borderRadius: 2
  },
  statLabel: {
    fontSize: 9,
    color: '#777777',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginBottom: 4
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  statSubValue: {
    fontSize: 11,
    color: '#D4AF37',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginTop: 4
  },
  goldText: {
    color: '#D4AF37'
  },
  greenText: {
    color: '#00FF66'
  },
  quickOverrideCard: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#242424',
    padding: 14,
    borderRadius: 2,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: 1.5,
    fontWeight: '700',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginBottom: 8
  },
  quickOverrideRow: {
    flexDirection: 'row',
    gap: 10
  },
  quickInput: {
    flex: 1,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    borderRadius: 2
  },
  quickGrantBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2
  },
  quickGrantBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14
  },
  filterPrompt: {
    fontSize: 11,
    color: '#888888',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  filterInput: {
    flex: 1,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#242424',
    color: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    borderRadius: 2
  },
  clearSearchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  clearSearchText: {
    fontSize: 10,
    color: '#666666',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  tableCard: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  thText: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  colEmail: {
    flex: 3,
    paddingRight: 10
  },
  colDate: {
    flex: 2,
    paddingRight: 10
  },
  colStatus: {
    flex: 2,
    paddingRight: 10
  },
  colActions: {
    flex: 2.5,
    alignItems: 'flex-start'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#121212'
  },
  tableRowAlt: {
    backgroundColor: '#020202'
  },
  tableRowGodMode: {
    backgroundColor: '#0A0802'
  },
  userEmailText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  userIdSub: {
    fontSize: 9,
    color: '#444444',
    marginTop: 2,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  dateText: {
    fontSize: 11,
    color: '#888888',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  badgeGodMode: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 2,
    alignSelf: 'flex-start'
  },
  badgeGodModeText: {
    fontSize: 9,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  badgePremium: {
    borderWidth: 1,
    borderColor: '#00FF66',
    backgroundColor: 'rgba(0, 255, 102, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 2,
    alignSelf: 'flex-start'
  },
  badgePremiumText: {
    fontSize: 9,
    color: '#00FF66',
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  badgeFree: {
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#0B0B0B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 2,
    alignSelf: 'flex-start'
  },
  badgeFreeText: {
    fontSize: 9,
    color: '#777777',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  grantGodBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 2
  },
  btnDisabled: {
    opacity: 0.6
  },
  grantGodBtnText: {
    fontSize: 10,
    color: '#D4AF37',
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  activeTag: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  activeTagText: {
    fontSize: 10,
    color: '#00FF66',
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  revokeBtn: {
    borderWidth: 1,
    borderColor: '#331111',
    backgroundColor: '#0F0505',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 2
  },
  revokeBtnText: {
    fontSize: 9,
    color: '#FF6666',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  centerLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 11,
    color: '#D4AF37',
    letterSpacing: 1.5,
    marginTop: 12,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 11,
    color: '#555555',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  terminalLogCard: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#191919',
    padding: 14,
    borderRadius: 2
  },
  logHeader: {
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1.5,
    fontWeight: '700',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginBottom: 8
  },
  logScroll: {
    maxHeight: 140
  },
  logLine: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 3
  },
  logTime: {
    fontSize: 10,
    color: '#444444',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  logMsg: {
    fontSize: 10,
    color: '#888888',
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  logGold: {
    color: '#D4AF37'
  },
  logGreen: {
    color: '#00FF66'
  },
  logRed: {
    color: '#FF5555'
  }
});
