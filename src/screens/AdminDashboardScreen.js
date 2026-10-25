/**
 * COUNCIL X | THE SYNDICATE
 * Dedicated Super Admin & God-Mode Dashboard Screen
 * 
 * Accessible exclusively via separate admin route:
 * - URL path: /admin
 * - Navigation route: 'Admin'
 * 
 * Security:
 * - Protected by Master Clearance PIN (Default: 7777)
 * - Directly synced to Supabase database (`profiles`, `payments`, `conversations`, `custom_agents`)
 * - Instant live gifting & account suspension engine
 * - 100% Corporate Black & White Luxury Theme (OpenAI / Bloomberg Minimal)
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
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../services/adminService';
import { useLanguage } from '../utils/i18n';

export default function AdminDashboardScreen({ navigation }) {
  const { lang } = useLanguage();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Active Tab: 'ANALYTICS' | 'USERS' | 'GLOBAL' | 'LOGS' | 'SECURITY'
  const [activeTab, setActiveTab] = useState('ANALYTICS');

  // Live Data States
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Global Settings States
  const [settings, setSettings] = useState({
    isPaywallEnabled: true,
    isProModelLockEnabled: true,
    defaultFreeCredits: 5,
    razorpayMode: 'live',
    maintenanceMode: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Transaction Logs State
  const [txLogs, setTxLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'GIFT'

  // Change PIN State
  const [newPinInput, setNewPinInput] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      refreshDashboardData();
    }
  }, [isAuthenticated]);

  const handleVerifyPin = async (inputToVerify) => {
    const pin = inputToVerify || pinInput;
    if (!pin) {
      setPinError('Please enter Master PIN');
      return;
    }
    setVerifyingPin(true);
    setPinError('');
    try {
      const isValid = await adminService.verifyPin(pin);
      if (isValid) {
        setIsAuthenticated(true);
        setPinInput('');
        refreshDashboardData();
      } else {
        setPinError('Invalid Security PIN. (Default: 7777)');
      }
    } catch (e) {
      setPinError('Authentication error');
    } finally {
      setVerifyingPin(false);
    }
  };

  const refreshDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, users, globalConfig, logs] = await Promise.all([
        adminService.getLiveAnalytics(),
        adminService.getUsersList(searchQuery),
        adminService.getSettings(),
        adminService.getTransactionLogs()
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

  // 1-Click Gift Actions
  const handleGiftPro = async (planKey) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.giftProPlan(selectedUser, planKey);
    setActionLoading(false);
    Alert.alert('Gift Pro Plan', res.message);
    if (res.success) {
      refreshDashboardData();
    }
  };

  const handleRevokePro = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.revokeProPlan(selectedUser);
    setActionLoading(false);
    Alert.alert('Revoke Pro Plan', res.message);
    if (res.success) {
      refreshDashboardData();
    }
  };

  const handleGiftChats = async (count) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.giftFreeChats(selectedUser, count);
    setActionLoading(false);
    Alert.alert('Gift Free Chats', res.message);
    if (res.success) {
      refreshDashboardData();
    }
  };

  const handleGiftSlots = async (count) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.giftAgentSlots(selectedUser, count);
    setActionLoading(false);
    Alert.alert('Gift Agent Slots', res.message);
    if (res.success) {
      refreshDashboardData();
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const res = await adminService.toggleBlockUser(selectedUser);
    setActionLoading(false);
    Alert.alert('Account Status', res.message);
    if (res.success) {
      refreshDashboardData();
    }
  };

  // Global Settings Toggle
  const handleToggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveGlobalSettings = async () => {
    setSavingSettings(true);
    const res = await adminService.updateSettings(settings);
    setSavingSettings(false);
    if (res.success) {
      Alert.alert('God-Mode Settings', 'Global platform settings updated and persisted successfully.');
    } else {
      Alert.alert('Error', res.message || 'Failed to save settings.');
    }
  };

  const handleChangePin = async () => {
    if (!newPinInput || newPinInput.trim().length < 4) {
      Alert.alert('Master PIN', 'PIN must be at least 4 digits.');
      return;
    }
    const res = await adminService.changePin(newPinInput.trim());
    Alert.alert('Security PIN', res.message);
    if (res.success) {
      setNewPinInput('');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      <View style={styles.container}>
        {/* Top Sovereign Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.godModePill}>
              <View style={styles.greenDot} />
              <Text style={styles.godModeText}>⚡ GOD-MODE ROUTE</Text>
            </View>
            <View>
              <Text style={styles.systemHeaderTitle}>SUPER ADMIN CONTROL</Text>
              <Text style={styles.systemHeaderSub}>COUNCIL X | SUPREME COMMAND CENTER</Text>
            </View>
          </View>

          <View style={styles.topBarRight}>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.actionPillBtn}
                onPress={refreshDashboardData}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillBtnText}>SYNC</Text>
              </TouchableOpacity>
            )}

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

        {/* SCREEN 1: PIN AUTHENTICATION GATE */}
        {!isAuthenticated ? (
          <View style={styles.authGateContainer}>
            <View style={styles.authShieldWrap}>
              <Ionicons name="shield-checkmark" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.authGateTitle}>SUPREME COMMAND CLEARANCE</Text>
            <Text style={styles.authGateSubtitle}>
              Protected Administrative Route. Enter Master Security PIN to unlock full God-Mode Controls.
            </Text>
            <View style={styles.authHintBox}>
              <Ionicons name="key-outline" size={12} color="#AAAAAA" />
              <Text style={styles.authDefaultHint}>Default Master PIN: 7777</Text>
            </View>

            <View style={styles.pinInputRow}>
              <TextInput
                style={styles.pinInput}
                value={pinInput}
                onChangeText={(val) => {
                  setPinInput(val);
                  if (val.length === 4) handleVerifyPin(val);
                }}
                placeholder="• • • •"
                placeholderTextColor="#444444"
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                autoFocus
              />
            </View>

            {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}

            <TouchableOpacity
              style={styles.unlockBtn}
              onPress={() => handleVerifyPin()}
              disabled={verifyingPin}
              activeOpacity={0.85}
            >
              {verifyingPin ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <View style={styles.unlockBtnContent}>
                  <Ionicons name="lock-open" size={16} color="#000000" style={{ marginRight: 6 }} />
                  <Text style={styles.unlockBtnText}>VERIFY & UNLOCK DASHBOARD</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Quick Numeric Keypad */}
            <View style={styles.quickPadRow}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                <TouchableOpacity
                  key={digit}
                  style={styles.keypadDigit}
                  onPress={() => {
                    const next = pinInput + digit;
                    setPinInput(next);
                    if (next.length === 4) handleVerifyPin(next);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keypadDigitText}>{digit}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.keypadDigit, { backgroundColor: '#1A1A1A', borderColor: '#333333' }]}
                onPress={() => setPinInput('')}
                activeOpacity={0.7}
              >
                <Text style={[styles.keypadDigitText, { color: '#EF4444' }]}>CLEAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* SCREEN 2: GOD-MODE COMMAND DASHBOARD */
          <View style={{ flex: 1 }}>
            {/* Tab Navigation Switcher */}
            <View style={styles.tabNavRow}>
              {[
                { key: 'ANALYTICS', label: '📊 ANALYTICS' },
                { key: 'USERS', label: '🎁 USER GIFTS' },
                { key: 'GLOBAL', label: '⚙️ GLOBAL ON/OFF' },
                { key: 'LOGS', label: '📜 REVENUE LOGS' },
                { key: 'SECURITY', label: '🔐 PIN' }
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
              {/* TAB 1: LIVE A-TO-Z ANALYTICS */}
              {/* ============================================================== */}
              {activeTab === 'ANALYTICS' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionHeading}>LIVE FINANCIAL & ENGAGEMENT METRICS</Text>
                  <Text style={styles.sectionSubheading}>
                    Real-time synchronized data querying Supabase tables (`profiles`, `payments`, `conversations`, `custom_agents`) + Razorpay.
                  </Text>

                  {/* 4 Big KPI Cards */}
                  <View style={styles.kpiGrid}>
                    {/* Card 1: Revenue Tracking (Lifetime + Current Month) */}
                    <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={styles.kpiIconWrap}>
                          <Ionicons name="cash" size={20} color="#10B981" />
                        </View>
                        <View style={styles.currentMonthBadge}>
                          <Text style={styles.currentMonthBadgeText}>📅 CURRENT MONTH: ₹{(analytics?.revenue?.currentMonth ?? 0).toLocaleString('en-IN')}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.kpiLabel}>TOTAL LIFETIME EARNINGS (કુલ કમાણી)</Text>
                      <Text style={styles.kpiValue}>
                        ₹{(analytics?.revenue?.total ?? 0).toLocaleString('en-IN')}
                      </Text>
                      
                      <View style={styles.revenueBreakdownPills}>
                        <View style={styles.revBreakdownPill}>
                          <Text style={styles.revBreakdownPillText}>Annual: ₹{(analytics?.revenue?.breakdown?.annual ?? 0).toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.revBreakdownPill}>
                          <Text style={styles.revBreakdownPillText}>6-Month: ₹{(analytics?.revenue?.breakdown?.semiAnnual ?? 0).toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.revBreakdownPill}>
                          <Text style={styles.revBreakdownPillText}>Slots: ₹{(analytics?.revenue?.breakdown?.agentSlots ?? 0).toLocaleString('en-IN')}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Card 2: Total & Live User Metrics (DAU, MAU, Live Radar) */}
                    <View style={styles.kpiCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={styles.kpiIconWrap}>
                          <Ionicons name="people" size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.liveRadarPill}>
                          <View style={styles.liveRadarDot} />
                          <Text style={styles.liveRadarPillText}>
                            LIVE NOW (15m): {analytics?.users?.liveActive ?? 0}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.kpiLabel}>TOTAL REGISTERED USERS (SUPABASE)</Text>
                      <Text style={styles.kpiValue}>
                        {analytics?.users?.total ?? 0} <Text style={styles.kpiValueSmall}>Registered Members</Text>
                      </Text>

                      {/* DAU & MAU Activity Row */}
                      <View style={styles.activityStatsRow}>
                        <View style={styles.activityStatBox}>
                          <Text style={styles.activityStatLabel}>DAU (24h Active)</Text>
                          <Text style={styles.activityStatVal}>{analytics?.users?.dau ?? 0}</Text>
                        </View>
                        <View style={styles.activityStatDivider} />
                        <View style={styles.activityStatBox}>
                          <Text style={styles.activityStatLabel}>MAU (30d Active)</Text>
                          <Text style={styles.activityStatVal}>{analytics?.users?.mau ?? 0}</Text>
                        </View>
                        <View style={styles.activityStatDivider} />
                        <View style={styles.activityStatBox}>
                          <Text style={styles.activityStatLabel}>Pro Subscribers</Text>
                          <Text style={[styles.activityStatVal, { color: '#D4AF37' }]}>👑 {analytics?.users?.pro ?? 0}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Card 3: Chats & Custom Masterminds */}
                    <View style={styles.kpiCard}>
                      <View style={styles.kpiIconWrap}>
                        <Ionicons name="chatbubbles" size={20} color="#D4AF37" />
                      </View>
                      <Text style={styles.kpiLabel}>ENGAGEMENT & PERSONAL AGENTS</Text>
                      <Text style={styles.kpiValue}>
                        {analytics?.engagement?.totalChats ?? 0} <Text style={styles.kpiValueSmall}>Chats Conducted</Text>
                      </Text>
                      <View style={styles.kpiSubRow}>
                        <Text style={styles.kpiSubText}>
                          Vault Custom Agents: {analytics?.engagement?.totalCustomAgents ?? 0} Created in Database
                        </Text>
                      </View>
                    </View>

                    {/* Card 4: System Health */}
                    <View style={styles.kpiCard}>
                      <View style={styles.kpiIconWrap}>
                        <Ionicons name="pulse" size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.kpiLabel}>LIVE SYSTEM HEALTH & APIS</Text>
                      <View style={styles.healthStatusList}>
                        <View style={styles.healthItem}>
                          <Text style={styles.healthName}>Google Gemini 3.0/3.1:</Text>
                          <View style={styles.healthBadgeGreen}>
                            <Text style={styles.healthBadgeGreenText}>{analytics?.systemHealth?.gemini || 'OPERATIONAL'}</Text>
                          </View>
                        </View>
                        <View style={styles.healthItem}>
                          <Text style={styles.healthName}>Supabase PostgreSQL:</Text>
                          <View style={styles.healthBadgeBlue}>
                            <Text style={styles.healthBadgeBlueText}>{analytics?.systemHealth?.supabase || 'CONNECTED'}</Text>
                          </View>
                        </View>
                        <View style={styles.healthItem}>
                          <Text style={styles.healthName}>Razorpay Gateway:</Text>
                          <View style={styles.healthBadgePurple}>
                            <Text style={styles.healthBadgePurpleText}>{analytics?.systemHealth?.razorpay || 'CONFIGURED'}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* ============================================================== */}
              {/* TAB 2: USER MANAGEMENT & 1-CLICK GIFTING */}
              {/* ============================================================== */}
              {activeTab === 'USERS' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionHeading}>🎁 USER MANAGEMENT & 1-CLICK GIFT CENTER</Text>
                  <Text style={styles.sectionSubheading}>
                    Connected directly to Supabase `profiles`. Any gift or status toggle immediately updates the user's active session.
                  </Text>

                  {/* Search Bar */}
                  <View style={styles.userSearchBar}>
                    <Ionicons name="search" size={16} color="#888888" />
                    <TextInput
                      style={styles.userSearchInput}
                      placeholder="Search by Email or User ID..."
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

                  {/* Active Selected User Card */}
                  {selectedUser ? (
                    <View style={styles.selectedUserBox}>
                      <View style={styles.selectedUserHeader}>
                        <View style={styles.userAvatarSquare}>
                          <Ionicons name="person" size={22} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
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
                            {selectedUser.is_premium ? '👑 PRO MEMBER' : 'FREE TIER'}
                          </Text>
                        </View>
                      </View>

                      {/* Current User Stats */}
                      <View style={styles.userMetricsRow}>
                        <View style={styles.userMetricItem}>
                          <Text style={styles.userMetricLabel}>Plan Tier</Text>
                          <Text style={styles.userMetricVal}>{selectedUser.plan_type || 'Free'}</Text>
                        </View>
                        <View style={styles.userMetricItem}>
                          <Text style={styles.userMetricLabel}>Bonus Chats</Text>
                          <Text style={styles.userMetricVal}>+{selectedUser.bonus_messages || 0}</Text>
                        </View>
                        <View style={styles.userMetricItem}>
                          <Text style={styles.userMetricLabel}>Agent Slots</Text>
                          <Text style={styles.userMetricVal}>+{selectedUser.extra_agent_slots || 0}</Text>
                        </View>
                        <View style={styles.userMetricItem}>
                          <Text style={styles.userMetricLabel}>Account</Text>
                          <Text style={[styles.userMetricVal, { color: selectedUser.is_blocked ? '#EF4444' : '#10B981' }]}>
                            {selectedUser.is_blocked ? 'SUSPENDED' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>

                      {/* 1-Click Power Action Buttons */}
                      <View style={styles.actionButtonGroup}>
                        <Text style={styles.actionGroupTitle}>1-CLICK GIFT PRO MEMBERSHIP (મફત PRO ગિફ્ટ):</Text>
                        <View style={styles.actionBtnRow}>
                          <TouchableOpacity
                            style={styles.giftBtn}
                            onPress={() => handleGiftPro('1_month')}
                            disabled={actionLoading}
                          >
                            <Ionicons name="gift-outline" size={14} color="#000000" />
                            <Text style={styles.giftBtnText}>1 MONTH PRO</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.giftBtn}
                            onPress={() => handleGiftPro('6_month')}
                            disabled={actionLoading}
                          >
                            <Ionicons name="gift-outline" size={14} color="#000000" />
                            <Text style={styles.giftBtnText}>6 MONTHS PRO</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.giftBtn}
                            onPress={() => handleGiftPro('1_year')}
                            disabled={actionLoading}
                          >
                            <Ionicons name="gift-outline" size={14} color="#000000" />
                            <Text style={styles.giftBtnText}>1 YEAR ANNUAL</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.giftBtn, styles.giftBtnGold]}
                            onPress={() => handleGiftPro('lifetime')}
                            disabled={actionLoading}
                          >
                            <Ionicons name="infinite" size={14} color="#000000" />
                            <Text style={styles.giftBtnText}>LIFETIME PRO</Text>
                          </TouchableOpacity>

                          {selectedUser.is_premium ? (
                            <TouchableOpacity
                              style={styles.revokeBtn}
                              onPress={handleRevokePro}
                              disabled={actionLoading}
                            >
                              <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                              <Text style={styles.revokeBtnText}>REVOKE PRO</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>

                        <Text style={[styles.actionGroupTitle, { marginTop: 12 }]}>
                          1-CLICK GIFT FREE CHATS & AGENT SLOTS:
                        </Text>
                        <View style={styles.actionBtnRow}>
                          <TouchableOpacity
                            style={styles.toolBtn}
                            onPress={() => handleGiftChats(10)}
                            disabled={actionLoading}
                          >
                            <Text style={styles.toolBtnText}>+10 CHATS</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.toolBtn}
                            onPress={() => handleGiftChats(50)}
                            disabled={actionLoading}
                          >
                            <Text style={styles.toolBtnText}>+50 CHATS</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.toolBtn}
                            onPress={() => handleGiftChats(9999)}
                            disabled={actionLoading}
                          >
                            <Text style={styles.toolBtnText}>UNLIMITED CHATS</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.toolBtnPurple}
                            onPress={() => handleGiftSlots(1)}
                            disabled={actionLoading}
                          >
                            <Text style={styles.toolBtnPurpleText}>+1 AGENT SLOT</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.toolBtnPurple}
                            onPress={() => handleGiftSlots(5)}
                            disabled={actionLoading}
                          >
                            <Text style={styles.toolBtnPurpleText}>+5 AGENT SLOTS</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Account Suspend / Block */}
                        <View style={styles.dangerZoneRow}>
                          <TouchableOpacity
                            style={[styles.blockBtn, selectedUser.is_blocked && styles.unblockBtn]}
                            onPress={handleToggleBlock}
                            disabled={actionLoading}
                          >
                            <Ionicons
                              name={selectedUser.is_blocked ? "shield-checkmark-outline" : "ban-outline"}
                              size={14}
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

                  {/* Users Roster List */}
                  <Text style={[styles.actionGroupTitle, { marginTop: 16 }]}>REGISTERED PLATFORM MEMBERS ({usersList.length}):</Text>
                  {usersList.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.userListItem, isSelected && styles.userListItemActive]}
                        onPress={() => setSelectedUser(user)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.userListLeft}>
                          <Text style={styles.userListEmail}>{user.email}</Text>
                          <Text style={styles.userListId}>
                            {user.name} • {user.is_premium ? '👑 Pro' : 'Free Tier'} • +{user.bonus_messages || 0} Bonus
                          </Text>
                        </View>

                        <View style={styles.userListRight}>
                          {user.is_blocked ? (
                            <View style={styles.blockedBadge}>
                              <Text style={styles.blockedBadgeText}>BLOCKED</Text>
                            </View>
                          ) : user.is_premium ? (
                            <View style={styles.proSmallBadge}>
                              <Text style={styles.proSmallBadgeText}>PRO</Text>
                            </View>
                          ) : (
                            <View style={styles.freeSmallBadge}>
                              <Text style={styles.freeSmallBadgeText}>FREE</Text>
                            </View>
                          )}
                          <Ionicons name="chevron-forward" size={14} color="#666666" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* ============================================================== */}
              {/* TAB 3: GLOBAL GOD-MODE APP CONTROLS */}
              {/* ============================================================== */}
              {activeTab === 'GLOBAL' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionHeading}>⚙️ GLOBAL APP COMMAND SWITCHES</Text>
                  <Text style={styles.sectionSubheading}>
                    Real-time global configuration overrides. Changes instantly apply platform-wide to all active sessions.
                  </Text>

                  {/* Switch 1: Global Paywall ON/OFF */}
                  <View style={styles.switchCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchTitle}>Global Paywall Enforcement (પેવોલ સ્વીચ)</Text>
                      <Text style={styles.switchDesc}>
                        {settings.isPaywallEnabled
                          ? 'ON: Standard freemium rules active (5 free chats, then Razorpay paywall triggers).'
                          : 'OFF: GOD-MODE! Entire app is 100% free with unlimited chats for every user.'}
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

                  {/* Switch 2: 3.1 Pro & Ultra Thinking Lock */}
                  <View style={styles.switchCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchTitle}>3.1 Pro & Ultra Thinking Lock (પ્રો મોડેલ લોક)</Text>
                      <Text style={styles.switchDesc}>
                        {settings.isProModelLockEnabled
                          ? 'ON: Gemini 3.1 Pro and Ultra Depth are strictly reserved for Pro Subscribers.'
                          : 'OFF: UNLOCKED! Free tier users can access 3.1 Pro and Ultra thinking depth.'}
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

                  {/* Setting 3: Default Free Credits for New Users */}
                  <View style={styles.switchCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchTitle}>Default Free Chats for New Users</Text>
                      <Text style={styles.switchDesc}>
                        Number of starter free mastermind sessions granted before paywall prompt.
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
                        Current Mode: {settings.razorpayMode === 'live' ? 'LIVE PRODUCTION (Real Money)' : 'TEST SANDBOX (Testing)'}
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

              {/* ============================================================== */}
              {/* TAB 4: REVENUE & TRANSACTION LOGS */}
              {/* ============================================================== */}
              {activeTab === 'LOGS' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionHeading}>📜 REVENUE & ADMIN GIFT LEDGER</Text>
                  <Text style={styles.sectionSubheading}>
                    Chronological audit trail of all real Razorpay payments and Admin gift actions directly from Supabase `payments`.
                  </Text>

                  {/* Filter Pills */}
                  <View style={styles.logsFilterRow}>
                    {[
                      { key: 'ALL', label: `ALL (${txLogs.length})` },
                      { key: 'PAID', label: `PAID ONLY (${txLogs.filter(t => (Number(t.amount) || 0) > 0).length})` },
                      { key: 'GIFT', label: `ADMIN GIFTS (${txLogs.filter(t => (Number(t.amount) || 0) === 0).length})` }
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

                  {/* Transaction Table Header */}
                  <View style={styles.logsTableHeaderRow}>
                    <Text style={[styles.logsTableColHeader, { flex: 2.2 }]}>USER EMAIL</Text>
                    <Text style={[styles.logsTableColHeader, { flex: 1.8 }]}>PLAN / PRODUCT</Text>
                    <Text style={[styles.logsTableColHeader, { flex: 1.2, textAlign: 'right' }]}>AMOUNT (₹)</Text>
                    <Text style={[styles.logsTableColHeader, { flex: 1.8, textAlign: 'right' }]}>TIMESTAMP</Text>
                    <Text style={[styles.logsTableColHeader, { flex: 1.2, textAlign: 'center' }]}>STATUS</Text>
                  </View>

                  {/* Filtered Logs Table Rows */}
                  {(() => {
                    const filtered = txLogs.filter((t) => {
                      if (logFilter === 'PAID') return (Number(t.amount) || 0) > 0;
                      if (logFilter === 'GIFT') return (Number(t.amount) || 0) === 0;
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <View style={styles.emptyLogsBox}>
                          <Ionicons name="receipt-outline" size={32} color="#555555" />
                          <Text style={styles.emptyLogsText}>No matching transaction logs found.</Text>
                        </View>
                      );
                    }

                    return filtered.map((tx) => (
                      <View key={tx.id} style={styles.logsTableRow}>
                        <View style={{ flex: 2.2 }}>
                          <Text style={styles.logsRowEmail} numberOfLines={1}>
                            {tx.userEmail || 'Anonymous Member'}
                          </Text>
                          <Text style={styles.logsRowId}>ID: {tx.id}</Text>
                        </View>

                        <View style={{ flex: 1.8 }}>
                          <Text style={styles.logsRowPlan} numberOfLines={1}>
                            {tx.planName || tx.planKey || tx.type}
                          </Text>
                        </View>

                        <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                          <Text style={[styles.logsRowAmount, (Number(tx.amount) || 0) > 0 ? styles.logsAmountPaid : styles.logsAmountGift]}>
                            {(Number(tx.amount) || 0) > 0 ? `₹${Number(tx.amount).toLocaleString('en-IN')}` : 'FREE GIFT'}
                          </Text>
                        </View>

                        <View style={{ flex: 1.8, alignItems: 'flex-end' }}>
                          <Text style={styles.logsRowDate} numberOfLines={1}>
                            {tx.date || new Date(tx.timestamp).toLocaleDateString()}
                          </Text>
                        </View>

                        <View style={{ flex: 1.2, alignItems: 'center' }}>
                          <View style={[styles.txStatusPill, (Number(tx.amount) || 0) > 0 ? styles.txStatusPillPaid : styles.txStatusPillGift]}>
                            <Text style={styles.txStatusPillText}>
                              {tx.status || ((Number(tx.amount) || 0) > 0 ? 'PAID' : 'GIFTED')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ));
                  })()}
                </View>
              )}

              {/* ============================================================== */}
              {/* TAB 5: MASTER PIN SECURITY */}
              {/* ============================================================== */}
              {activeTab === 'SECURITY' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionHeading}>🔐 MASTER PIN SECURITY SETTINGS</Text>
                  <Text style={styles.sectionSubheading}>
                    Change the God-Mode Master PIN. Default PIN is 7777. Keep this confidential.
                  </Text>

                  <View style={styles.switchCard}>
                    <Text style={styles.switchTitle}>Update Master Access PIN</Text>
                    <TextInput
                      style={styles.newPinInput}
                      placeholder="Enter New PIN (min 4 digits)"
                      placeholderTextColor="#666666"
                      value={newPinInput}
                      onChangeText={setNewPinInput}
                      keyboardType="numeric"
                      maxLength={8}
                    />
                    <TouchableOpacity
                      style={styles.updatePinBtn}
                      onPress={handleChangePin}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.updatePinBtnText}>UPDATE MASTER PIN</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
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
    maxWidth: 960,
    alignSelf: 'center',
    backgroundColor: '#080808'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    backgroundColor: '#0D0D0D'
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  godModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  godModeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  systemHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 1
  },
  systemHeaderSub: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  actionPillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  returnAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  returnAppBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900'
  },

  // Auth Gate Styles
  authGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  authShieldWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#161616',
    borderWidth: 1.5,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  authGateTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center'
  },
  authGateSubtitle: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 18,
    marginBottom: 10
  },
  authHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20
  },
  authDefaultHint: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700'
  },
  pinInputRow: {
    marginBottom: 14
  },
  pinInput: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    width: 220,
    paddingVertical: 12
  },
  pinErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12
  },
  unlockBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
    marginBottom: 24
  },
  unlockBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unlockBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  quickPadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 320
  },
  keypadDigit: {
    width: 52,
    height: 44,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keypadDigitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },

  // Tab Nav
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6
  },
  tabNavItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626'
  },
  tabNavItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  tabNavText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '800'
  },
  tabNavTextActive: {
    color: '#000000'
  },

  // Scroll Content
  scrollBody: {
    padding: 16,
    paddingBottom: 60
  },
  tabContent: {
    gap: 14
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1
  },
  sectionSubheading: {
    color: '#888888',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: -8,
    marginBottom: 6
  },

  // KPI Grid
  kpiGrid: {
    gap: 12
  },
  kpiCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16
  },
  kpiCardHighlight: {
    borderColor: '#383838',
    backgroundColor: '#131313'
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  kpiLabel: {
    color: '#888888',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4
  },
  kpiValueSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888'
  },
  kpiSubRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  kpiSubText: {
    color: '#777777',
    fontSize: 11
  },
  proCountPill: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  proCountPillText: {
    color: '#D4AF37',
    fontSize: 10.5,
    fontWeight: '800'
  },
  healthStatusList: {
    marginTop: 8,
    gap: 6
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  healthName: {
    color: '#AAAAAA',
    fontSize: 11
  },
  healthBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  healthBadgeGreenText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '900'
  },
  healthBadgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  healthBadgeBlueText: {
    color: '#3B82F6',
    fontSize: 9.5,
    fontWeight: '900'
  },
  healthBadgePurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  healthBadgePurpleText: {
    color: '#A855F7',
    fontSize: 9.5,
    fontWeight: '900'
  },

  // User Management
  userSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  userSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5
  },
  selectedUserBox: {
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#383838',
    borderRadius: 12,
    padding: 14
  },
  selectedUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  userAvatarSquare: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  thisDeviceBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  thisDeviceBadgeText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900'
  },
  selectedUserEmail: {
    color: '#AAAAAA',
    fontSize: 11.5,
    marginTop: 2
  },
  selectedUserId: {
    color: '#666666',
    fontSize: 9.5,
    marginTop: 1
  },
  userPlanBadge: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  userPlanBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  userMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 10,
    marginVertical: 12,
    justifyContent: 'space-between'
  },
  userMetricItem: {
    alignItems: 'center',
    flex: 1
  },
  userMetricLabel: {
    color: '#777777',
    fontSize: 9.5,
    fontWeight: '700'
  },
  userMetricVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  actionButtonGroup: {
    gap: 8
  },
  actionGroupTitle: {
    color: '#AAAAAA',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  actionBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  giftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  giftBtnGold: {
    backgroundColor: '#D4AF37'
  },
  giftBtnText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900'
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  revokeBtnText: {
    color: '#EF4444',
    fontSize: 10.5,
    fontWeight: '800'
  },
  toolBtn: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  toolBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800'
  },
  toolBtnPurple: {
    backgroundColor: '#1E1B2E',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  toolBtnPurpleText: {
    color: '#C4B5FD',
    fontSize: 10.5,
    fontWeight: '800'
  },
  dangerZoneRow: {
    marginTop: 8
  },
  blockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 8
  },
  unblockBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981'
  },
  blockBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },

  // User Roster List
  userListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6
  },
  userListItemActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#161616'
  },
  userListLeft: {
    flex: 1
  },
  userListEmail: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  userListId: {
    color: '#777777',
    fontSize: 10,
    marginTop: 2
  },
  userListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  blockedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  blockedBadgeText: {
    color: '#EF4444',
    fontSize: 8.5,
    fontWeight: '900'
  },
  proSmallBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  proSmallBadgeText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900'
  },
  freeSmallBadge: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  freeSmallBadgeText: {
    color: '#888888',
    fontSize: 8.5,
    fontWeight: '800'
  },

  // Global Switches
  switchCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  switchDesc: {
    color: '#888888',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1
  },
  togglePillOn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  togglePillOff: {
    backgroundColor: '#181818',
    borderColor: '#383838'
  },
  togglePillGreen: {
    backgroundColor: '#10B981',
    borderColor: '#10B981'
  },
  togglePillGray: {
    backgroundColor: '#262626',
    borderColor: '#444444'
  },
  togglePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000'
  },
  creditPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  creditPill: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  creditPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  creditPillText: {
    color: '#888888',
    fontSize: 10.5,
    fontWeight: '800'
  },
  creditPillTextActive: {
    color: '#000000'
  },
  saveGlobalBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  saveGlobalBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8
  },

  // Logs
  emptyLogsBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8
  },
  emptyLogsText: {
    color: '#777777',
    fontSize: 12
  },
  txCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  txDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  txDotGreen: {
    backgroundColor: '#10B981'
  },
  txDotGold: {
    backgroundColor: '#D4AF37'
  },
  txPlanName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  txAmount: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900'
  },
  txDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  txUserEmail: {
    color: '#AAAAAA',
    fontSize: 10.5
  },
  txDate: {
    color: '#666666',
    fontSize: 10
  },
  txFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 6
  },
  txStatusPill: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  currentMonthBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  currentMonthBadgeText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  revenueBreakdownPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  revBreakdownPill: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  revBreakdownPillText: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '700'
  },
  liveRadarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14
  },
  liveRadarDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981'
  },
  liveRadarPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  activityStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  activityStatBox: {
    flex: 1,
    alignItems: 'center'
  },
  activityStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#222222'
  },
  activityStatLabel: {
    color: '#777777',
    fontSize: 9.5,
    fontWeight: '700'
  },
  activityStatVal: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    marginTop: 2
  },

  // Logs Table Styles
  logsFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  logsFilterPill: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  logsFilterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  logsFilterText: {
    color: '#888888',
    fontSize: 10.5,
    fontWeight: '800'
  },
  logsFilterTextActive: {
    color: '#000000'
  },
  logsTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6
  },
  logsTableColHeader: {
    color: '#888888',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6
  },
  logsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6
  },
  logsRowEmail: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700'
  },
  logsRowId: {
    color: '#666666',
    fontSize: 9,
    marginTop: 2
  },
  logsRowPlan: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600'
  },
  logsRowAmount: {
    fontSize: 12,
    fontWeight: '900'
  },
  logsAmountPaid: {
    color: '#10B981'
  },
  logsAmountGift: {
    color: '#D4AF37'
  },
  logsRowDate: {
    color: '#888888',
    fontSize: 10.5
  },
  txStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  txStatusPillPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981'
  },
  txStatusPillGift: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: '#D4AF37'
  },
  txStatusPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF'
  },

  // PIN security
  newPinInput: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#383838',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    letterSpacing: 4
  },
  updatePinBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  updatePinBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8
  }
});
