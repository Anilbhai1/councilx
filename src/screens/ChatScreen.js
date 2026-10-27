/**
 * COUNCIL X | THE SYNDICATE
 * 1-on-1 Mastermind Strategic War Room (Corporate Black & White Luxury Standard)
 * 
 * Features:
 * 1. 100% Authentic First-Person Mastermind Embodiment (Zero "intellectual engine", zero prompt dumps)
 * 2. 100% Clean Chat Bubbles (No "Executive Blueprint (Pro)" download bar underneath messages)
 * 3. Permanent Long-Term Memory & Continuity (remembers full chat history via AsyncStorage & Supabase)
 * 4. 100% Dynamic, in-language strategic follow-up chips
 * 5. High-speed Typewriter Streaming with input button lock
 * 6. Voice Input (Speech-to-Text mic) & Voice Output (Listen TTS)
 * 7. Corporate Black & White Luxury Theme (OpenAI / Bloomberg Standard)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
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
import FollowUpChips from '../components/FollowUpChips';
import QuoteCardModal from '../components/QuoteCardModal';
import PaywallModal from '../components/PaywallModal';
import ChatHistoryDrawer from '../components/ChatHistoryDrawer';
import { geminiService } from '../services/geminiService';
import { paymentService } from '../services/paymentService';
import { chatService } from '../services/chatService';
import {
  wikipediaService,
  getGuaranteedAvatarUrl,
  getFaceFallbackUrl
} from '../services/wikipediaService';
import AvatarComponent from '../components/AvatarComponent';
import { voiceService } from '../services/voiceService';
import { useLanguage } from '../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../services/adminService';

export default function ChatScreen({ route, navigation }) {
  const { agent, existingSession } = route.params || {};
  const { t, lang, getThinkingState } = useLanguage();

  const agentStorageKey = `COUNCILX_CHAT_AGENT_${agent?.id || agent?.name || 'mastermind'}`;
  const rawCandidate = agent?.avatar_url || agent?.image_url || agent?.avatar || agent?.image || '';
  const isWiki = typeof rawCandidate === 'string' && rawCandidate.includes('wikimedia.org');
  const fallbackAvatar = getFaceFallbackUrl(agent) || 'https://tse2.mm.bing.net/th?q=portrait&w=400&h=400&c=7&rs=1&p=0&pid=Api';
  const guaranteedAvatar = isWiki ? rawCandidate : (getGuaranteedAvatarUrl(agent) || fallbackAvatar);

  const [headerAvatarUri, setHeaderAvatarUri] = useState(guaranteedAvatar || fallbackAvatar);

  useEffect(() => {
    if (!agent) return;
    const raw = agent?.avatar_url || agent?.image_url || agent?.avatar || agent?.image || '';
    const wiki = typeof raw === 'string' && raw.includes('wikimedia.org');
    setHeaderAvatarUri(wiki ? raw : (getGuaranteedAvatarUrl(agent) || fallbackAvatar));
  }, [agent]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState(
    existingSession?.id || existingSession?.chat_id || chatService.generateChatId()
  );
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [userStatus, setUserStatus] = useState({ isPremium: false, remainingFree: 5 });
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isProUnlocked, setIsProUnlocked] = useState(false);

  // Gemini model and thinking depth settings
  const [modelType, setModelType] = useState('flash'); // 'flash' | 'pro'
  const [thinkingDepth, setThinkingDepth] = useState('medium'); // 'low' | 'medium' | 'high' | 'ultra'
  const [thinkingPhase, setThinkingPhase] = useState(0);

  // Voice input state (Speech-to-Text mic)
  const [isListening, setIsListening] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    return () => {
      voiceService.stopListening();
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

    try {
      const adminSettings = await adminService.getSettings();
      if (adminSettings?.isProModelLockEnabled === false) {
        setIsProUnlocked(true);
      }
    } catch (e) {}

    // 1. If explicit session passed via route (Secret Archives / History)
    if (existingSession && (existingSession.id || existingSession.chat_id)) {
      const activeId = existingSession.id || existingSession.chat_id;
      let sessionMessages = existingSession.messages;
      if (!sessionMessages || sessionMessages.length === 0) {
        try {
          const full = await chatService.getConversation(activeId);
          if (full && full.messages && full.messages.length > 0) {
            sessionMessages = full.messages;
          }
        } catch (e) {}
      }

      if (sessionMessages && sessionMessages.length > 0) {
        setConversationId(activeId);
        setMessages(sessionMessages);
        const lastMsg = sessionMessages[sessionMessages.length - 1];
        if (lastMsg && (lastMsg.follow_ups || lastMsg.followUpQuestions)) {
          setFollowUpQuestions(lastMsg.follow_ups || lastMsg.followUpQuestions);
        }
        return;
      }
    }

    // 2. Strict Session Isolation: Every fresh dialogue gets a unique chat_id.
    // Old chats are never mixed into new chats!
    const freshChatId = chatService.generateChatId();
    setConversationId(freshChatId);

    const welcomeMsg = {
      id: `msg_init_${Date.now()}`,
      role: 'assistant',
      content: lang === 'gu'
        ? `હું ${agent?.name || 'માસ્ટરમાઇન્ડ'} છું. તમારો વ્યૂહાત્મક પ્રશ્ન, પડકાર અથવા વ્યાપારિક દ્વિધા રજૂ કરો.`
        : lang === 'hi'
        ? `मैं ${agent?.name || 'मास्टरमाइंड'} हूँ। अपनी रणनीतिक दुविधा, चुनौती अथवा प्रश्न प्रस्तुत करें।`
        : `I am ${agent?.name || 'Mastermind'}. Present your strategic dilemma, operational bottleneck, or challenge.`,
      agent_id: agent?.id,
      agent_name: agent?.name,
      agent_avatar: guaranteedAvatar,
      createdAt: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
    setFollowUpQuestions([]);
  };

  /**
   * Start a brand new, isolated chat session with a unique chat_id
   */
  const handleStartNewChat = () => {
    if (isStreaming) setIsStreaming(false);
    voiceService.stopListening();
    const freshChatId = chatService.generateChatId();
    setConversationId(freshChatId);
    setInputText('');
    setFollowUpQuestions([]);
    const welcomeMsg = {
      id: `msg_init_${Date.now()}`,
      role: 'assistant',
      content: lang === 'gu'
        ? `હું ${agent?.name || 'માસ્ટરમાઇન્ડ'} છું. તમારો વ્યૂહાત્મક પ્રશ્ન, પડકાર અથવા વ્યાપારિક દ્વિધા રજૂ કરો.`
        : lang === 'hi'
        ? `मैं ${agent?.name || 'मास्टरमाइंड'} हूँ। अपनी रणनीतिक दुविधा, चुनौती अथवा प्रश्न प्रस्तुत करें।`
        : `I am ${agent?.name || 'Mastermind'}. Present your strategic dilemma, operational bottleneck, or challenge.`,
      agent_id: agent?.id,
      agent_name: agent?.name,
      agent_avatar: guaranteedAvatar,
      createdAt: new Date().toISOString()
    };
    setMessages([welcomeMsg]);
  };

  /**
   * Resume an individual chat session from Chat History drawer
   */
  const handleSelectHistorySession = async (session) => {
    if (!session) return;
    const targetId = session.chat_id || session.id;
    try {
      setLoading(true);
      const full = await chatService.getConversation(targetId);
      const msgs = full?.messages || session.messages || [];
      setConversationId(targetId);
      if (msgs.length > 0) {
        setMessages(msgs);
        const lastMsg = msgs[msgs.length - 1];
        setFollowUpQuestions(lastMsg.follow_ups || lastMsg.followUpQuestions || []);
      }
    } catch (e) {
      console.warn('Error loading history session:', e);
    } finally {
      setLoading(false);
    }
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
    setFollowUpQuestions([]); // Hide chips while thinking/streaming

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
      // Pass full conversation history for 100% context retention in this session
      const aiResult = await geminiService.generateAgentResponse({
        agent,
        userMessage: prompt,
        chatHistory: updatedMessages,
        chat_id: conversationId,
        language: lang,
        modelType,
        thinkingDepth,
        isPremium: status.isPremium
      });

      const replyContent = aiResult.reply || aiResult.content || '';
      const followUps = Array.isArray(aiResult.follow_ups) && aiResult.follow_ups.length > 0
        ? aiResult.follow_ups
        : (Array.isArray(aiResult.followUpQuestions) ? aiResult.followUpQuestions : []);

      const assistantMsgId = `msg_a_${Date.now()}`;
      const assistantMsg = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        agent_id: agent.id,
        agent_name: agent.name,
        agent_avatar: guaranteedAvatar,
        follow_ups: followUps,
        followUpQuestions: followUps,
        createdAt: new Date().toISOString()
      };

      setMessages([...updatedMessages, assistantMsg]);
      setLoading(false);

      // Smooth typewriter streaming of profound long-form response
      await streamResponse(replyContent, assistantMsgId);

      // Dynamically map follow_ups array to 'STRATEGIC FOLLOW-UPS' UI buttons
      setFollowUpQuestions(followUps);

      // Persist full conversation under unique chat_id in Supabase & AsyncStorage
      const finalChat = [...updatedMessages, { ...assistantMsg, content: replyContent }];

      await chatService.saveConversation({
        id: conversationId,
        chat_id: conversationId,
        session_id: conversationId,
        agent_id: agent?.id,
        mode: 'single_agent',
        title: `${agent?.name}: ${prompt.substring(0, 35)}...`,
        preview: replyContent.substring(0, 80),
        messages: finalChat
      });
    } catch (err) {
      console.error('Chat error:', err);
      setLoading(false);
      setIsStreaming(false);
      Alert.alert('AI Engine Error', err?.message || 'The AI service could not be reached. Please check your network and API keys.');
    }
  };

  /**
   * Voice Input Toggle
   */
  const handleToggleVoiceInput = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      const started = voiceService.startListening({
        lang,
        onTranscript: (liveText) => {
          setInputText(liveText);
        },
        onError: (err) => {
          setIsListening(false);
          Alert.alert('Microphone Notice', err);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
      if (started) setIsListening(true);
    }
  };

  const getThinkingStepText = () => {
    return getThinkingState(agent?.name || 'Mastermind', false);
  };

  const isInputLocked = loading || isStreaming;

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <Image
            source={{ uri: (item.agent_avatar && item.agent_avatar.includes('wikimedia.org')) ? item.agent_avatar : (headerAvatarUri || fallbackAvatar) }}
            onError={() => setHeaderAvatarUri(fallbackAvatar)}
            style={styles.msgAvatar}
            resizeMode="cover"
          />
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {!isUser && (
            <View style={styles.agentHeaderLine}>
              <Text style={styles.agentMsgName}>{item.agent_name || agent?.name || 'Mastermind'}</Text>
              <View style={styles.assistantActionIcons}>
                {/* Share as Quote Card */}
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

          {/* Clean Rich Markdown Content - 100% Readable Text (Audio Removed) */}
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

        <Image
          source={{ uri: headerAvatarUri || fallbackAvatar }}
          onError={() => setHeaderAvatarUri(fallbackAvatar)}
          style={styles.headerAvatar}
          resizeMode="cover"
        />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{agent?.name}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {agent?.title || agent?.role || (lang === 'gu' ? 'પર્સનલ એજન્ટ' : 'Personal Mastermind')}
          </Text>
        </View>

        {/* Action Header Group */}
        <View style={styles.headerActionsGroup}>
          {/* History Sidebar Button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setIsHistoryOpen(true)}
            activeOpacity={0.8}
            accessibilityLabel="Chat History"
          >
            <Ionicons name="time-outline" size={17} color="#D4AF37" />
          </TouchableOpacity>

          {/* New Chat Button */}
          <TouchableOpacity
            style={styles.newChatHeaderBtn}
            onPress={handleStartNewChat}
            activeOpacity={0.8}
            accessibilityLabel="New Chat"
          >
            <Ionicons name="add" size={15} color="#000000" style={{ marginRight: 2 }} />
            <Text style={styles.newChatHeaderBtnText}>New</Text>
          </TouchableOpacity>

          {/* Freemium / Pro Counter Badge */}
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
      </View>

      {/* Main Message Stream */}
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

        {/* Animated Gemini Thinking State */}
        {loading && (
          <View style={styles.thinkingContainer}>
            <View style={styles.thinkingGlowBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.thinkingText}>{getThinkingStepText()}</Text>
            </View>
          </View>
        )}

        {/* Dynamic Context-Aware Follow-up Chips (Shown only when not thinking/streaming) */}
        {!isInputLocked && followUpQuestions.length > 0 && (
          <FollowUpChips
            questions={followUpQuestions}
            onSelectQuestion={(q) => handleSendMessage(q)}
          />
        )}

        {/* Corporate Model & Thinking Depth Selector Bar */}
        <View style={styles.selectorBar}>
          {/* Model Selector Toggle */}
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
                if (!userStatus.isPremium && !isProUnlocked) {
                  setPaywallVisible(true);
                } else {
                  setModelType('pro');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modelPillText, modelType === 'pro' && styles.modelPillTextActivePro]}>
                {(userStatus.isPremium || isProUnlocked) ? '👑 3.1 Pro' : '🔒 3.1 Pro'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Thinking Depth Selector */}
          <View style={styles.depthSelectorGroup}>
            <Text style={styles.depthPrefix}>{t('depthLabel', 'Depth:')}</Text>
            {[
              { key: 'low', label: t('depthLow', 'Low'), isPro: false },
              { key: 'medium', label: t('depthMedium', 'Med'), isPro: false },
              { key: 'high', label: (userStatus.isPremium || isProUnlocked) ? t('depthHigh', 'High') : 'High 🔒 Pro', isPro: true },
              { key: 'ultra', label: (userStatus.isPremium || isProUnlocked) ? t('depthUltra', 'Ultra') : 'Ultra 🔒 Pro', isPro: true }
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
                    if (d.isPro && !userStatus.isPremium && !isProUnlocked) {
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

        {/* Corporate Input Bar with Mic & White Send Button */}
        <View style={styles.inputContainer}>
          {/* Speech-to-Text Mic Button */}
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
            placeholder={isListening ? t('listening', 'Listening...') : t('chatInputPlaceholder', 'Ask your dilemma or strategic crossroad...')}
            placeholderTextColor="#666666"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={600}
            editable={!isInputLocked}
          />

          {/* Send Button: Pure Crisp White with Black Arrow */}
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

      {/* Quote Card Share Modal */}
      <QuoteCardModal
        visible={Boolean(selectedQuote)}
        quote={selectedQuote}
        agent={{ ...agent, avatar_url: guaranteedAvatar }}
        onClose={() => setSelectedQuote(null)}
      />

      {/* Subscription Paywall Modal */}
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

      {/* ChatGPT / Gemini Style Chat History Sidebar Drawer */}
      <ChatHistoryDrawer
        visible={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentChatId={conversationId}
        agentId={agent?.id}
        agentName={agent?.name}
        onSelectSession={handleSelectHistorySession}
        onNewChat={handleStartNewChat}
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
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#333333',
    marginRight: 10,
    backgroundColor: '#161616',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerTitle: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  newChatHeaderBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
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
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 8,
    marginTop: 2,
    backgroundColor: '#161616',
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
  agentMsgName: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
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
