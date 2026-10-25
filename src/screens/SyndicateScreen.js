/**
 * COUNCIL X | THE SYNDICATE
 * ALL-IN-ONE 216 SUPREME COUNCIL (૨૧૬ સર્વોચ્ચ મહા-સભા)
 * Google Gemini / ChatGPT Pro Standard Strategic War Room
 * 
 * Unites all 108 Bharat Vishwagurus + 108 Modern Global Visionaries
 * Corporate Black & White Luxury Theme (Clean 100% Chat Bubble Standard)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../theme/colors';
import FormattedMessage from '../components/FormattedMessage';
import QuoteCardModal from '../components/QuoteCardModal';
import FollowUpChips from '../components/FollowUpChips';
import PaywallModal from '../components/PaywallModal';
import { geminiService } from '../services/geminiService';
import { paymentService } from '../services/paymentService';
import { chatService } from '../services/chatService';
import { voiceService } from '../services/voiceService';
import { useLanguage } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNCIL_STORAGE_KEY = 'COUNCILX_CHAT_ALL_216';

export default function SyndicateScreen({ route, navigation }) {
  const { existingSession } = route.params || {};
  const { t, lang, getThinkingState } = useLanguage();

  const [conversationId, setConversationId] = useState(
    existingSession?.id || `council216_${Date.now()}`
  );
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [userStatus, setUserStatus] = useState({ isPremium: false, remainingFree: 5 });
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Gemini-style model and depth
  const [modelType, setModelType] = useState('flash');
  const [thinkingDepth, setThinkingDepth] = useState('medium');
  const [thinkingPhase, setThinkingPhase] = useState(0);

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    return () => {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  // Animated thinking state cycle
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setThinkingPhase((prev) => (prev + 1) % 3);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadInitialData = async () => {
    const status = await paymentService.getUserStatus();
    setUserStatus(status);

    if (existingSession && existingSession.messages && existingSession.messages.length > 0) {
      setConversationId(existingSession.id);
      setMessages(existingSession.messages);
      const lastMsg = existingSession.messages[existingSession.messages.length - 1];
      if (lastMsg && lastMsg.followUpQuestions) {
        setFollowUpQuestions(lastMsg.followUpQuestions);
      }
      return;
    }

    try {
      const savedCouncil = await AsyncStorage.getItem(COUNCIL_STORAGE_KEY);
      if (savedCouncil) {
        const parsed = JSON.parse(savedCouncil);
        if (parsed && parsed.length > 0) {
          setMessages(parsed);
          const lastMsg = parsed[parsed.length - 1];
          if (lastMsg && lastMsg.followUpQuestions) {
            setFollowUpQuestions(lastMsg.followUpQuestions);
          }
          return;
        }
      }

      const allSessions = await chatService.getConversations();
      const prior = allSessions.find(s => s.mode === 'supreme_council');
      if (prior && prior.messages && prior.messages.length > 0) {
        setConversationId(prior.id);
        setMessages(prior.messages);
        const lastMsg = prior.messages[prior.messages.length - 1];
        if (lastMsg && lastMsg.followUpQuestions) {
          setFollowUpQuestions(lastMsg.followUpQuestions);
        }
        return;
      }
    } catch (e) {}

    const welcomeMsg = {
      id: `msg_council_init`,
      role: 'assistant',
      content: lang === 'gu'
        ? `અમે ૨૧૬ સર્વોચ્ચ મહા-સભા છીએ. ૧૦૮ ભારત વિશ્વગુરુ અને ૧૦૮ આધુનિક વૈશ્વિક વિચારકોનું સંયુક્ત માર્ગદર્શન. તમારો જીવનનો પડકાર, વ્યાપારિક ગૂંચવણ અથવા નિર્ણાયક પ્રશ્ન રજૂ કરો.`
        : lang === 'hi'
        ? `हम २१६ सर्वोच्च महा-सभा हैं। १०८ भारत विश्वगुरु और १०८ आधुनिक वैश्विक विचारकों का संयुक्त मार्गदर्शन। अपनी रणनीतिक दुविधा प्रस्तुत करें।`
        : `We are the 216 Supreme Council. A unified strategic synthesis of 108 Bharat Legends and 108 Modern Global Visionaries. State your strategic crossroad before this chamber.`,
      agent_name: t('supremeCouncilBadge', '૨૧૬ મહા-સભા'),
      createdAt: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
    setFollowUpQuestions([]);
  };

  /**
   * Typewriter Streaming Effect Simulation
   */
  const streamResponse = async (fullContent, assistantMsgId) => {
    setIsStreaming(true);
    const words = fullContent.split(' ');
    let currentText = '';
    const chunkSize = 3;

    for (let i = 0; i < words.length; i += chunkSize) {
      currentText += (i === 0 ? '' : ' ') + words.slice(i, i + chunkSize).join(' ');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, content: currentText } : msg
        )
      );
      await new Promise((r) => setTimeout(r, 26));
      flatListRef.current?.scrollToEnd({ animated: true });
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
      )
    );
    setIsStreaming(false);
  };

  const handleSendMessage = async (textToSend) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || loading || isStreaming) return;

    // Check freemium limit
    const status = await paymentService.getUserStatus();
    if (!status.isPremium && status.messageCount >= status.totalAllowedFree) {
      setPaywallVisible(true);
      return;
    }

    setInputText('');
    setFollowUpQuestions([]);

    const userMsg = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const newStatus = await paymentService.incrementMessageCount();
    setUserStatus(newStatus);

    try {
      // Pass full conversation history for persistent context retention
      const aiResult = await geminiService.generateSupremeCouncil216Response({
        userDilemma: prompt,
        chatHistory: updatedMessages,
        language: lang,
        modelType,
        thinkingDepth,
        isPremium: status.isPremium
      });

      const assistantMsgId = `msg_a_${Date.now()}`;
      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        agent_name: t('supremeCouncilBadge', '૨૧૬ મહા-સભા'),
        followUpQuestions: aiResult.followUpQuestions,
        createdAt: new Date().toISOString()
      };

      setMessages([...updatedMessages, assistantMsg]);
      setLoading(false);

      // Smooth typewriter streaming
      await streamResponse(aiResult.content, assistantMsgId);

      // Reveal dynamic contextual follow-ups
      setFollowUpQuestions(aiResult.followUpQuestions || []);

      // Persist full conversation in COUNCILX_CHAT_ALL_216 and Supabase
      const finalChat = [...updatedMessages, { ...assistantMsg, content: aiResult.content }];
      await AsyncStorage.setItem(COUNCIL_STORAGE_KEY, JSON.stringify(finalChat));

      await chatService.saveConversation({
        id: conversationId,
        mode: 'supreme_council',
        title: `Supreme Council: ${prompt.substring(0, 35)}...`,
        preview: aiResult.content.substring(0, 80),
        messages: finalChat
      });
    } catch (err) {
      console.error('Supreme council error:', err);
      setLoading(false);
      setIsStreaming(false);
      Alert.alert('Chamber Interrupted', 'The supreme council deliberation could not connect.');
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      const started = voiceService.startListening({
        lang,
        onTranscript: (liveText) => setInputText(liveText),
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false)
      });
      if (started) setIsListening(true);
    }
  };

  const handleToggleListenMessage = (msgId, text) => {
    if (speakingMsgId === msgId) {
      voiceService.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      voiceService.speak({
        text,
        lang,
        onStart: () => setSpeakingMsgId(msgId),
        onEnd: () => setSpeakingMsgId(null)
      });
    }
  };

  const getThinkingStepText = () => {
    return getThinkingState('', true);
  };

  const isInputLocked = loading || isStreaming;

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';
    const isSpeakingThis = speakingMsgId === item.id;

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.councilInsigniaCircle}>
            <Ionicons name="eye-outline" size={17} color="#FFFFFF" />
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {!isUser && (
            <View style={styles.agentHeaderLine}>
              <View style={styles.councilTitlePill}>
                <Ionicons name="diamond" size={11} color="#FFFFFF" />
                <Text style={styles.agentMsgName}>{item.agent_name || '216 SUPREME COUNCIL'}</Text>
              </View>

              <View style={styles.assistantActionIcons}>
                <TouchableOpacity
                  style={styles.listenIconBtn}
                  onPress={() => handleToggleListenMessage(item.id, item.content)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isSpeakingThis ? "volume-high" : "volume-medium-outline"}
                    size={14}
                    color={isSpeakingThis ? '#FFFFFF' : '#A3A3A3'}
                  />
                  <Text style={[styles.listenBtnText, isSpeakingThis && { color: '#FFFFFF' }]}>
                    {isSpeakingThis ? t('stopListen', 'Stop') : t('listen', 'Listen')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareCardIconBtn}
                  onPress={() => setSelectedQuote(item.content)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sparkles-outline" size={13} color="#A3A3A3" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 100% Clean Formatted Message (No Blueprint Download Bar underneath) */}
          <FormattedMessage content={item.content} isUser={isUser} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerInsignia}>
          <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {t('supremeCouncilTitle', '216 SUPREME COUNCIL')}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            108 Bharat Vishwaguru + 108 Modern Global
          </Text>
        </View>

        <TouchableOpacity
          style={styles.counterBadge}
          onPress={() => !userStatus.isPremium && setPaywallVisible(true)}
        >
          <Ionicons
            name={userStatus.isPremium ? "shield-checkmark" : "time-outline"}
            size={11}
            color="#FFFFFF"
          />
          <Text style={styles.counterText}>
            {userStatus.isPremium ? t('proBadge', 'PRO') : `${userStatus.remainingFree} ${t('freeBadge', 'LEFT')}`}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Animated Thinking State */}
        {loading && (
          <View style={styles.thinkingContainer}>
            <View style={styles.thinkingGlowBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.thinkingText}>{getThinkingStepText()}</Text>
            </View>
          </View>
        )}

        {/* Dynamic Context-Aware Follow-up Chips */}
        {!isInputLocked && followUpQuestions.length > 0 && (
          <FollowUpChips
            questions={followUpQuestions}
            onSelectQuestion={(q) => handleSendMessage(q)}
          />
        )}

        {/* Corporate Model & Thinking Depth Selector Bar */}
        <View style={styles.selectorBar}>
          <View style={styles.modelToggleGroup}>
            <TouchableOpacity
              style={[styles.modelPill, modelType === 'flash' && styles.modelPillActive]}
              onPress={() => setModelType('flash')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modelPillText, modelType === 'flash' && styles.modelPillTextActive]}>
                {t('modelFlash', '⚡ 3.0 Flash')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modelPill, modelType === 'pro' && styles.modelPillActivePro]}
              onPress={() => {
                if (!userStatus.isPremium) {
                  Alert.alert(
                    '👑 Syndicate 3.1 Pro Model',
                    t('modelProLockedHint', '3.1 Pro model is exclusive to Syndicate Pro members. Provides 10x deeper multi-dimensional strategic reasoning.'),
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Upgrade to Pro', onPress: () => setPaywallVisible(true) }
                    ]
                  );
                } else {
                  setModelType('pro');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modelPillText, modelType === 'pro' && styles.modelPillTextActivePro]}>
                {t('modelPro', '👑 3.1 Pro')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.depthSelectorGroup}>
            <Text style={styles.depthPrefix}>{t('depthLabel', 'Depth:')}</Text>
            {[
              { key: 'low', label: t('depthLow', 'Low') },
              { key: 'medium', label: t('depthMedium', 'Med') },
              { key: 'high', label: t('depthHigh', 'High') },
              { key: 'ultra', label: t('depthUltra', 'Ultra') }
            ].map((d) => {
              const isSelected = thinkingDepth === d.key;
              const isUltra = d.key === 'ultra';
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.depthPill,
                    isSelected && styles.depthPillActive,
                    isUltra && styles.ultraDepthPill
                  ]}
                  onPress={() => {
                    if (isUltra && !userStatus.isPremium) {
                      setPaywallVisible(true);
                    } else {
                      setThinkingDepth(d.key);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.depthPillText, isSelected && styles.depthPillTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Corporate Input Bar with White Send Button */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micBtnActive]}
            onPress={handleToggleVoiceInput}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? "mic" : "mic-outline"}
              size={18}
              color={isListening ? '#EF4444' : '#D1D5DB'}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={isListening ? t('listening', 'Listening...') : t('chatInputPlaceholder', 'Ask your dilemma before all 216...')}
            placeholderTextColor="#666666"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={600}
            editable={!isInputLocked}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isInputLocked) && styles.sendBtnDisabled
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isInputLocked}
          >
            {isInputLocked ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Ionicons name="arrow-up" size={17} color={inputText.trim() ? '#000000' : '#888888'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <QuoteCardModal
        visible={Boolean(selectedQuote)}
        quote={selectedQuote}
        agent={{
          name: t('supremeCouncilTitle', '216 Supreme Council'),
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        }}
        onClose={() => setSelectedQuote(null)}
      />

      <PaywallModal
        visible={paywallVisible}
        navigation={navigation}
        onOpenPricing={() => {
          setPaywallVisible(false);
          navigation.navigate('Pricing');
        }}
        onClose={() => setPaywallVisible(false)}
        onSuccess={async () => {
          setPaywallVisible(false);
          const updated = await paymentService.getUserStatus();
          setUserStatus(updated);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerInsignia: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerTitle: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  councilInsigniaCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 12,
    padding: 13,
  },
  userBubble: {
    backgroundColor: '#202020',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#242424',
    borderBottomLeftRadius: 2,
  },
  agentHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  councilTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  agentMsgName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  assistantActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listenIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listenBtnText: {
    color: '#D1D5DB',
    fontSize: 9.5,
    fontWeight: '700',
  },
  shareCardIconBtn: {
    padding: 3,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 6,
  },
  thinkingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  thinkingGlowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  thinkingText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '600',
  },
  selectorBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modelToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 2,
    gap: 2,
  },
  modelPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modelPillActive: {
    backgroundColor: '#FFFFFF',
  },
  modelPillActivePro: {
    backgroundColor: '#FFFFFF',
  },
  modelPillText: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
  },
  modelPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  modelPillTextActivePro: {
    color: '#000000',
    fontWeight: '900',
  },
  depthSelectorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  depthPrefix: {
    color: '#666666',
    fontSize: 9.5,
    fontWeight: '700',
    marginRight: 2,
  },
  depthPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222222',
  },
  depthPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  ultraDepthPill: {
    borderColor: '#383838',
  },
  depthPillText: {
    color: '#888888',
    fontSize: 9.5,
    fontWeight: '700',
  },
  depthPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    maxHeight: 90,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#141414',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#262626',
  },
});
