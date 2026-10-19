/**
 * COUNCIL X | THE SYNDICATE
 * Custom Agents Vault Section
 * Dedicated Enclave for Personal Masterminds
 * Corporate Black & White Luxury Theme (OpenAI / Bloomberg Standard)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/i18n';
import { paymentService, loadRazorpayWebScript } from '../services/paymentService';
import { getGuaranteedAvatarUrl } from '../services/wikipediaService';

function CustomAgentAvatar({ agent, avatarStyle }) {
  const avatarUrl = getGuaranteedAvatarUrl(agent);
  return (
    <Image
      source={{ uri: avatarUrl }}
      style={avatarStyle}
      resizeMode="cover"
    />
  );
}

export default function CustomAgentsSection({
  customAgents = [],
  quota,
  onSelectAgent,
  onCreatePress,
  onDeleteAgent,
  onOpenPaywall,
  onQuotaRefresh
}) {
  const { lang, t, category } = useLanguage();
  const [purchasingSlot, setPurchasingSlot] = useState(false);
  const [showRzpSheet49, setShowRzpSheet49] = useState(false);
  const [selectedVaultCategory, setSelectedVaultCategory] = useState('All');

  const vaultCategories = React.useMemo(() => {
    const cats = ['All'];
    customAgents.forEach((a) => {
      if (a.category && !cats.includes(a.category)) {
        cats.push(a.category);
      }
    });
    return cats;
  }, [customAgents]);

  const displayedAgents = selectedVaultCategory === 'All'
    ? customAgents
    : customAgents.filter((a) => a.category === selectedVaultCategory);

  const getInspiringSubtext = () => {
    if (lang === 'gu') {
      return 'દુનિયાના કોઈપણ મહાપુરુષ, નેતા કે લીડરની બુદ્ધિમત્તા અને અનુભવને જીવંત કરો';
    }
    if (lang === 'hi') {
      return 'दुनिया के किसी भी महापुरुष, नेता या आइकन की बुद्धिमत्ता और अनुभव को जीवंत करें';
    }
    return 'Awaken the mind, strategy, and life experience of any global leader or icon';
  };

  const handleDeletePress = (agent) => {
    const confirmMsg = lang === 'gu'
      ? `શું તમે ખરેખર "${agent.name}" ને તમારા વૉલ્ટમાંથી દૂર કરવા માંગો છો?`
      : lang === 'hi'
      ? `क्या आप वाकई "${agent.name}" को अपने वॉल्ट से हटाना चाहते हैं?`
      : `Are you sure you want to permanently remove "${agent.name}" from your vault?`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(confirmMsg)) {
        onDeleteAgent?.(agent.id);
      }
      return;
    }

    Alert.alert(
      lang === 'gu' ? 'એજન્ટ દૂર કરો' : lang === 'hi' ? 'एजेंट हटाएं' : 'Remove Custom Mastermind',
      confirmMsg,
      [
        { text: t('close', 'Cancel'), style: 'cancel' },
        {
          text: lang === 'gu' ? 'દૂર કરો' : 'Delete',
          style: 'destructive',
          onPress: () => onDeleteAgent?.(agent.id)
        }
      ]
    );
  };

  const usedCount = quota?.createdCount ?? customAgents.length;

  const handleBuyExtraSlot49 = async () => {
    if (purchasingSlot) return;
    try {
      setPurchasingSlot(true);
      const order = await paymentService.createOrder('extra_agent_slot');
      
      if (Platform.OS === 'web') {
        const loaded = await loadRazorpayWebScript();
        if (!loaded || !window.Razorpay) {
          alert('Razorpay SDK failed to load. Please verify your internet connection.');
          setPurchasingSlot(false);
          return;
        }
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Council X | The Syndicate',
          description: '+1 Personal Agent Slot Upgrade',
          order_id: order.id,
          prefill: {
            name: 'Council Member',
            email: 'member@councilx.ai'
          },
          theme: { color: '#000000' },
          handler: async (response) => {
            const verifyRes = await paymentService.verifyPayment({
              ...response,
              plan_type: 'extra_agent_slot',
              plan_id: 'extra_agent_slot'
            });
            if (verifyRes.success) {
              await onQuotaRefresh?.();
              alert(lang === 'gu' ? 'સફળ! +1 પર્સનલ એજન્ટ સ્લોટ ઉમેરાયો છે.' : 'Success! +1 Personal Agent Slot added to your Vault.');
            }
          },
          modal: {
            ondismiss: () => setPurchasingSlot(false)
          }
        };
        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
        setPurchasingSlot(false);
      } else {
        setShowRzpSheet49(true);
        setPurchasingSlot(false);
      }
    } catch (err) {
      console.error('Buy 49 slot error:', err);
      Alert.alert('Payment Error', err.message || 'Unable to initiate purchase');
      setPurchasingSlot(false);
    }
  };

  const handleCompleteMobilePayment49 = async () => {
    try {
      setPurchasingSlot(true);
      const verifyRes = await paymentService.verifyPayment({
        razorpay_payment_id: `pay_agent49_${Date.now()}`,
        plan_type: 'extra_agent_slot',
        plan_id: 'extra_agent_slot'
      });
      setShowRzpSheet49(false);
      if (verifyRes.success) {
        await onQuotaRefresh?.();
        Alert.alert(
          'Success',
          lang === 'gu' ? 'સફળ! +1 પર્સનલ એજન્ટ સ્લોટ ઉમેરાયો છે.' : '+1 Personal Agent Slot added to your Vault!'
        );
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setPurchasingSlot(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Vault Status & Header Banner */}
      <View style={styles.vaultHeaderCard}>
        <View style={styles.headerTop}>
          <View style={styles.vaultIconCircle}>
            <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.vaultBadge}>PRIVATE ENCLAVE</Text>
            <Text style={styles.vaultTitle}>
              {lang === 'gu'
                ? 'મારા પર્સનલ માસ્ટરમાઇન્ડ્સ વૉલ્ટ'
                : lang === 'hi'
                ? 'मेरा पर्सनल मास्टरमाइंड्स वॉल्ट'
                : 'My Personal Masterminds Vault'}
            </Text>
            <Text style={styles.vaultSubtitle}>
              {getInspiringSubtext()}
            </Text>
          </View>
        </View>

        {/* Quota & Action Bar */}
        <View style={styles.quotaBar}>
          <View style={styles.quotaInfo}>
            <Text style={styles.quotaLabel}>VAULT CAPACITY:</Text>
            <Text style={styles.quotaValue}>
              {quota?.isUnlimited
                ? `${customAgents.length} / Unlimited`
                : `${usedCount} / ${quota?.totalAllowed || 1} ${usedCount >= (quota?.totalAllowed || 1) ? '(Used)' : ''}`}
              {' '}<Text style={styles.planTag}>({quota?.planName || 'Free Tier'})</Text>
            </Text>
          </View>

          <View style={styles.quotaActions}>
            <TouchableOpacity
              style={styles.buySlotBtn}
              onPress={handleBuyExtraSlot49}
              disabled={purchasingSlot}
              activeOpacity={0.85}
            >
              {purchasingSlot ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Ionicons name="flash" size={12} color="#000000" />
                  <Text style={styles.buySlotBtnText}>
                    {lang === 'gu' ? '+1 એજન્ટ (₹49)' : '+1 Slot (₹49)'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={onCreatePress}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={13} color="#000000" />
              <Text style={styles.createBtnText}>
                {lang === 'gu' ? '+ બનાવો' : '+ Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Standalone ₹49 Slot Banner */}
        <TouchableOpacity
          style={styles.standaloneSlotBanner}
          onPress={handleBuyExtraSlot49}
          disabled={purchasingSlot}
          activeOpacity={0.88}
        >
          <View style={styles.standaloneSlotLeft}>
            <View style={styles.flashIconBox}>
              <Ionicons name="flash" size={13} color="#000000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.standaloneSlotTitle}>
                {lang === 'gu'
                  ? '⚡ +1 પર્સનલ એજન્ટ ખરીદો (₹49)'
                  : lang === 'hi'
                  ? '⚡ +1 पर्सनल एजेंट खरीदें (₹49)'
                  : '⚡ Buy +1 Agent Slot (₹49)'}
              </Text>
              <Text style={styles.standaloneSlotSub}>
                {lang === 'gu'
                  ? 'સબ્સ્ક્રિપ્શન વિના વધારાનો કાયમી એજન્ટ સ્લોટ મેળવો'
                  : lang === 'hi'
                  ? 'बिना सब्सक्रिप्शन अतिरिक्त स्थायी एजेंट स्लॉट प्राप्त करें'
                  : 'Add a permanent agent slot anytime without monthly subscription'}
              </Text>
            </View>
          </View>
          <View style={styles.buyBadgeWhite}>
            <Text style={styles.buyBadgeWhiteText}>₹49</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Custom Agents List / Empty State */}
      {customAgents.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="sparkles-outline" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.emptyTitle}>
            {lang === 'gu'
              ? 'તમારો વૉલ્ટ હજી ખાલી છે'
              : lang === 'hi'
              ? 'आपका वॉल्ट अभी रिक्त है'
              : 'Your Vault is Currently Empty'}
          </Text>
          <Text style={styles.emptyDesc}>
            {getInspiringSubtext()}
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={onCreatePress}
            activeOpacity={0.88}
          >
            <Ionicons name="sparkles" size={15} color="#000000" />
            <Text style={styles.emptyActionText}>
              {lang === 'gu' ? '+ તમારો પ્રથમ એજન્ટ બનાવો' : '+ Create Your First Custom Agent'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {vaultCategories.length > 2 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vaultCatScroll}>
              {vaultCategories.map((cat) => {
                const isSelected = selectedVaultCategory === cat;
                const count = cat === 'All' ? customAgents.length : customAgents.filter((a) => a.category === cat).length;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.vaultCatChip, isSelected && styles.vaultCatChipActive]}
                    onPress={() => setSelectedVaultCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.vaultCatChipText, isSelected && styles.vaultCatChipTextActive]}>
                      {cat === 'All' ? (lang === 'gu' ? `બધા (${count})` : `All (${count})`) : `${category(cat)} (${count})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.agentsGrid}>
            {displayedAgents.map((agent) => (
              <TouchableOpacity
                key={agent.id}
                style={styles.agentCard}
                onPress={() => onSelectAgent(agent)}
                activeOpacity={0.88}
              >
              <View style={styles.cardTopRow}>
                <View style={styles.agentAvatarBox}>
                  <CustomAgentAvatar
                    agent={agent}
                    avatarStyle={styles.agentAvatarImg}
                    monogramStyle={styles.monogramAvatar}
                    textStyle={styles.monogramAvatarText}
                  />
                </View>

                <View style={styles.agentMeta}>
                  <Text style={styles.agentName} numberOfLines={1}>{agent.name}</Text>
                  <Text style={styles.agentRole} numberOfLines={1}>{agent.role || agent.name}</Text>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{category(agent.category)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeletePress(agent)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#888888" />
                </TouchableOpacity>
              </View>

              {agent.core_philosophy ? (
                <Text style={styles.philosophyQuote} numberOfLines={2}>
                  "{agent.core_philosophy}"
                </Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.enterCounselText}>{t('counselBtn', '1-ON-1 COUNSEL')}</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* In-App Razorpay Checkout Sheet for Mobile */}
      <Modal
        visible={showRzpSheet49}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRzpSheet49(false)}
      >
        <View style={styles.rzpModalOverlay}>
          <View style={styles.rzpModalBox}>
            <View style={styles.rzpHeader}>
              <View style={styles.rzpLogoWrap}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rzpTitle}>Razorpay Checkout</Text>
                <Text style={styles.rzpSub}>Council X | +1 Agent Slot (₹49)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRzpSheet49(false)}>
                <Ionicons name="close" size={20} color="#888888" />
              </TouchableOpacity>
            </View>

            <View style={styles.rzpDetails}>
              <View style={styles.rzpRow}>
                <Text style={styles.rzpLabel}>Item</Text>
                <Text style={styles.rzpValue}>+1 Custom Agent Slot</Text>
              </View>
              <View style={styles.rzpRow}>
                <Text style={styles.rzpLabel}>Validity</Text>
                <Text style={styles.rzpValue}>Permanent / Lifetime</Text>
              </View>
              <View style={[styles.rzpRow, styles.rzpTotalRow]}>
                <Text style={styles.rzpTotalLabel}>Total Amount</Text>
                <Text style={styles.rzpTotalValue}>₹49.00</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rzpPayBtn}
              onPress={handleCompleteMobilePayment49}
              disabled={purchasingSlot}
            >
              {purchasingSlot ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.rzpPayBtnText}>CONFIRM & PAY ₹49</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 130, // Smooth scrolling with plenty of breathing room
  },
  vaultHeaderCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  vaultIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  vaultBadge: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  vaultTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  vaultSubtitle: {
    color: '#A3A3A3',
    fontSize: 11,
    lineHeight: 15,
  },
  quotaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    paddingTop: 12,
    gap: 8,
  },
  quotaInfo: {
    flex: 1,
  },
  quotaLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  quotaValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  planTag: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '600',
  },
  quotaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buySlotBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  buySlotBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  createBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  createBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  standaloneSlotBanner: {
    marginTop: 12,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  standaloneSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  flashIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  standaloneSlotTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  standaloneSlotSub: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  buyBadgeWhite: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buyBadgeWhiteText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  rzpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rzpModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 20,
  },
  rzpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  rzpLogoWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rzpSub: {
    color: '#888888',
    fontSize: 11,
  },
  rzpDetails: {
    gap: 10,
    marginBottom: 18,
  },
  rzpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rzpLabel: {
    color: '#888888',
    fontSize: 12,
  },
  rzpValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rzpTotalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  rzpTotalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rzpTotalValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  rzpPayBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpPayBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    color: '#A3A3A3',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  emptyActionBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  emptyActionText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  agentsGrid: {
    gap: 12,
  },
  agentCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 14,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  agentAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#333333',
    overflow: 'hidden',
    backgroundColor: '#181818',
  },
  agentAvatarImg: {
    width: '100%',
    height: '100%',
  },
  monogramAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  agentMeta: {
    flex: 1,
  },
  agentName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  agentRole: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#181818',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#262626',
  },
  categoryPillText: {
    color: '#888888',
    fontSize: 9.5,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
  philosophyQuote: {
    color: '#A3A3A3',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
    backgroundColor: '#161616',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#333333',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 8,
  },
  enterCounselText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  vaultCatScroll: {
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  vaultCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    marginRight: 8,
  },
  vaultCatChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  vaultCatChipText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '700',
  },
  vaultCatChipTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
});
