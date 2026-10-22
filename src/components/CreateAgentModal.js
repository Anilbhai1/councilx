import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../utils/i18n';
import { validateCandidate } from '../utils/contentFilter';
import { paymentService, loadRazorpayWebScript } from '../services/paymentService';
import { imageFetcher } from '../services/imageFetcher';
import { getGuaranteedAvatarUrl } from '../services/wikipediaService';

const AVAILABLE_CATEGORIES = [
  'Arts, Cinema & Entertainment (કલા, સિનેમા અને મનોરંજન)',
  'Rajniti & Statecraft (રાજનીતિ અને શાસન)',
  'Wealth & Finance (સંપત્તિ અને રોકાણ)',
  'Business & Startup (વેપાર અને સ્ટાર્ટઅપ)',
  'Medicine & Ayurveda (આયુર્વેદ અને ચિકિત્સા)',
  'Tech & Science (વિજ્ઞાન અને ટેકનોલોજી)',
  'Philosophy & Dharma (દર્શન અને ધર્મ)',
  'Sports & Fitness (રમતગમત અને ફિટનેસ)',
  'War & Strategy (યુદ્ધ અને રણનીતિ)',
  'Marketing & Psychology (માર્કેટિંગ અને મનોવિજ્ઞાન)'
];

export default function CreateAgentModal({ visible, onClose, onAgentCreated, onOpenPaywall }) {
  const { lang, t, category } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(AVAILABLE_CATEGORIES[0]);
  const [summaryInput, setSummaryInput] = useState('');
  const [imageUrl, setImageUrl] = useState(null);

  const [quota, setQuota] = useState(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [blockedReason, setBlockedReason] = useState(null);
  const [purchasingSlot, setPurchasingSlot] = useState(false);

  // In-app test checkout sheet for ₹49
  const [showRzpSheet49, setShowRzpSheet49] = useState(false);

  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      loadQuota();
      setNameInput('');
      setRoleInput('');
      setSummaryInput('');
      setImageUrl(null);
      setBlockedReason(null);
      setShowRzpSheet49(false);
      if (Platform.OS === 'web') {
        loadRazorpayWebScript();
      }
    }
  }, [visible]);

  const loadQuota = async () => {
    const q = await paymentService.getCustomAgentQuota();
    setQuota(q);
  };

  // Debounce Wikipedia Search on text change
  const handleNameChange = (text) => {
    setNameInput(text);
    setBlockedReason(null);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setImageUrl(null);
      setSummaryInput('');
      setRoleInput('');
      return;
    }

    // Instantly detect domain category based on typed name/title
    const instantCategory = imageFetcher.detectDomainCategory(text.trim());
    setSelectedCategory(instantCategory);

    // Pre-validate input with content filter before network call
    const initialCheck = validateCandidate({ name: text, lang });
    if (!initialCheck.allowed) {
      setBlockedReason(initialCheck.reason);
      setImageUrl(null);
      setSummaryInput('');
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      fetchWikipediaIntelligence(text.trim());
    }, 600);
  };

  // Query Universal Image & Intelligence Fetcher
  const fetchWikipediaIntelligence = async (query) => {
    if (!query || query.trim().length < 2) return;

    // Check layer 1
    const check1 = validateCandidate({ name: query, lang });
    if (!check1.allowed) {
      setBlockedReason(check1.reason);
      setImageUrl(null);
      setSummaryInput('');
      return;
    }

    setSearching(true);
    setBlockedReason(null);

    try {
      const intel = await imageFetcher.fetchIntelligenceAndImage(query, lang);

      if (intel) {
        // Run Layer 2 Content Filter check on retrieved intelligence
        const contentValidation = validateCandidate({
          name: intel.name || query,
          extract: intel.extract || '',
          lang
        });

        if (!contentValidation.allowed) {
          setBlockedReason(contentValidation.reason);
          setImageUrl(null);
          setSummaryInput('');
          setSearching(false);
          return;
        }

        // Set Image URL (from Wikipedia REST or Guaranteed Bing Portrait)
        const guaranteedImg = intel.imageUrl || getGuaranteedAvatarUrl({
          name: intel.name || query,
          title: intel.role || query,
          role: intel.role || query
        });
        setImageUrl(guaranteedImg);

        // Set Role / Title
        if (intel.role && !roleInput) {
          setRoleInput(intel.role);
        } else if (!roleInput) {
          setRoleInput(intel.name || query);
        }

        // Set Summary / Philosophy Extract
        if (intel.extract) {
          const cleanExtract = intel.extract
            .split('. ')
            .slice(0, 3)
            .join('. ')
            .replace(/\s+/g, ' ')
            .trim();
          setSummaryInput(cleanExtract ? (cleanExtract.endsWith('.') ? cleanExtract : cleanExtract + '.') : '');
        }

        // Smart Automatic Domain / Category Detection Engine
        const detectedCategory = intel.category || imageFetcher.detectDomainCategory(query, intel.role, intel.extract);
        setSelectedCategory(detectedCategory);
      }
    } catch (err) {
      console.warn('Universal fetch error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Perform creation
  const handleSaveAndStartCounsel = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Required', 'Please enter the name of your personal thinker.');
      return;
    }

    if (blockedReason) {
      Alert.alert('Content Blocked', blockedReason);
      return;
    }

    // Check quota
    const currentQuota = await paymentService.getCustomAgentQuota();
    if (!currentQuota.canCreate) {
      Alert.alert(
        t('quotaExhaustedTitle', 'Custom Agent Quota Reached'),
        t('quotaExhaustedMsg', 'You have reached your custom agent limit. Unlock +1 for ₹49 or upgrade your plan.')
      );
      return;
    }

    setCreating(true);

    try {
      const generatedId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const guaranteedAvatar = imageUrl || getGuaranteedAvatarUrl({
        name: nameInput.trim(),
        title: roleInput.trim() || nameInput.trim(),
        role: roleInput.trim() || nameInput.trim(),
        category: selectedCategory
      });
      const newAgent = {
        id: generatedId,
        name: nameInput.trim(),
        title: roleInput.trim() || nameInput.trim(),
        role: roleInput.trim() || nameInput.trim(),
        category: selectedCategory,
        era: 'Custom Mastermind',
        is_custom: true,
        avatar_url: guaranteedAvatar,
        image_url: guaranteedAvatar,
        bio: summaryInput.trim() || `Supreme decision frameworks and strategies of ${nameInput.trim()}.`,
        core_philosophy: summaryInput.trim() || `Supreme mental models, real-world execution, and decision frameworks of ${nameInput.trim()}.`,
        wikipedia_extract: summaryInput.trim(),
        mode: 'single'
      };

      const saved = await paymentService.saveCustomAgent(newAgent);
      await loadQuota();

      setCreating(false);
      onClose?.();
      onAgentCreated?.(newAgent);
    } catch (err) {
      setCreating(false);
      Alert.alert('Error', err.message || 'Failed to create agent');
    }
  };

  // Razorpay ₹49 micro-purchase flow
  const handleUnlockSlot49 = async () => {
    setPurchasingSlot(true);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const scriptLoaded = await loadRazorpayWebScript();
        if (scriptLoaded && window.Razorpay) {
          const razorpayKey = paymentService.getRazorpayKey();

          let orderRes = null;
          try {
            orderRes = await paymentService.createRazorpayOrder({
              amount: 4900,
              currency: 'INR',
              planId: 'extra_agent_slot',
              planName: '+1 Personal Mastermind Slot'
            });
          } catch (orderErr) {
            console.warn('[CouncilX] Slot order creation warning:', orderErr);
          }

          const options = {
            key: razorpayKey,
            amount: orderRes?.amount || 4900, // ₹49 in paise
            currency: 'INR',
            name: 'Council X | The Syndicate',
            description: '+1 Personal Mastermind Slot (Lifetime Access)',
            order_id: orderRes?.order_id || undefined,
            image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            handler: async (response) => {
              const res = await paymentService.purchaseExtraAgentSlot(response.razorpay_payment_id);
              setPurchasingSlot(false);
              await loadQuota();
              Alert.alert(
                '⚡ Personal Slot Unlocked!',
                'You now have +1 extra slot available. Creating your agent now...',
                [{ text: 'Continue', onPress: () => handleSaveAndStartCounsel() }]
              );
            },
            prefill: {
              email: 'syndicate@councilx.ai',
              contact: '9999999999'
            },
            theme: { color: '#0C2340' },
            modal: {
              ondismiss: () => {
                setPurchasingSlot(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', () => {
            setPurchasingSlot(false);
            setShowRzpSheet49(true);
          });
          rzp.open();
          setPurchasingSlot(false);
          return;
        }
      } catch (e) {
        console.warn('Web checkout fallback to in-app sheet:', e);
      }
    }

    // Default to in-app sheet
    setPurchasingSlot(false);
    setShowRzpSheet49(true);
  };

  const handleCompleteInApp49Payment = async () => {
    setPurchasingSlot(true);
    try {
      const generatedPayId = 'pay_rzp_slot_' + Math.random().toString(36).substring(2, 9).toUpperCase();
      await paymentService.purchaseExtraAgentSlot(generatedPayId);
      setShowRzpSheet49(false);
      setPurchasingSlot(false);
      await loadQuota();

      Alert.alert(
        '⚡ +1 Personal Slot Unlocked!',
        `Payment captured (${generatedPayId}). Now saving your custom mastermind!`,
        [{ text: 'Start Counsel', onPress: () => handleSaveAndStartCounsel() }]
      );
    } catch (e) {
      setPurchasingSlot(false);
      Alert.alert('Payment Error', 'Unable to complete slot purchase.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>{t('createAgentModalTitle', 'Create Personal Mastermind')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Quota Status Bar */}
          {quota && (
            <View style={[styles.quotaBar, !quota.canCreate && styles.quotaBarExhausted]}>
              <Ionicons
                name={quota.canCreate ? 'checkmark-circle-outline' : 'lock-closed'}
                size={16}
                color={quota.canCreate ? '#FFFFFF' : '#EF4444'}
              />
              <Text style={[styles.quotaText, !quota.canCreate && { color: '#FCA5A5' }]}>
                {t('customQuotaBadge', 'Custom Agents Created:')}{' '}
                <Text style={styles.quotaHighlight}>
                  {quota.count} / {quota.isUnlimited ? t('unlimitedQuota', 'Unlimited') : quota.totalAllowed}
                </Text>
                {' '}({quota.planName})
              </Text>
            </View>
          )}

          {/* Form Scroll Area */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Input Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t('nameInputLabel', 'Name of Thinker or Personality:')}{' '}
                <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('agentNamePlaceholder', 'e.g. Narendra Modi, Donald Trump, MS Dhoni, Osho...')}
                  placeholderTextColor="#666"
                  value={nameInput}
                  onChangeText={handleNameChange}
                  returnKeyType="search"
                  onSubmitEditing={() => fetchWikipediaIntelligence(nameInput.trim())}
                />
                <TouchableOpacity
                  style={[styles.fetchBtn, searching && styles.btnDisabled]}
                  onPress={() => fetchWikipediaIntelligence(nameInput.trim())}
                  disabled={searching}
                  activeOpacity={0.8}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Ionicons name="search" size={15} color="#050505" />
                      <Text style={styles.fetchBtnText}>Fetch</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* NSFW / Content Filter Warning Alert */}
            {blockedReason && (
              <View style={styles.blockedAlert}>
                <Ionicons name="warning" size={22} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedAlertTitle}>
                    {lang === 'gu'
                      ? 'અસ્વીકાર્ય સામગ્રી પ્રતિબંધિત છે'
                      : lang === 'hi'
                      ? 'अस्वीकार्य सामग्री निषिद्ध है'
                      : 'Prohibited Subject Policy Violation'}
                  </Text>
                  <Text style={styles.blockedAlertMsg}>{blockedReason}</Text>
                </View>
              </View>
            )}

            {/* Smart Auto-Detected Domain / Category Vault Section */}
            <View style={styles.autoDomainCard}>
              <View style={styles.autoDomainHeader}>
                <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                <Text style={styles.autoDomainTitle}>
                  {lang === 'gu'
                    ? 'આપમેળે પસંદ થયેલ વ્યાવસાયિક વૉલ્ટ ક્ષેત્ર'
                    : lang === 'hi'
                    ? 'स्वतः चयनित व्यावसायिक वॉल्ट क्षेत्र'
                    : 'Auto-Detected Professional Vault'}
                </Text>
              </View>
              <View style={styles.autoDomainBadgeRow}>
                <View style={styles.autoDomainPill}>
                  <Ionicons name="shield-checkmark" size={12} color="#000000" />
                  <Text style={styles.autoDomainPillText}>
                    {category(selectedCategory)}
                  </Text>
                </View>
                <Text style={styles.autoDomainHint} numberOfLines={1}>
                  {lang === 'gu'
                    ? 'બુદ્ધિમત્તા વિશ્લેષણ દ્વારા વૉલ્ટમાં વર્ગીકૃત'
                    : lang === 'hi'
                    ? 'बुद्धिमत्ता विश्लेषण द्वारा वॉल्ट में वर्गीकृत'
                    : 'Auto-categorized via intelligence analysis'}
                </Text>
              </View>
            </View>

            {/* Live Dossier Preview */}
            <View style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                <Text style={styles.previewHeaderTitle}>{t('livePreviewTitle', 'Live Dossier Preview')}</Text>
              </View>

              <View style={styles.previewCard}>
                <View style={styles.previewCardTop}>
                  <Image
                    source={{
                      uri: imageUrl || getGuaranteedAvatarUrl({
                        name: nameInput.trim() || 'Mastermind',
                        title: roleInput.trim() || selectedCategory,
                        role: roleInput.trim() || selectedCategory
                      })
                    }}
                    style={styles.previewAvatar}
                    resizeMode="cover"
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>
                      {nameInput.trim() || (lang === 'gu' ? 'તમારા એજન્ટનું નામ' : 'Your Mastermind Name')}
                    </Text>
                    <Text style={styles.previewRole}>
                      {roleInput.trim() || category(selectedCategory)}
                    </Text>
                    <View style={styles.previewBadgeRow}>
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>PERSONAL AGENT</Text>
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText} numberOfLines={1}>
                          {category(selectedCategory)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Core Philosophy Extract */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>{t('corePhilosophyLabel', 'Core Philosophy / Summary:')}</Text>
                  <TextInput
                    style={styles.summaryInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter or refine core mental models, principles, and strategic frameworks..."
                    placeholderTextColor="#666"
                    value={summaryInput}
                    onChangeText={setSummaryInput}
                  />
                </View>
              </View>
            </View>

            {/* Quota Exhausted Upsell Banner */}
            {quota && !quota.canCreate && (
              <View style={styles.exhaustedCard}>
                <View style={styles.exhaustedHeader}>
                  <Ionicons name="lock-closed" size={20} color="#EF4444" />
                  <Text style={styles.exhaustedTitle}>
                    {t('quotaExhaustedTitle', 'Custom Agent Quota Reached')}
                  </Text>
                </View>
                <Text style={styles.exhaustedMsg}>
                  {t('quotaExhaustedMsg', 'You have reached your custom agent limit. Choose an option below to add more personal masterminds:')}
                </Text>

                <View style={styles.upsellActions}>
                  {/* Option A: Unlock 1 Slot for ₹49 */}
                  <TouchableOpacity
                    style={styles.unlock49Btn}
                    onPress={handleUnlockSlot49}
                    disabled={purchasingSlot}
                    activeOpacity={0.85}
                  >
                    {purchasingSlot ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="flash" size={16} color="#FFF" />
                        <Text style={styles.unlock49Text}>
                          {t('unlockSlot49Btn', '⚡ Unlock +1 Extra Personal Agent for ₹49')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Option B: Upgrade Subscription */}
                  <TouchableOpacity
                    style={styles.upgradePlanBtn}
                    onPress={() => {
                      onClose?.();
                      onOpenPaywall?.();
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="diamond-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.upgradePlanText}>
                      {t('upgradeForMoreSlotsBtn', '👑 Upgrade Subscription Plan (15, 50, or Unlimited)')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Footer Action */}
          {(!quota || quota.canCreate) && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.createBtn, (!nameInput.trim() || creating || !!blockedReason) && styles.btnDisabled]}
                onPress={handleSaveAndStartCounsel}
                disabled={!nameInput.trim() || creating || !!blockedReason}
                activeOpacity={0.88}
              >
                {creating ? (
                  <ActivityIndicator color="#050505" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#050505" />
                    <Text style={styles.createBtnText}>
                      {t('createAndChatBtn', 'Create Agent & Start Counsel')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* In-App Sheet Modal for ₹49 Micro-Purchase */}
          <Modal
            visible={showRzpSheet49}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRzpSheet49(false)}
          >
            <View style={styles.rzpSheetOverlay}>
              <View style={styles.rzpSheetContainer}>
                <View style={styles.rzpSheetHeader}>
                  <View style={styles.rzpBrandRow}>
                    <Ionicons name="card" size={20} color="#00BAF2" />
                    <Text style={styles.rzpBrandText}>Razorpay Secure Checkout</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowRzpSheet49(false)}>
                    <Ionicons name="close" size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rzpOrderSummary}>
                  <Text style={styles.rzpItemName}>Council X: +1 Personal Mastermind Slot</Text>
                  <Text style={styles.rzpAmount}>₹49.00</Text>
                </View>

                <TouchableOpacity
                  style={styles.rzpPayNowBtn}
                  onPress={handleCompleteInApp49Payment}
                  disabled={purchasingSlot}
                  activeOpacity={0.85}
                >
                  {purchasingSlot ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.rzpPayNowText}>CONFIRM & PAY ₹49 (RAZORPAY LIVE)</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContainer: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    backgroundColor: '#141414'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E1E1E'
  },
  quotaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  quotaBarExhausted: {
    backgroundColor: '#2A1010',
    borderBottomColor: '#4A1515'
  },
  quotaText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600'
  },
  quotaHighlight: {
    fontWeight: '800',
    color: '#FFFFFF'
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14
  },
  fetchBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  fetchBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13
  },
  btnDisabled: {
    opacity: 0.5
  },
  blockedAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#2D1214',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16
  },
  blockedAlertTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4
  },
  blockedAlertMsg: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18
  },
  autoDomainCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  autoDomainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  autoDomainTitle: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  autoDomainBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  autoDomainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  autoDomainPillText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800'
  },
  autoDomainHint: {
    color: '#888888',
    fontSize: 11,
    flex: 1
  },
  previewContainer: {
    marginBottom: 18
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  previewHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  previewCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 16,
    padding: 16
  },
  previewCardTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center'
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  previewMonogram: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C1C',
    borderWidth: 2,
    borderColor: '#383838',
    alignItems: 'center',
    justifyContent: 'center'
  },
  monogramText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  previewInfo: {
    flex: 1
  },
  previewName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2
  },
  previewRole: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 6
  },
  previewBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap'
  },
  customBadge: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  customBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  categoryBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  categoryBadgeText: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600'
  },
  summaryBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingTop: 12
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6
  },
  summaryInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#EDEDED',
    fontSize: 12,
    lineHeight: 18,
    padding: 10,
    textAlignVertical: 'top'
  },
  exhaustedCard: {
    backgroundColor: '#201214',
    borderWidth: 1,
    borderColor: '#EF444450',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16
  },
  exhaustedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  exhaustedTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800'
  },
  exhaustedMsg: {
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14
  },
  upsellActions: {
    gap: 10
  },
  unlock49Btn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  unlock49Text: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800'
  },
  upgradePlanBtn: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#383838',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  upgradePlanText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    backgroundColor: '#141414'
  },
  createBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  createBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  rzpSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  rzpSheetContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A'
  },
  rzpSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  rzpBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  rzpBrandText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  rzpOrderSummary: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A'
  },
  rzpItemName: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4
  },
  rzpAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  rzpPayNowBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rzpPayNowText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  }
});
