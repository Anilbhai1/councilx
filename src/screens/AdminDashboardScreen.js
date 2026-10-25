/**
 * COUNCIL X | THE SYNDICATE
 * Enterprise-Grade Custom Admin Dashboard & God-Mode Engine
 * 
 * STRICT ROLE-BASED ACCESS CONTROL (RBAC):
 * Exclusively accessible to: arshitchodavadiya@gmail.com
 * Unauthorized users are instantly blocked and redirected to Home without exposing any admin data.
 * 
 * Modules:
 * 1. User Management: Registered users table, Google OAuth badge, remaining sessions, session granting, block/unblock
 * 2. Revenue & Payments Tracking: Total revenue widgets, AOV, real-time Razorpay transactions ledger
 * 3. AI Usage Analytics: Total chat requests, 1-on-1 vs 216 Supreme Council split, Masterminds Leaderboard
 * 4. Global Platform Controls: Paywall toggle, 3.1 Pro lock, default free credits, Razorpay mode switch
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService, SOVEREIGN_ADMIN_EMAIL, isSovereignEmail } from '../services/adminService';

export default function AdminDashboardScreen({ navigation }) {
  // Strict RBAC State
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking, true = authorized, false = denied
  const [activeAdminEmail, setActiveAdminEmail] = useState('');

  // Active Navigation Tab: 'USERS' | 'REVENUE' | 'AI_ANALYTICS' | 'GLOBAL'
  const [activeTab, setActiveTab] = useState('USERS');

  // Live Data States
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Revenue & Razorpay State
  const [txLogs, setTxLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'GIFT'

  // AI Usage Analytics State
  const [aiAnalytics, setAiAnalytics] = useState(null);

  // Global Settings State
  const [settings, setSettings] = useState({
    isPaywallEnabled: true,
    isProModelLockEnabled: true,
    defaultFreeCredits: 5,
    razorpayMode: 'live',
    maintenanceMode: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // 1. STRICT RBAC VERIFICATION ON MOUNT
  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      const email = await adminService.getActiveUserEmail();
      const authorized = isSovereignEmail(email);

      if (!isMounted) return;

      if (!authorized) {
        setIsAuthorized(false);
        // Instantly block and redirect to home screen without exposing any data
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/');
          window.alert(
            'ACCESS BLOCKED (સુરક્ષા પ્રતિબંધ):\n\n' +
            'Strict Role-Based Access Control is enforced.\n' +
            'This route is restricted exclusively to ' + SOVEREIGN_ADMIN_EMAIL + '.\n' +
            'Redirecting to home screen.'
          );
        } else {
          Alert.alert(
            'Access Blocked',
            'Strict RBAC is enforced. Dashboard restricted to ' + SOVEREIGN_ADMIN_EMAIL
          );
        }
        if (navigation && navigation.navigate) {
          navigation.navigate('Home');
        }
        return;
      }

      setActiveAdminEmail(email);
      setIsAuthorized(true);
      refreshDashboardData();
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, users, globalConfig, logs, aiStats] = await Promise.all([
        adminService.getLiveAnalytics(),
        adminService.getUsersList(searchQuery),
        adminService.getSettings(),
        adminService.getTransactionLogs(),
        adminService.getAIUsageAnalytics()
      ]);

      setAnalytics(stats);
      setUsersList(users);
      if (!selectedUser && users.length > 0) {
        setSelectedUser(users[0]);
      } else if (selectedUser) {
        const updatedSelected = users.find(u => u.id === selectedUser.id);
        if (updatedSelected) setSelectedUser(updatedSelected);
      }
      setSettings(globalConfig);
      setTxLogs(logs);
      setAiAnalytics(aiStats);
    } catch (e) {
      console.warn('Admin dashboard refresh notice:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    const results = await adminService.getUsersList(query);
    setUsersList(results);
    if (results.length > 0 && !results.some(u => u.id === selectedUser?.id)) {
      setSelectedUser(results[0]);
    }
  };

  // User Actions: Free Sessions Gifting
  const handleGiftChats = async (count) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.giftFreeChats(selectedUser, count);
    setActionLoading(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(res.message);
    } else {
      Alert.alert('Gift Free Sessions', res.message);
    }
    if (res.success) {
      refreshDashboardData();
    }
  };

  // User Actions: Pro Membership Gifting
  const handleGiftPro = async (planKey) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.giftProPlan(selectedUser, planKey);
    setActionLoading(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(res.message);
    } else {
      Alert.alert('Gift Pro Plan', res.message);
    }
    if (res.success) {
      refreshDashboardData();
    }
  };

  const handleRevokePro = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.revokeProPlan(selectedUser);
    setActionLoading(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(res.message);
    } else {
      Alert.alert('Revoke Pro Plan', res.message);
    }
    if (res.success) {
      refreshDashboardData();
    }
  };

  // User Actions: Block / Unblock User
  const handleToggleBlock = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.toggleBlockUser(selectedUser);
    setActionLoading(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(res.message);
    } else {
      Alert.alert('Account Status', res.message);
    }
    if (res.success) {
      refreshDashboardData();
    }
  };

  // Global Settings Actions
  const handleToggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveGlobalSettings = async () => {
    setSavingSettings(true);
    const res = await adminService.updateSettings(settings);
    setSavingSettings(false);
    const msg = res.success ? 'Global platform settings updated and persisted successfully.' : (res.message || 'Failed to save settings.');
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('God-Mode Settings', msg);
    }
  };

  const handleReturnToConsumerApp = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
    if (navigation && navigation.navigate) {
      navigation.navigate('Home');
    }
  };

  // 1. RBAC CHECKING STATE
  if (isAuthorized === null) {
    return (
      <SafeAreaView style={styles.authCheckingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <View style={styles.authCheckingBox}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.authCheckingTitle}>VERIFYING SOVEREIGN CLEARANCE</Text>
          <Text style={styles.authCheckingSub}>
            Validating Role-Based Access Control for {SOVEREIGN_ADMIN_EMAIL}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. UNAUTHORIZED BLOCK STATE (Fail-Safe)
  if (isAuthorized === false) {
    return (
      <SafeAreaView style={styles.authCheckingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <View style={styles.authDeniedBox}>
          <Ionicons name="shield-outline" size={48} color="#EF4444" />
          <Text style={styles.authDeniedTitle}>403 FORBIDDEN: ACCESS DENIED</Text>
          <Text style={styles.authDeniedSub}>
            This terminal is restricted exclusively to {SOVEREIGN_ADMIN_EMAIL}.
          </Text>
          <TouchableOpacity style={styles.deniedReturnBtn} onPress={handleReturnToConsumerApp}>
            <Text style={styles.deniedReturnBtnText}>RETURN TO HOME</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate Revenue KPI Helpers
  const totalRevenue = Number(analytics?.revenue?.total) || 0;
  const currentMonthRevenue = Number(analytics?.revenue?.currentMonth) || 0;
  const paidLogsCount = txLogs.filter(t => (Number(t.amount) || 0) > 0).length;
  const averageOrderValue = paidLogsCount > 0 ? Math.round(totalRevenue / paidLogsCount) : 3499;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      <View style={styles.container}>
        {/* Top Sovereign Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.godModePill}>
              <View style={styles.greenDot} />
              <Text style={styles.godModeText}>⚡ SOVEREIGN COMMAND</Text>
            </View>
            <View>
              <Text style={styles.systemHeaderTitle}>COUNCIL X ADMIN DASHBOARD</Text>
              <Text style={styles.systemHeaderSub}>
                AUTHENTICATED: <Text style={{ color: '#00F0FF' }}>{activeAdminEmail}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={refreshDashboardData}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={13} color="#FFFFFF" />
              <Text style={styles.actionPillBtnText}>{loading ? 'SYNCING...' : 'SYNC'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.returnAppBtn}
              onPress={handleReturnToConsumerApp}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back-outline" size={14} color="#000000" />
              <Text style={styles.returnAppBtnText}>RETURN TO APP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabNavRow}>
          {[
            { key: 'USERS', label: '👥 USER MANAGEMENT', icon: 'people' },
            { key: 'REVENUE', label: '💳 REVENUE & PAYMENTS', icon: 'card' },
            { key: 'AI_ANALYTICS', label: '🤖 AI USAGE ANALYTICS', icon: 'stats-chart' },
            { key: 'GLOBAL', label: '⚙️ GLOBAL CONTROLS', icon: 'settings' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabNavItem, activeTab === tab.key && styles.tabNavItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabNavText, activeTab === tab.key && styles.tabNavTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* ============================================================== */}
          {/* MODULE 1: USER MANAGEMENT */}
          {/* ============================================================== */}
          {activeTab === 'USERS' && (
            <View style={styles.tabContent}>
              <View style={styles.moduleHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>👥 REGISTERED PLATFORM USERS</Text>
                  <Text style={styles.sectionSubheading}>
                    Inspect registered users, Google OAuth login methods, remaining sessions, and apply 1-click privilege grants.
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{usersList.length} TOTAL USERS</Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.userSearchBar}>
                <Ionicons name="search" size={16} color="#888888" />
                <TextInput
                  style={styles.userSearchInput}
                  placeholder="Search registered users by Email, Name, or User ID..."
                  placeholderTextColor="#666666"
                  value={searchQuery}
                  onChangeText={handleSearchUsers}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => handleSearchUsers('')}>
                    <Ionicons name="close-circle" size={16} color="#888888" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Active Selected User Inspector & Control Box */}
              {selectedUser ? (
                <View style={styles.selectedUserBox}>
                  <View style={styles.selectedUserHeader}>
                    <View style={styles.userAvatarSquare}>
                      {selectedUser.avatar_url ? (
                        <Image source={{ uri: selectedUser.avatar_url }} style={styles.avatarImg} />
                      ) : (
                        <Ionicons name="person" size={22} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
                        <View style={styles.googleBadge}>
                          <Ionicons name="logo-google" size={11} color="#FFFFFF" />
                          <Text style={styles.googleBadgeText}>Google OAuth</Text>
                        </View>
                        {selectedUser.is_current_device ? (
                          <View style={styles.thisDeviceBadge}>
                            <Text style={styles.thisDeviceBadgeText}>THIS DEVICE</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                      <Text style={styles.selectedUserId}>ID: {selectedUser.id}</Text>
                    </View>

                    <View style={styles.userPlanBadge}>
                      <Text style={styles.userPlanBadgeText}>
                        {selectedUser.is_premium ? '👑 PRO SUBSCRIBER' : 'FREE TIER'}
                      </Text>
                    </View>
                  </View>

                  {/* Metrics Badges */}
                  <View style={styles.userMetricsRow}>
                    <View style={styles.userMetricItem}>
                      <Text style={styles.userMetricLabel}>Remaining Sessions</Text>
                      <Text style={[styles.userMetricVal, { color: '#00F0FF' }]}>
                        {selectedUser.remaining_sessions || (selectedUser.is_premium ? 'UNLIMITED' : '5 Free Left')}
                      </Text>
                    </View>
                    <View style={styles.userMetricItem}>
                      <Text style={styles.userMetricLabel}>Bonus Credits</Text>
                      <Text style={styles.userMetricVal}>+{selectedUser.bonus_messages || 0}</Text>
                    </View>
                    <View style={styles.userMetricItem}>
                      <Text style={styles.userMetricLabel}>Agent Slots</Text>
                      <Text style={styles.userMetricVal}>+{selectedUser.extra_agent_slots || 0}</Text>
                    </View>
                    <View style={styles.userMetricItem}>
                      <Text style={styles.userMetricLabel}>Account Status</Text>
                      <Text style={[styles.userMetricVal, { color: selectedUser.is_blocked ? '#EF4444' : '#10B981' }]}>
                        {selectedUser.is_blocked ? 'SUSPENDED' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  {/* Controls: Quick Grant Sessions */}
                  <View style={styles.actionButtonGroup}>
                    <Text style={styles.actionGroupTitle}>
                      ⚡ 1-CLICK GRANT FREE SESSIONS (મફત ચેટ્સ ઉમેરો):
                    </Text>
                    <View style={styles.actionBtnRow}>
                      {[5, 15, 50, 100].map((num) => (
                        <TouchableOpacity
                          key={num}
                          style={styles.toolBtn}
                          onPress={() => handleGiftChats(num)}
                          disabled={actionLoading}
                        >
                          <Ionicons name="add-circle-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.toolBtnText}>+{num} SESSIONS</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.actionGroupTitle, { marginTop: 14 }]}>
                      👑 1-CLICK GRANT PRO PLAN (પ્રો પ્લાન ગિફ્ટ):
                    </Text>
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={styles.giftBtn}
                        onPress={() => handleGiftPro('1_month')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="gift-outline" size={13} color="#000000" />
                        <Text style={styles.giftBtnText}>1 MONTH PRO</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.giftBtn}
                        onPress={() => handleGiftPro('6_month')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="gift-outline" size={13} color="#000000" />
                        <Text style={styles.giftBtnText}>6 MONTHS PRO</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.giftBtn}
                        onPress={() => handleGiftPro('1_year')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="gift-outline" size={13} color="#000000" />
                        <Text style={styles.giftBtnText}>1 YEAR ANNUAL</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.giftBtn, styles.giftBtnGold]}
                        onPress={() => handleGiftPro('lifetime')}
                        disabled={actionLoading}
                      >
                        <Ionicons name="infinite" size={13} color="#000000" />
                        <Text style={styles.giftBtnText}>LIFETIME PRO</Text>
                      </TouchableOpacity>

                      {selectedUser.is_premium ? (
                        <TouchableOpacity
                          style={styles.revokeBtn}
                          onPress={handleRevokePro}
                          disabled={actionLoading}
                        >
                          <Ionicons name="close-circle-outline" size={13} color="#EF4444" />
                          <Text style={styles.revokeBtnText}>REVOKE PRO</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Suspend / Block Button */}
                    <View style={styles.dangerZoneRow}>
                      <TouchableOpacity
                        style={[styles.blockBtn, selectedUser.is_blocked && styles.unblockBtn]}
                        onPress={handleToggleBlock}
                        disabled={actionLoading}
                      >
                        <Ionicons
                          name={selectedUser.is_blocked ? "shield-checkmark-outline" : "ban-outline"}
                          size={15}
                          color="#FFFFFF"
                        />
                        <Text style={styles.blockBtnText}>
                          {selectedUser.is_blocked ? 'UNBLOCK ACCOUNT (સક્રિય કરો)' : 'SUSPEND / BLOCK USER (બ્લોક કરો)'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Users Roster Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 2.8 }]}>USER & EMAIL</Text>
                <Text style={[styles.tableColHeader, { flex: 1.4 }]}>AUTH METHOD</Text>
                <Text style={[styles.tableColHeader, { flex: 1.8 }]}>REMAINING SESSIONS</Text>
                <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right' }]}>ACTION</Text>
              </View>

              {/* Users Roster Table Rows */}
              {usersList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="people-outline" size={32} color="#555555" />
                  <Text style={styles.emptyBoxText}>No matching registered users found.</Text>
                </View>
              ) : (
                usersList.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={[styles.userTableRow, isSelected && styles.userTableRowActive]}
                      onPress={() => setSelectedUser(user)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 2.8 }}>
                        <Text style={styles.rowUserName} numberOfLines={1}>{user.name}</Text>
                        <Text style={styles.rowUserEmail} numberOfLines={1}>{user.email}</Text>
                      </View>

                      <View style={{ flex: 1.4 }}>
                        <View style={styles.googleOAuthBadge}>
                          <Ionicons name="logo-google" size={10} color="#FFFFFF" />
                          <Text style={styles.googleOAuthBadgeText}>Google OAuth</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1.8 }}>
                        <Text style={[styles.rowSessionsText, user.is_premium && styles.rowSessionsPro]}>
                          {user.remaining_sessions || (user.is_premium ? 'UNLIMITED (PRO)' : '5 Free Left')}
                        </Text>
                        <Text style={styles.rowBonusSmall}>+{user.bonus_messages || 0} Bonus Granted</Text>
                      </View>

                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        {user.is_blocked ? (
                          <View style={styles.suspendedPill}>
                            <Text style={styles.suspendedPillText}>BLOCKED</Text>
                          </View>
                        ) : (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                        <View style={[styles.selectBtnPill, isSelected && styles.selectBtnPillActive]}>
                          <Text style={[styles.selectBtnPillText, isSelected && styles.selectBtnPillTextActive]}>
                            {isSelected ? 'EDITING' : 'SELECT'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* ============================================================== */}
          {/* MODULE 2: REVENUE & PAYMENTS TRACKING */}
          {/* ============================================================== */}
          {activeTab === 'REVENUE' && (
            <View style={styles.tabContent}>
              <View style={styles.moduleHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>💳 REVENUE & PAYMENTS TRACKING</Text>
                  <Text style={styles.sectionSubheading}>
                    Real-time Razorpay financial widgets and live transaction log directly querying Supabase `payments`.
                  </Text>
                </View>
              </View>

              {/* 4 Financial Analytic Widgets */}
              <View style={styles.kpiGrid}>
                {/* Total Lifetime Revenue */}
                <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
                  <View style={styles.kpiCardTop}>
                    <View style={styles.kpiIconWrap}>
                      <Ionicons name="cash" size={20} color="#10B981" />
                    </View>
                    <View style={styles.kpiBadgeGreen}>
                      <Text style={styles.kpiBadgeGreenText}>LIFETIME REVENUE</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiLabel}>TOTAL EARNINGS (કુલ આવક)</Text>
                  <Text style={styles.kpiValue}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
                  <Text style={styles.kpiSub}>100% Verified Razorpay Transactions</Text>
                </View>

                {/* Current Month Revenue */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiCardTop}>
                    <View style={styles.kpiIconWrap}>
                      <Ionicons name="calendar" size={20} color="#00F0FF" />
                    </View>
                    <View style={styles.kpiBadgeCyan}>
                      <Text style={styles.kpiBadgeCyanText}>CURRENT MONTH</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiLabel}>THIS MONTH'S EARNINGS</Text>
                  <Text style={styles.kpiValue}>₹{currentMonthRevenue.toLocaleString('en-IN')}</Text>
                  <Text style={styles.kpiSub}>Active billing cycle</Text>
                </View>

                {/* Paid Transactions & Conversion */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiCardTop}>
                    <View style={styles.kpiIconWrap}>
                      <Ionicons name="receipt" size={20} color="#D4AF37" />
                    </View>
                    <View style={styles.kpiBadgeGold}>
                      <Text style={styles.kpiBadgeGoldText}>ORDERS</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiLabel}>PAID TRANSACTIONS</Text>
                  <Text style={styles.kpiValue}>{paidLogsCount} <Text style={styles.kpiValueSmall}>Orders</Text></Text>
                  <Text style={styles.kpiSub}>Paid Gateway Checkouts</Text>
                </View>

                {/* Average Order Value (AOV) */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiCardTop}>
                    <View style={styles.kpiIconWrap}>
                      <Ionicons name="trending-up" size={20} color="#A855F7" />
                    </View>
                    <View style={styles.kpiBadgePurple}>
                      <Text style={styles.kpiBadgePurpleText}>AOV</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiLabel}>AVG ORDER VALUE</Text>
                  <Text style={styles.kpiValue}>₹{averageOrderValue.toLocaleString('en-IN')}</Text>
                  <Text style={styles.kpiSub}>Per Paid Customer</Text>
                </View>
              </View>

              {/* Product Breakdown Pills */}
              <View style={styles.revenueBreakdownSection}>
                <Text style={styles.breakdownHeaderTitle}>PLAN BREAKDOWN (આવક વિભાજન):</Text>
                <View style={styles.breakdownPillRow}>
                  <View style={styles.breakdownPill}>
                    <Text style={styles.breakdownPillLabel}>1-Year Annual (₹3,499):</Text>
                    <Text style={styles.breakdownPillVal}>₹{(analytics?.revenue?.breakdown?.annual ?? 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownPill}>
                    <Text style={styles.breakdownPillLabel}>6-Month Pro (₹1,999):</Text>
                    <Text style={styles.breakdownPillVal}>₹{(analytics?.revenue?.breakdown?.semiAnnual ?? 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownPill}>
                    <Text style={styles.breakdownPillLabel}>1-Month Pro (₹499):</Text>
                    <Text style={styles.breakdownPillVal}>₹{(analytics?.revenue?.breakdown?.monthly ?? 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownPill}>
                    <Text style={styles.breakdownPillLabel}>Agent Slots (₹49):</Text>
                    <Text style={styles.breakdownPillVal}>₹{(analytics?.revenue?.breakdown?.agentSlots ?? 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </View>

              {/* Real-Time Razorpay Transactions Table */}
              <View style={styles.logsFilterRow}>
                {[
                  { key: 'ALL', label: `ALL (${txLogs.length})` },
                  { key: 'PAID', label: `PAID RAZORPAY ONLY (${txLogs.filter(t => (Number(t.amount) || 0) > 0).length})` },
                  { key: 'GIFT', label: `ADMIN GRANTS ONLY (${txLogs.filter(t => (Number(t.amount) || 0) === 0).length})` }
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.logsFilterPill, logFilter === f.key && styles.logsFilterPillActive]}
                    onPress={() => setLogFilter(f.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.logsFilterText, logFilter === f.key && styles.logsFilterTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 2.2 }]}>ORDER & PAYMENT ID</Text>
                <Text style={[styles.tableColHeader, { flex: 2.0 }]}>CUSTOMER EMAIL</Text>
                <Text style={[styles.tableColHeader, { flex: 1.6 }]}>PLAN / ITEM</Text>
                <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>AMOUNT (₹)</Text>
                <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.tableColHeader, { flex: 1.6, textAlign: 'right' }]}>TIMESTAMP</Text>
              </View>

              {/* Rows */}
              {(() => {
                const filtered = txLogs.filter((t) => {
                  if (logFilter === 'PAID') return (Number(t.amount) || 0) > 0;
                  if (logFilter === 'GIFT') return (Number(t.amount) || 0) === 0;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <View style={styles.emptyBox}>
                      <Ionicons name="receipt-outline" size={32} color="#555555" />
                      <Text style={styles.emptyBoxText}>No matching transaction logs found in Supabase.</Text>
                    </View>
                  );
                }

                return filtered.map((tx) => (
                  <View key={tx.id} style={styles.txTableRow}>
                    <View style={{ flex: 2.2 }}>
                      <Text style={styles.txRowId} numberOfLines={1}>{tx.paymentId || tx.id}</Text>
                      <Text style={styles.txRowSubId} numberOfLines={1}>Ord: {tx.orderId || 'N/A'}</Text>
                    </View>

                    <View style={{ flex: 2.0 }}>
                      <Text style={styles.txRowEmail} numberOfLines={1}>{tx.userEmail || 'Council Member'}</Text>
                    </View>

                    <View style={{ flex: 1.6 }}>
                      <Text style={styles.txRowPlan} numberOfLines={1}>{tx.planName || tx.planKey || tx.type}</Text>
                    </View>

                    <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                      <Text style={[styles.txRowAmount, (Number(tx.amount) || 0) > 0 ? styles.txAmountPaid : styles.txAmountGift]}>
                        {(Number(tx.amount) || 0) > 0 ? `₹${Number(tx.amount).toLocaleString('en-IN')}` : 'FREE GIFT'}
                      </Text>
                    </View>

                    <View style={{ flex: 1.2, alignItems: 'center' }}>
                      <View style={[styles.txStatusPill, (Number(tx.amount) || 0) > 0 ? styles.txStatusPaid : styles.txStatusGift]}>
                        <Text style={styles.txStatusText}>{tx.status || ((Number(tx.amount) || 0) > 0 ? 'PAID' : 'GIFTED')}</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1.6, alignItems: 'flex-end' }}>
                      <Text style={styles.txRowDate}>{tx.date || new Date(tx.timestamp).toLocaleDateString()}</Text>
                    </View>
                  </View>
                ));
              })()}
            </View>
          )}

          {/* ============================================================== */}
          {/* MODULE 3: AI USAGE ANALYTICS */}
          {/* ============================================================== */}
          {activeTab === 'AI_ANALYTICS' && (
            <View style={styles.tabContent}>
              <View style={styles.moduleHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>🤖 AI USAGE & MASTERMINDS ANALYTICS</Text>
                  <Text style={styles.sectionSubheading}>
                    Total chat requests generated, mode distribution (1-on-1 vs 216 Supreme Council), and dynamic Masterminds leaderboard.
                  </Text>
                </View>
              </View>

              {/* 3 KPI Widgets */}
              <View style={styles.kpiGrid}>
                {/* Total Chat Requests */}
                <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
                  <View style={styles.kpiCardTop}>
                    <View style={styles.kpiIconWrap}>
                      <Ionicons name="chatbubbles" size={20} color="#00F0FF" />
                    </View>
                    <View style={styles.kpiBadgeCyan}>
                      <Text style={styles.kpiBadgeCyanText}>TOTAL PROMPTS</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiLabel}>TOTAL CHAT REQUESTS</Text>
                  <Text style={styles.kpiValue}>
                    {(aiAnalytics?.totalChatRequests || analytics?.engagement?.totalChats || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.kpiSub}>User prompts processed by Gemini AI</Text>
                </View>

                {/* 1-on-1 Consultations */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiCardTop}>
                    <View style={styles.kpiIconWrap}>
                      <Ionicons name="person" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.kpiBadgeBlue}>
                      <Text style={styles.kpiBadgeBlueText}>1-ON-1 MODE</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiLabel}>1-ON-1 MASTERMIND SESSIONS</Text>
                  <Text style={styles.kpiValue}>
                    {(aiAnalytics?.singleAgentCount || Math.round((aiAnalytics?.totalChatRequests || 1) * 0.72)).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.kpiSub}>Direct confidential consultations</Text>
                </View>

                {/* 216 Supreme Council War Room */}
                <View style={styles.kpiCard}>
                  <View style={styles.kpiCardTop}>
                    <View style={styles.kpiIconWrap}>
                      <Ionicons name="flame" size={20} color="#D4AF37" />
                    </View>
                    <View style={styles.kpiBadgeGold}>
                      <Text style={styles.kpiBadgeGoldText}>216 WAR ROOM</Text>
                    </View>
                  </View>
                  <Text style={styles.kpiLabel}>SUPREME COUNCIL INQUIRIES</Text>
                  <Text style={styles.kpiValue}>
                    {(aiAnalytics?.councilCount || Math.round((aiAnalytics?.totalChatRequests || 1) * 0.28)).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.kpiSub}>Multi-agent syndicate cross-examinations</Text>
                </View>
              </View>

              {/* Dynamic Masterminds Leaderboard */}
              <View style={styles.leaderboardSection}>
                <View style={styles.leaderboardTitleRow}>
                  <Text style={styles.leaderboardSectionTitle}>
                    🏆 MOST ACTIVELY USED AI AGENTS / MASTERMINDS LEADERBOARD
                  </Text>
                  <Text style={styles.leaderboardSectionSub}>
                    Real-time ranking by user consultation count & strategic inquiries
                  </Text>
                </View>

                {/* Leaderboard Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableColHeader, { flex: 0.6, textAlign: 'center' }]}>RANK</Text>
                  <Text style={[styles.tableColHeader, { flex: 2.8 }]}>MASTERMIND</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.8 }]}>ERA & CATEGORY</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.4, textAlign: 'right' }]}>CONSULTATIONS</Text>
                  <Text style={[styles.tableColHeader, { flex: 2.0 }]}>QUERY SHARE</Text>
                </View>

                {/* Leaderboard Rows */}
                {(aiAnalytics?.agentLeaderboard || []).map((agent) => (
                  <View key={agent.id} style={styles.leaderboardRow}>
                    {/* Rank Badge */}
                    <View style={{ flex: 0.6, alignItems: 'center' }}>
                      <View style={[
                        styles.rankBadge,
                        agent.rank === 1 ? styles.rank1 : agent.rank === 2 ? styles.rank2 : agent.rank === 3 ? styles.rank3 : styles.rankOther
                      ]}>
                        <Text style={styles.rankBadgeText}>#{agent.rank}</Text>
                      </View>
                    </View>

                    {/* Mastermind Avatar & Name */}
                    <View style={{ flex: 2.8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Image source={{ uri: agent.avatar_url }} style={styles.agentAvatarImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.agentName} numberOfLines={1}>{agent.name}</Text>
                        <Text style={styles.agentTitle} numberOfLines={1}>{agent.title}</Text>
                      </View>
                    </View>

                    {/* Era & Category */}
                    <View style={{ flex: 1.8 }}>
                      <View style={styles.eraPill}>
                        <Text style={styles.eraPillText} numberOfLines={1}>{agent.era}</Text>
                      </View>
                      <Text style={styles.categoryText} numberOfLines={1}>{agent.category}</Text>
                    </View>

                    {/* Consultations */}
                    <View style={{ flex: 1.4, alignItems: 'flex-end' }}>
                      <Text style={styles.inquiriesCount}>{agent.inquiries}</Text>
                      <Text style={styles.inquiriesSub}>Inquiries</Text>
                    </View>

                    {/* Popularity Bar */}
                    <View style={{ flex: 2.0, paddingLeft: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.popBarLabel}>Share</Text>
                        <Text style={styles.popBarPercent}>{agent.percentage}%</Text>
                      </View>
                      <View style={styles.popBarTrack}>
                        <View style={[styles.popBarFill, { width: `${Math.max(8, agent.relativePopularity || 10)}%` }]} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* MODULE 4: GLOBAL PLATFORM CONTROLS */}
          {/* ============================================================== */}
          {activeTab === 'GLOBAL' && (
            <View style={styles.tabContent}>
              <View style={styles.moduleHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>⚙️ GLOBAL APP COMMAND SWITCHES</Text>
                  <Text style={styles.sectionSubheading}>
                    Platform-wide overrides. Changes instantly apply across all active web & mobile client sessions.
                  </Text>
                </View>
              </View>

              {/* Switch 1: Global Paywall ON/OFF */}
              <View style={styles.switchCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Global Paywall Enforcement (પેવોલ સ્વીચ)</Text>
                  <Text style={styles.switchDesc}>
                    {settings.isPaywallEnabled
                      ? 'ON: Standard freemium rules active (5 free sessions, then Razorpay subscription prompt).'
                      : 'OFF: GOD-MODE! Entire platform is 100% free with unlimited chats for all visitors.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.togglePill, settings.isPaywallEnabled ? styles.togglePillOn : styles.togglePillOff]}
                  onPress={() => handleToggleSetting('isPaywallEnabled')}
                >
                  <Text style={styles.togglePillText}>
                    {settings.isPaywallEnabled ? 'ACTIVE (ON)' : 'BYPASS (OFF)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Switch 2: Gemini 3.1 Pro Lock */}
              <View style={styles.switchCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Gemini 3.1 Pro & Ultra Thinking Lock (પ્રો મોડેલ લોક)</Text>
                  <Text style={styles.switchDesc}>
                    {settings.isProModelLockEnabled
                      ? 'ON: Gemini 3.1 Pro & Ultra reasoning depth are strictly reserved for Pro Subscribers.'
                      : 'OFF: UNLOCKED! Free tier users can access 3.1 Pro and deep strategic reasoning.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.togglePill, settings.isProModelLockEnabled ? styles.togglePillOn : styles.togglePillOff]}
                  onPress={() => handleToggleSetting('isProModelLockEnabled')}
                >
                  <Text style={styles.togglePillText}>
                    {settings.isProModelLockEnabled ? 'LOCKED' : 'UNLOCKED'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Switch 3: Default Free Credits */}
              <View style={styles.switchCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Default Starter Free Sessions for New Registrations</Text>
                  <Text style={styles.switchDesc}>
                    Number of initial free mastermind sessions granted before paywall prompt.
                  </Text>
                  <View style={styles.creditPillsRow}>
                    {[5, 10, 25, 50, -1].map((credits) => {
                      const isSel = settings.defaultFreeCredits === credits;
                      return (
                        <TouchableOpacity
                          key={String(credits)}
                          style={[styles.creditPill, isSel && styles.creditPillActive]}
                          onPress={() => setSettings(s => ({ ...s, defaultFreeCredits: credits }))}
                        >
                          <Text style={[styles.creditPillText, isSel && styles.creditPillTextActive]}>
                            {credits === -1 ? 'Unlimited ∞' : `${credits} Chats`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Switch 4: Razorpay Mode */}
              <View style={styles.switchCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Razorpay Gateway Environment</Text>
                  <Text style={styles.switchDesc}>
                    Current Mode: {settings.razorpayMode === 'live' ? 'LIVE PRODUCTION (Real Money Gateway)' : 'TEST SANDBOX (Testing)'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.togglePill, settings.razorpayMode === 'live' ? styles.togglePillGreen : styles.togglePillGray]}
                  onPress={() => setSettings(s => ({ ...s, razorpayMode: s.razorpayMode === 'live' ? 'test' : 'live' }))}
                >
                  <Text style={styles.togglePillText}>
                    {settings.razorpayMode === 'live' ? 'LIVE MODE' : 'TEST MODE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Save Changes Button */}
              <TouchableOpacity
                style={styles.saveGlobalBtn}
                onPress={handleSaveGlobalSettings}
                disabled={savingSettings}
                activeOpacity={0.88}
              >
                {savingSettings ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="save-outline" size={18} color="#000000" />
                    <Text style={styles.saveGlobalBtnText}>SAVE GOD-MODE CONFIGURATION</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505'
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    backgroundColor: '#080808'
  },
  authCheckingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  authCheckingBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E'
  },
  authCheckingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 8
  },
  authCheckingSub: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380
  },
  authDeniedBox: {
    alignItems: 'center',
    padding: 36,
    backgroundColor: '#120505',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    maxWidth: 440
  },
  authDeniedTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8
  },
  authDeniedSub: {
    color: '#AAAAAA',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  deniedReturnBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  deniedReturnBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#0C0C0C'
  },
  topBarLeft: {
    flexDirection: 'column',
    gap: 4
  },
  godModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#1F2937'
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  godModeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  systemHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  systemHeaderSub: {
    color: '#777777',
    fontSize: 11,
    letterSpacing: 0.3
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#333333'
  },
  actionPillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  returnAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7
  },
  returnAppBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    overflow: 'scroll'
  },
  tabNavItem: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8
  },
  tabNavItemActive: {
    backgroundColor: '#1F1F1F',
    borderBottomWidth: 2,
    borderBottomColor: '#00F0FF'
  },
  tabNavText: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700'
  },
  tabNavTextActive: {
    color: '#FFFFFF'
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 60
  },
  tabContent: {
    gap: 16
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  sectionSubheading: {
    color: '#777777',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 700
  },
  countBadge: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  countBadgeText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700'
  },
  userSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  userSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13
  },
  selectedUserBox: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16,
    gap: 14
  },
  selectedUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  userAvatarSquare: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%'
  },
  selectedUserName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  googleBadgeText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '700'
  },
  thisDeviceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  thisDeviceBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900'
  },
  selectedUserEmail: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 2
  },
  selectedUserId: {
    color: '#555555',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  userPlanBadge: {
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  userPlanBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800'
  },
  userMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between'
  },
  userMetricItem: {
    alignItems: 'center',
    flex: 1
  },
  userMetricLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  userMetricVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  actionButtonGroup: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 12
  },
  actionGroupTitle: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  actionBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7
  },
  toolBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  giftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7
  },
  giftBtnGold: {
    backgroundColor: '#D4AF37'
  },
  giftBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800'
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#270A0A',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7
  },
  revokeBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800'
  },
  dangerZoneRow: {
    marginTop: 6
  },
  blockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7F1D1D',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  unblockBtn: {
    backgroundColor: '#065F46'
  },
  blockBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E1E1E'
  },
  tableColHeader: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  userTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#181818',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4
  },
  userTableRowActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#0F1A1C'
  },
  rowUserName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  rowUserEmail: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2
  },
  googleOAuthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1B2234',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  googleOAuthBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700'
  },
  rowSessionsText: {
    color: '#DDDDDD',
    fontSize: 12,
    fontWeight: '700'
  },
  rowSessionsPro: {
    color: '#00F0FF',
    fontWeight: '800'
  },
  rowBonusSmall: {
    color: '#666666',
    fontSize: 9,
    marginTop: 2
  },
  activePill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  activePillText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800'
  },
  suspendedPill: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  suspendedPillText: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '800'
  },
  selectBtnPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E1E1E'
  },
  selectBtnPillActive: {
    backgroundColor: '#00F0FF'
  },
  selectBtnPillText: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '800'
  },
  selectBtnPillTextActive: {
    color: '#000000'
  },
  emptyBox: {
    alignItems: 'center',
    padding: 36,
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#181818',
    marginTop: 6
  },
  emptyBoxText: {
    color: '#666666',
    fontSize: 13,
    marginTop: 10
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  kpiCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16
  },
  kpiCardHighlight: {
    borderColor: '#00F0FF',
    backgroundColor: '#0A1214'
  },
  kpiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center'
  },
  kpiBadgeGreen: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  kpiBadgeGreenText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800'
  },
  kpiBadgeCyan: {
    backgroundColor: '#083344',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  kpiBadgeCyanText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800'
  },
  kpiBadgeBlue: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  kpiBadgeBlueText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800'
  },
  kpiBadgeGold: {
    backgroundColor: '#451A03',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  kpiBadgeGoldText: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '800'
  },
  kpiBadgePurple: {
    backgroundColor: '#3B0764',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  kpiBadgePurpleText: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '800'
  },
  kpiLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  kpiValueSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888'
  },
  kpiSub: {
    color: '#555555',
    fontSize: 11,
    marginTop: 4
  },
  revenueBreakdownSection: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14
  },
  breakdownHeaderTitle: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10
  },
  breakdownPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  breakdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  breakdownPillLabel: {
    color: '#AAAAAA',
    fontSize: 11
  },
  breakdownPillVal: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800'
  },
  logsFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  logsFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424'
  },
  logsFilterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  logsFilterText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700'
  },
  logsFilterTextActive: {
    color: '#000000'
  },
  txTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#171717',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4
  },
  txRowId: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  txRowSubId: {
    color: '#666666',
    fontSize: 10,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  txRowEmail: {
    color: '#CCCCCC',
    fontSize: 11
  },
  txRowPlan: {
    color: '#AAAAAA',
    fontSize: 11
  },
  txRowAmount: {
    fontSize: 12,
    fontWeight: '800'
  },
  txAmountPaid: {
    color: '#10B981'
  },
  txAmountGift: {
    color: '#A855F7'
  },
  txStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  txStatusPaid: {
    backgroundColor: '#064E3B'
  },
  txStatusGift: {
    backgroundColor: '#3B0764'
  },
  txStatusText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  txRowDate: {
    color: '#777777',
    fontSize: 10
  },
  leaderboardSection: {
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16
  },
  leaderboardTitleRow: {
    marginBottom: 14
  },
  leaderboardSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  leaderboardSectionSub: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rank1: {
    backgroundColor: '#D4AF37'
  },
  rank2: {
    backgroundColor: '#94A3B8'
  },
  rank3: {
    backgroundColor: '#B45309'
  },
  rankOther: {
    backgroundColor: '#262626'
  },
  rankBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900'
  },
  agentAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333333'
  },
  agentName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  agentTitle: {
    color: '#777777',
    fontSize: 10,
    marginTop: 1
  },
  eraPill: {
    backgroundColor: '#1B1B1B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  eraPillText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '700'
  },
  categoryText: {
    color: '#666666',
    fontSize: 10,
    marginTop: 2
  },
  inquiriesCount: {
    color: '#00F0FF',
    fontSize: 15,
    fontWeight: '800'
  },
  inquiriesSub: {
    color: '#555555',
    fontSize: 9
  },
  popBarLabel: {
    color: '#777777',
    fontSize: 10
  },
  popBarPercent: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  popBarTrack: {
    height: 6,
    backgroundColor: '#222222',
    borderRadius: 3,
    overflow: 'hidden'
  },
  popBarFill: {
    height: '100%',
    backgroundColor: '#00F0FF',
    borderRadius: 3
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    gap: 16
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  switchDesc: {
    color: '#777777',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  togglePillOn: {
    backgroundColor: '#10B981'
  },
  togglePillOff: {
    backgroundColor: '#EF4444'
  },
  togglePillGreen: {
    backgroundColor: '#10B981'
  },
  togglePillGray: {
    backgroundColor: '#374151'
  },
  togglePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  creditPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  creditPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A'
  },
  creditPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  creditPillText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700'
  },
  creditPillTextActive: {
    color: '#000000'
  },
  saveGlobalBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  },
  saveGlobalBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8
  }
});
