/**
 * COUNCIL X | THE SYNDICATE
 * Home Screen: 216 Supreme Masterminds Command Center
 * - Full-Page Smooth Vertical Scrolling (Top to Bottom)
 * - Dedicated "My Personal Agents (મારા પર્સનલ એજન્ટ્સ)" Tab
 * - Inspiring, High-Status Copy on Create Agent Action
 * - Elite Corporate Black & White Luxury Theme (OpenAI / Bloomberg Standard)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../theme/colors';
import Header from '../components/Header';
import AgentCard from '../components/AgentCard';
import CategoryFilter from '../components/CategoryFilter';
import PaywallModal from '../components/PaywallModal';
import ProfileModal from '../components/ProfileModal';
import CreateAgentModal from '../components/CreateAgentModal';
import CustomAgentsSection from '../components/CustomAgentsSection';
import { agentService } from '../services/agentService';
import { paymentService } from '../services/paymentService';
import { getGuaranteedAvatarUrl } from '../services/wikipediaService';
import { useLanguage } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const { t, lang } = useLanguage();

  // Top Section Switcher: 'DIRECTORY' (216 Masterminds) vs 'VAULT' (My Custom Agents)
  const [activeSection, setActiveSection] = useState('DIRECTORY');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEra, setSelectedEra] = useState('All');
  const [customAgents, setCustomAgents] = useState([]);
  const [quota, setQuota] = useState(null);
  const [userStatus, setUserStatus] = useState({
    isPremium: false,
    remainingFree: 5,
    messageCount: 0,
    myReferralCode: 'CX-PRO'
  });
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [createAgentModalVisible, setCreateAgentModalVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const categories = useMemo(() => agentService.getCategories(), []);
  const eras = useMemo(() => agentService.getEras(), []);

  useEffect(() => {
    loadUserStatus();
    loadCustomAgents();
    // Cache bust old V9 image cache so updated 216 photos appear instantly
    AsyncStorage.getItem('@councilx_cache_busted_v10').then((busted) => {
      if (!busted) {
        AsyncStorage.setItem('@councilx_cache_busted_v10', 'true');
      }
    });
  }, []);

  const loadUserStatus = async () => {
    const status = await paymentService.getUserStatus();
    setUserStatus(status);
  };

  const loadCustomAgents = async () => {
    const list = await paymentService.getCustomAgents();
    setCustomAgents(list || []);
    const q = await paymentService.getCustomAgentQuota();
    setQuota(q);
  };

  // 100% PURE 216 MASTERMINDS (NEVER MIXED WITH CUSTOM AGENTS)
  const agents = useMemo(() => {
    return agentService.getAgents({
      category: selectedCategory,
      era: selectedEra,
      search: search,
      limit: 216
    });
  }, [selectedCategory, selectedEra, search]);

  const [paywallPlan, setPaywallPlan] = useState('ANNUAL');

  const handleSelectAgent = (agent) => {
    if (!agent) return;
    const raw = agent?.avatar_url || agent?.image_url || agent?.avatar || agent?.image;
    const avatar = (raw && typeof raw === 'string' && raw.includes('wikimedia.org')) ? raw : getGuaranteedAvatarUrl(agent);
    navigation.navigate('Chat', {
      agent: {
        id: agent.id || ('agent_' + (agent.name || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '_')),
        name: agent.name || 'Mastermind',
        title: agent.title || agent.role || agent.name || '',
        role: agent.role || agent.title || agent.name || '',
        avatar_url: avatar || '',
        image_url: avatar || '',
        avatar: avatar || '',
        image: avatar || '',
        bio: agent.bio || agent.core_philosophy || '',
        category: agent.category || 'General',
        is_custom: agent.is_custom || false,
        era: agent.era || ''
      },
      mode: 'single'
    });
  };

  const handleAgentCreated = (newAgent) => {
    if (!newAgent) return;
    loadCustomAgents();
    loadUserStatus();
    setActiveSection('VAULT');
    const raw = newAgent?.avatar_url || newAgent?.image_url || newAgent?.avatar || newAgent?.image;
    const avatar = (raw && typeof raw === 'string' && raw.includes('wikimedia.org')) ? raw : getGuaranteedAvatarUrl(newAgent);
    navigation.navigate('Chat', {
      agent: {
        id: newAgent.id || ('custom_' + Date.now()),
        name: newAgent.name || 'Personal Mastermind',
        title: newAgent.title || newAgent.role || newAgent.name || '',
        role: newAgent.role || newAgent.title || newAgent.name || '',
        avatar_url: avatar || '',
        image_url: avatar || '',
        avatar: avatar || '',
        image: avatar || '',
        bio: newAgent.bio || newAgent.core_philosophy || '',
        category: newAgent.category || 'General',
        is_custom: true,
        era: newAgent.era || 'Custom Mastermind'
      },
      mode: 'single'
    });
  };

  const handleDeleteCustomAgent = async (id) => {
    const updated = await paymentService.deleteCustomAgent(id);
    setCustomAgents(updated || []);
    const q = await paymentService.getCustomAgentQuota();
    setQuota(q);
  };

  const handleCopyMyCode = async () => {
    if (userStatus?.myReferralCode) {
      await Clipboard.setStringAsync(
        `Join me on Council X | The Syndicate! Use invite code ${userStatus.myReferralCode} to claim +15 FREE Mastermind Chats: https://councilx.ai`
      );
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // High-status inspiring button subtext
  const getInspiringSubtext = () => {
    if (lang === 'gu') {
      return 'દુનિયાના કોઈપણ મહાપુરુષ, નેતા કે લીડરની બુદ્ધિમત્તા અને અનુભવને જીવંત કરો';
    }
    if (lang === 'hi') {
      return 'दुनिया के किसी भी महापुरुष, नेता या आइकन की बुद्धिमत्ता और अनुभव को जीवंत करें';
    }
    return 'Awaken the mind, strategy, and life experience of any global leader or icon';
  };

  // Directory Header (Banner, Search, Era Tabs, Category Filter, Count indicator)
  // rendered inside FlatList ListHeaderComponent for full-page smooth scrolling!
  const renderDirectoryHeader = () => (
    <View style={styles.directoryHeaderContainer}>
      {/* Quick Action: Create Personal Thinker Banner */}
      <View style={styles.quickCreateBannerWrap}>
        <TouchableOpacity
          style={styles.quickCreateBanner}
          onPress={() => setCreateAgentModalVisible(true)}
          activeOpacity={0.88}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIconCircle}>
              <Ionicons name="sparkles" size={16} color="#000000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                {lang === 'gu'
                  ? '+ તમારો એજન્ટ બનાવો'
                  : lang === 'hi'
                  ? '+ अपना एजेंट बनाएं'
                  : '+ Create Custom Agent'}
              </Text>
              <Text style={styles.bannerSub} numberOfLines={2}>
                {getInspiringSubtext()}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder', 'Search 216 Masterminds (Krishna, Chanakya, Shivaji, Musk...)')}
            placeholderTextColor="#666666"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#888888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Era Tabs (All 216, Bharat 108, Modern 108) */}
      <View style={styles.eraRow}>
        {eras.map((era) => {
          const isSelected = selectedEra === era;
          let label = t('tabAll', 'All (216)');
          if (era.includes('Bharat')) label = t('tabBharat', '108 Bharat Vishwaguru');
          else if (era.includes('Modern')) label = t('tabModern', '108 Modern Global');

          return (
            <TouchableOpacity
              key={era}
              style={[styles.eraTab, isSelected && styles.selectedEraTab]}
              onPress={() => setSelectedEra(era)}
              activeOpacity={0.8}
            >
              <Text style={[styles.eraTabText, isSelected && styles.selectedEraTabText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Categories Bar */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Count Indicator */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCount}>
          {agents.length} {lang === 'gu' ? 'વિચારકો સક્રિય' : 'Masterminds Active'}
        </Text>
        <Text style={styles.resultsTradition}>
          {selectedEra === 'All' ? '108 Bharat + 108 Global' : selectedEra}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      <View style={styles.responsiveContainer}>
        {/* Top Header */}
        <Header
          title={t('appName', 'COUNCIL X')}
          isPremium={userStatus.isPremium}
          remainingFree={userStatus.remainingFree}
          onOpenSupremeCouncil={() => navigation.navigate('Syndicate')}
          onOpenReferral={() => setReferralModalVisible(true)}
          onOpenPricing={() => navigation.navigate('Pricing')}
          onOpenPaywall={() => navigation.navigate('Pricing')}
          onOpenProfile={() => setProfileModalVisible(true)}
          onOpenHistory={() => navigation.navigate('History')}
          onOpenSettings={() => setProfileModalVisible(true)}
        />

        {/* PRIMARY DUAL SECTION SWITCHER BAR */}
        <View style={styles.sectionSwitcherBar}>
          {/* Tab 1: 216 Grand Syndicate */}
          <TouchableOpacity
            style={[
              styles.sectionSwitchTab,
              activeSection === 'DIRECTORY' && styles.sectionSwitchTabActive
            ]}
            onPress={() => setActiveSection('DIRECTORY')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="shield"
              size={15}
              color={activeSection === 'DIRECTORY' ? '#000000' : '#888888'}
            />
            <Text
              style={[
                styles.sectionSwitchText,
                activeSection === 'DIRECTORY' && styles.sectionSwitchTextActive
              ]}
            >
              {lang === 'gu'
                ? '૨૧૬ સર્વોચ્ચ માસ્ટરમાઇન્ડ્સ'
                : lang === 'hi'
                ? '२१६ सर्वोच्च मास्टरमाइंड्स'
                : '216 Supreme Syndicate'}
            </Text>
            <View
              style={[
                styles.pillBadge216,
                activeSection === 'DIRECTORY' && styles.pillBadge216Active
              ]}
            >
              <Text
                style={[
                  styles.pillBadge216Text,
                  activeSection === 'DIRECTORY' && styles.pillBadge216TextActive
                ]}
              >
                216
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tab 2: Dedicated My Personal Agents (મારા પર્સનલ એજન્ટ્સ) */}
          <TouchableOpacity
            style={[
              styles.sectionSwitchTab,
              activeSection === 'VAULT' && styles.sectionSwitchTabActive
            ]}
            onPress={() => setActiveSection('VAULT')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="sparkles"
              size={15}
              color={activeSection === 'VAULT' ? '#000000' : '#888888'}
            />
            <Text
              style={[
                styles.sectionSwitchText,
                activeSection === 'VAULT' && styles.sectionSwitchTextActive
              ]}
            >
              {lang === 'gu'
                ? 'મારા પર્સનલ એજન્ટ્સ'
                : lang === 'hi'
                ? 'मेरे पर्सनल एजेंट्स'
                : 'My Personal Agents'}
            </Text>
            {customAgents.length > 0 && (
              <View
                style={[
                  styles.customCountPill,
                  activeSection === 'VAULT' && styles.customCountPillActive
                ]}
              >
                <Text
                  style={[
                    styles.customCountPillText,
                    activeSection === 'VAULT' && styles.customCountPillTextActive
                  ]}
                >
                  {customAgents.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* VIEW 1: DEDICATED MY CUSTOM MASTERMINDS VAULT */}
        {activeSection === 'VAULT' ? (
          <CustomAgentsSection
            customAgents={customAgents}
            quota={quota}
            onSelectAgent={handleSelectAgent}
            onCreatePress={() => setCreateAgentModalVisible(true)}
            onDeleteAgent={handleDeleteCustomAgent}
            onOpenPaywall={() => setPaywallVisible(true)}
          />
        ) : (
          /* VIEW 2: 216 MASTERMINDS FULL-PAGE SMOOTH SCROLLING */
          <FlatList
            style={{ flex: 1 }}
            data={agents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AgentCard agent={item} onPress={handleSelectAgent} />
            )}
            ListHeaderComponent={renderDirectoryHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-outline" size={38} color="#555555" />
                <Text style={styles.emptyTitle}>No Mastermind Located</Text>
                <Text style={styles.emptySubtitle}>
                  No sovereign matches your query across the 216 archives.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Create Custom Mastermind Modal */}
      <CreateAgentModal
        visible={createAgentModalVisible}
        onClose={() => {
          setCreateAgentModalVisible(false);
          loadCustomAgents();
        }}
        onAgentCreated={handleAgentCreated}
        onOpenPaywall={() => setPaywallVisible(true)}
      />

      {/* Profile & Settings Modal */}
      <ProfileModal
        visible={profileModalVisible}
        navigation={navigation}
        onOpenPricing={() => {
          setProfileModalVisible(false);
          navigation.navigate('Pricing');
        }}
        onClose={() => {
          setProfileModalVisible(false);
          loadUserStatus();
        }}
        onOpenPaywall={(planKey) => {
          if (planKey) setPaywallPlan(planKey);
          setPaywallVisible(true);
        }}
        onLogout={() => {
          setProfileModalVisible(false);
          if (navigation?.logout) {
            navigation.logout();
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          }
        }}
      />

      {/* Subscription Paywall Modal */}
      <PaywallModal
        visible={paywallVisible}
        initialPlanKey={paywallPlan}
        navigation={navigation}
        onOpenPricing={() => {
          setPaywallVisible(false);
          navigation.navigate('Pricing');
        }}
        onClose={() => setPaywallVisible(false)}
        onSuccess={async () => {
          setPaywallVisible(false);
          loadUserStatus();
        }}
      />

      {/* Quick Referral Modal */}
      <Modal
        visible={referralModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReferralModalVisible(false)}
      >
        <View style={styles.refModalOverlay}>
          <View style={styles.refModalContainer}>
            <View style={styles.refModalHeader}>
              <Ionicons name="gift" size={24} color="#FFFFFF" />
              <Text style={styles.refModalTitle}>{t('referralTitle', 'Referral Code & Free Credits')}</Text>
            </View>
            <Text style={styles.refModalDesc}>
              {t('referralDesc', 'Invite friends (+15 free chats for them, +30 for you)')}
            </Text>

            <View style={styles.refCodeBox}>
              <Text style={styles.refCodeVal}>{userStatus?.myReferralCode || 'CX-PRO'}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyMyCode}>
                <Ionicons name={copiedCode ? "checkmark" : "copy-outline"} size={16} color="#000000" />
                <Text style={styles.copyBtnText}>{copiedCode ? t('copied', 'Copied!') : t('copyCode', 'Copy')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.refCloseBtn}
              onPress={() => setReferralModalVisible(false)}
            >
              <Text style={styles.refCloseText}>{t('close', 'Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  sectionSwitcherBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#050505',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A'
  },
  sectionSwitchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#111111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222222',
    gap: 6
  },
  sectionSwitchTabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  sectionSwitchText: {
    color: '#888888',
    fontSize: 11.5,
    fontWeight: '700'
  },
  sectionSwitchTextActive: {
    color: '#000000',
    fontWeight: '900'
  },
  pillBadge216: {
    backgroundColor: '#202020',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  pillBadge216Active: {
    backgroundColor: '#E5E7EB',
  },
  pillBadge216Text: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '800'
  },
  pillBadge216TextActive: {
    color: '#000000',
  },
  customCountPill: {
    backgroundColor: '#333333',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8
  },
  customCountPillActive: {
    backgroundColor: '#000000',
  },
  customCountPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900'
  },
  customCountPillTextActive: {
    color: '#FFFFFF',
  },
  directoryHeaderContainer: {
    paddingBottom: 6,
  },
  quickCreateBannerWrap: {
    paddingTop: 10,
    paddingBottom: 6
  },
  quickCreateBanner: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  bannerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  bannerSub: {
    color: '#A3A3A3',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  searchContainer: {
    paddingVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#242424',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  eraRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
  },
  eraTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    backgroundColor: '#111111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  selectedEraTab: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  eraTabText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  selectedEraTabText: {
    color: '#000000',
    fontWeight: '900',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    marginBottom: 8,
  },
  resultsCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  resultsTradition: {
    color: '#888888',
    fontSize: 10.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 130, // Plenty of breathing room so zero cards get trapped at the bottom!
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  refModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  refModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#333333',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  refModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  refModalDesc: {
    color: '#A3A3A3',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  refCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  refCodeVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  refCloseBtn: {
    paddingVertical: 8,
  },
  refCloseText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '700',
  },
});
