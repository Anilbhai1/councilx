/**
 * COUNCIL X | THE SYNDICATE
 * Super Admin Control Panel (God-Mode Dashboard)
 * 
 * Features:
 * 1. Master PIN Authentication (Default: 7777)
 * 2. Live A-to-Z Analytics (Total Revenue, Users & Pro Members, Chats & Archives, System Health)
 * 3. User Management & 1-Click Gifting (Pro Plans, Free Chats, Custom Agent Slots, Block/Unblock)
 * 4. Global God-Mode Switches (Paywall ON/OFF, Pro Model Lock ON/OFF, Default Credits, Razorpay Mode)
 * 5. Payment & Transaction Ledger Logs
 * 6. Corporate Black & White Luxury Theme (OpenAI / Bloomberg Minimal Standard)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../services/adminService';
import { useLanguage } from '../utils/i18n';

export default function AdminDashboardModal({ visible, onClose, onSettingsUpdated }) {
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
    razorpayMode: 'test',
    maintenanceMode: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Transaction Logs State
  const [txLogs, setTxLogs] = useState([]);

  // Change PIN State
  const [newPinInput, setNewPinInput] = useState('');

  useEffect(() => {
    if (visible) {
      if (isAuthenticated) {
        refreshDashboardData();
      } else {
        setPinInput('');
        setPinError('');
      }
    }
  }, [visible, isAuthenticated]);

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
        // Refresh selected user reference
        const updatedSelected = users.find(u => u.id === selectedUser.id);
        if (updatedSelected) setSelectedUser(updatedSelected);
      }
      setSettings(globalConfig);
      setTxLogs(logs);
    } catch (e) {
      console.warn('Dashboard refresh error:', e);
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
      onSettingsUpdated?.();
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
      onSettingsUpdated?.();
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
      onSettingsUpdated?.();
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
      onSettingsUpdated?.();
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
      onSettingsUpdated?.();
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
      onSettingsUpdated?.();
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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top System Bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <View style={styles.godModePill}>
                <View style={styles.greenDot} />
                <Text style={styles.godModeText}>⚡ GOD-MODE ACTIVE</Text>
              </View>
              <Text style={styles.systemHeaderTitle}>SUPER ADMIN COMMAND</Text>
            </View>

            <View style={styles.topBarRight}>
              {isAuthenticated && (
                <TouchableOpacity style={styles.refreshBtn} onPress={refreshDashboardData} disabled={loading}>
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.refreshBtnText}>SYNC</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#AAAAAA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* SCREEN 1: PIN AUTHENTICATION GATE */}
          {!isAuthenticated ? (
            <View style={styles.authGateContainer}>
              <View style={styles.authShieldWrap}>
                <Ionicons name="shield-checkmark" size={42} color="#FFFFFF" />
              </View>
              <Text style={styles.authGateTitle}>SUPREME COMMAND CLEARANCE</Text>
              <Text style={styles.authGateSubtitle}>
                Enter the Sovereign Master PIN to unlock God-Mode Platform Controls.
              </Text>
              <Text style={styles.authDefaultHint}>Default PIN: 7777</Text>

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
                    <Text style={styles.unlockBtnText}>VERIFY & UNLOCK</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Quick Keypad Helper */}
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
                  >
                    <Text style={styles.keypadDigitText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.keypadDigit, { backgroundColor: '#222222' }]}
                  onPress={() => setPinInput('')}
                >
                  <Text style={[styles.keypadDigitText, { color: '#EF4444' }]}>C</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* SCREEN 2: GOD-MODE COMMAND DASHBOARD */
            <View style={{ flex: 1 }}>
              {/* Tab Navigation Switcher */}
              <View style={styles.tabNavRow}>
                {[
                  { key: 'ANALYTICS', label: '📊 ANALYTICS', icon: 'stats-chart-outline' },
                  { key: 'USERS', label: '🎁 USER GIFTS', icon: 'people-outline' },
                  { key: 'GLOBAL', label: '⚙️ GLOBAL ON/OFF', icon: 'toggle-outline' },
                  { key: 'LOGS', label: '📜 REVENUE LOGS', icon: 'receipt-outline' },
                  { key: 'SECURITY', label: '🔐 PIN', icon: 'key-outline' }
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
                      Real-time synchronized data across Razorpay, Supabase DB & Local Device Archives.
                    </Text>

                    {/* 4 Big KPI Cards */}
                    <View style={styles.kpiGrid}>
                      {/* Card 1: Total Revenue */}
                      <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
                        <View style={styles.kpiIconWrap}>
                          <Ionicons name="cash" size={20} color="#10B981" />
                        </View>
                        <Text style={styles.kpiLabel}>TOTAL REVENUE (કુલ આવક)</Text>
                        <Text style={styles.kpiValue}>
                          ₹{(analytics?.revenue?.total ?? 0).toLocaleString('en-IN')}
                        </Text>
                        <View style={styles.kpiSubRow}>
                          <Text style={styles.kpiSubText}>
                            1-Yr: ₹{(analytics?.revenue?.breakdown?.annual ?? 0).toLocaleString('en-IN')} • 6-Mo: ₹{(analytics?.revenue?.breakdown?.semiAnnual ?? 0).toLocaleString('en-IN')} • Slots: ₹{(analytics?.revenue?.breakdown?.agentSlots ?? 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      {/* Card 2: Total Users & Logins */}
                      <View style={styles.kpiCard}>
                        <View style={styles.kpiIconWrap}>
                          <Ionicons name="people" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.kpiLabel}>ACTIVE USERS & PRO SUBSCRIBERS</Text>
                        <Text style={styles.kpiValue}>
                          {analytics?.users?.total ?? 0} <Text style={styles.kpiValueSmall}>Users</Text>
                        </Text>
                        <View style={styles.kpiSubRow}>
                          <View style={styles.proCountPill}>
                            <Text style={styles.proCountPillText}>
                              👑 {analytics?.users?.pro ?? 0} Pro Subscribers
                            </Text>
                          </View>
                          <Text style={styles.kpiSubText}>
                            {analytics?.users?.free ?? 0} Free Tier
                          </Text>
                        </View>
                      </View>

                      {/* Card 3: Chats & Custom Masterminds */}
                      <View style={styles.kpiCard}>
                        <View style={styles.kpiIconWrap}>
                          <Ionicons name="chatbubbles" size={20} color="#D4AF37" />
                        </View>
                        <Text style={styles.kpiLabel}>ENGAGEMENT & PERSONAL AGENTS</Text>
                        <Text style={styles.kpiValue}>
                          {analytics?.engagement?.totalChats ?? 0} <Text style={styles.kpiValueSmall}>Chats</Text>
                        </Text>
                        <View style={styles.kpiSubRow}>
                          <Text style={styles.kpiSubText}>
                            Vault Agents: {analytics?.engagement?.totalCustomAgents ?? 0} Created
                          </Text>
                        </View>
                      </View>

                      {/* Card 4: System Health */}
                      <View style={styles.kpiCard}>
                        <View style={styles.kpiIconWrap}>
                          <Ionicons name="pulse" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.kpiLabel}>SYSTEM HEALTH & APIs</Text>
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
                    <Text style={styles.sectionHeading}>🎁 USER CONTROL & GIFTING CENTER</Text>
                    <Text style={styles.sectionSubheading}>
                      Select any member and execute 1-click Pro upgrades, free chat allocations, or custom agent slot grants.
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
                            <Ionicons name="person" size={20} color="#FFFFFF" />
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
                      Live configuration overrides. Changes instantly apply platform-wide to all active sessions.
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
                      Chronological audit trail of all real Razorpay payments and Admin gift actions.
                    </Text>

                    {txLogs.length === 0 ? (
                      <View style={styles.emptyLogsBox}>
                        <Ionicons name="receipt-outline" size={32} color="#555555" />
                        <Text style={styles.emptyLogsText}>No recorded transactions yet.</Text>
                      </View>
                    ) : (
                      txLogs.map((tx) => (
                        <View key={tx.id} style={styles.txCard}>
                          <View style={styles.txHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={[styles.txDot, tx.amount > 0 ? styles.txDotGreen : styles.txDotGold]} />
                              <Text style={styles.txPlanName}>{tx.planName || tx.type}</Text>
                            </View>
                            <Text style={styles.txAmount}>
                              {tx.amount > 0 ? `+₹${tx.amount}` : 'FREE GIFT'}
                            </Text>
                          </View>

                          <View style={styles.txDetailRow}>
                            <Text style={styles.txUserEmail}>{tx.userEmail || 'Anonymous'}</Text>
                            <Text style={styles.txDate}>{tx.date || new Date(tx.timestamp).toLocaleString()}</Text>
                          </View>

                          <View style={styles.txFooterRow}>
                            <View style={styles.txStatusPill}>
                              <Text style={styles.txStatusPillText}>{tx.status || 'PROCESSED'}</Text>
                            </View>
                            <Text style={styles.txIdText}>TX ID: {tx.id}</Text>
                          </View>
                        </View>
                      ))
                    )}
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

                    <View style={styles.card}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12
  },
  container: {
    width: '100%',
    maxWidth: 680,
    height: '94%',
    backgroundColor: '#080808',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#222222'
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  godModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  godModeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6
  },
  systemHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },

  // Auth Gate
  authGateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  authShieldWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  authGateTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 6
  },
  authGateSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
    marginBottom: 4
  },
  authDefaultHint: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 16
  },
  pinInputRow: {
    width: 180,
    marginBottom: 12
  },
  pinInput: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#383838',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 10,
    letterSpacing: 10
  },
  pinErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10
  },
  unlockBtn: {
    width: 220,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  unlockBtnContent: {
    flexDirection: 'row',
    alignItems: 'center'
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
    maxWidth: 280
  },
  keypadDigit: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center'
  },
  keypadDigitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },

  // Tab Navigation
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingHorizontal: 8
  },
  tabNavItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabNavItemActive: {
    borderBottomColor: '#FFFFFF'
  },
  tabNavText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700'
  },
  tabNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '900'
  },

  scrollBody: {
    padding: 16
  },
  tabContent: {
    flex: 1
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 2
  },
  sectionSubheading: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 16,
    lineHeight: 16
  },

  // KPI Grid
  kpiGrid: {
    gap: 12
  },
  kpiCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 14
  },
  kpiCardHighlight: {
    borderColor: '#10B981',
    backgroundColor: '#0c1a13'
  },
  kpiIconWrap: {
    marginBottom: 6
  },
  kpiLabel: {
    color: '#9CA3AF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900'
  },
  kpiValueSmall: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '600'
  },
  kpiSubRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  kpiSubText: {
    color: '#888888',
    fontSize: 10.5
  },
  proCountPill: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  proCountPillText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900'
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
    color: '#D1D5DB',
    fontSize: 11
  },
  healthBadgeGreen: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  healthBadgeGreenText: {
    color: '#34D399',
    fontSize: 9.5,
    fontWeight: '800'
  },
  healthBadgeBlue: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  healthBadgeBlueText: {
    color: '#60A5FA',
    fontSize: 9.5,
    fontWeight: '800'
  },
  healthBadgePurple: {
    backgroundColor: '#4c1d95',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  healthBadgePurpleText: {
    color: '#C084FC',
    fontSize: 9.5,
    fontWeight: '800'
  },

  // Users Tab
  userSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12
  },
  userSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 8,
    marginLeft: 6
  },
  selectedUserBox: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#383838',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16
  },
  selectedUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  userAvatarSquare: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  selectedUserEmail: {
    color: '#9CA3AF',
    fontSize: 11
  },
  selectedUserId: {
    color: '#666666',
    fontSize: 9.5
  },
  thisDeviceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3
  },
  thisDeviceBadgeText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900'
  },
  userPlanBadge: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  userPlanBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800'
  },
  userMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14
  },
  userMetricItem: {
    alignItems: 'center'
  },
  userMetricLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2
  },
  userMetricVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },

  actionButtonGroup: {
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingTop: 10
  },
  actionGroupTitle: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6
  },
  actionBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6
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
    fontSize: 10,
    fontWeight: '900'
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#261111',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  revokeBtnText: {
    color: '#EF4444',
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: '800'
  },
  toolBtnPurple: {
    backgroundColor: '#2e1065',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  toolBtnPurpleText: {
    color: '#C084FC',
    fontSize: 10,
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
    backgroundColor: '#7f1d1d',
    paddingVertical: 7,
    borderRadius: 6
  },
  unblockBtn: {
    backgroundColor: '#064e3b'
  },
  blockBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },

  userListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6
  },
  userListItemActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1A1A1A'
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
    marginTop: 1
  },
  userListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  proSmallBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  proSmallBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900'
  },
  freeSmallBadge: {
    backgroundColor: '#222222',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  freeSmallBadgeText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '700'
  },
  blockedBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  blockedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  },

  // Global Tab
  switchCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2
  },
  switchDesc: {
    color: '#888888',
    fontSize: 10.5,
    lineHeight: 15
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 95
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
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '900'
  },
  creditPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  creditPill: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  creditPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  creditPillText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '700'
  },
  creditPillTextActive: {
    color: '#000000',
    fontWeight: '900'
  },
  saveGlobalBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  saveGlobalBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8
  },

  // Logs Tab
  emptyLogsBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyLogsText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 8
  },
  txCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
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
    fontSize: 13,
    fontWeight: '900'
  },
  txDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  txUserEmail: {
    color: '#9CA3AF',
    fontSize: 10.5
  },
  txDate: {
    color: '#666666',
    fontSize: 9.5
  },
  txFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 4
  },
  txStatusPill: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  txStatusPillText: {
    color: '#D1D5DB',
    fontSize: 8.5,
    fontWeight: '800'
  },
  txIdText: {
    color: '#555555',
    fontSize: 8.5
  },

  // Security Tab
  card: {
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 14
  },
  newPinInput: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 10
  },
  updatePinBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  updatePinBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900'
  }
});
