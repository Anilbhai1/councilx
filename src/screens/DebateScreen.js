/**
 * COUNCIL X | THE SYNDICATE
 * Council Debate Mode Screen
 * 3 Masterminds Contrasting Perspectives & Cross-Examination
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import QuoteCardModal from '../components/QuoteCardModal';
import FollowUpChips from '../components/FollowUpChips';
import PaywallModal from '../components/PaywallModal';
import AvatarComponent from '../components/AvatarComponent';
import { agentService } from '../services/agentService';
import { geminiService } from '../services/geminiService';
import { paymentService } from '../services/paymentService';
import { chatService } from '../services/chatService';

const PRESET_DILEMMAS = [
  'Should I bootstrap with slow organic growth or raise aggressive venture capital?',
  'How do I build a ruthless market monopoly while maintaining absolute personal ethics?',
  'When should a sovereign leader deploy deception vs total radical transparency?'
];

export default function DebateScreen({ navigation }) {
  const [agents, setAgents] = useState([]);
  const [dilemma, setDilemma] = useState('');
  const [loading, setLoading] = useState(false);
  const [debateContent, setDebateContent] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    loadDebateTrio();
  }, []);

  const loadDebateTrio = () => {
    const trio = agentService.getDebateTrio();
    setAgents(trio);
  };

  const handleStartDebate = async (textOverride) => {
    const topic = textOverride || dilemma;
    if (!topic.trim() || loading) return;

    // Check message quota
    const status = await paymentService.getUserStatus();
    if (!status.isPremium && status.messageCount >= paymentService.FREE_LIMIT) {
      setPaywallVisible(true);
      return;
    }

    setLoading(true);
    await paymentService.incrementMessageCount();

    try {
      const result = await geminiService.generateCouncilDebate({
        agents,
        dilemma: topic
      });

      setDebateContent(result.content);
      setFollowUps(result.followUpQuestions || []);

      // Persist to history
      await chatService.saveConversation({
        id: `debate_${Date.now()}`,
        mode: 'council_debate',
        title: `Debate: ${topic.substring(0, 30)}...`,
        preview: result.content.substring(0, 80),
        messages: [
          {
            id: `msg_deb_u_${Date.now()}`,
            role: 'user',
            content: topic,
            createdAt: new Date().toISOString()
          },
          {
            id: `msg_deb_a_${Date.now()}`,
            role: 'assistant',
            content: result.content,
            agent_name: 'Council Debate Chamber',
            followUpQuestions: result.followUpQuestions,
            createdAt: new Date().toISOString()
          }
        ]
      });
    } catch (e) {
      Alert.alert('Chamber Error', 'Failed to convene the Masterminds debate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.title}>COUNCIL DEBATE ARENA</Text>
          <Text style={styles.subtitle}>TRIAD CROSS-EXAMINATION</Text>
        </View>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trio Masterminds Row */}
        <View style={styles.trioContainer}>
          <Text style={styles.trioHeading}>CONVENED ARBITERS</Text>
          <View style={styles.trioRow}>
            {agents.map((agent, i) => (
              <View key={agent.id || i} style={styles.arbiterCol}>
                <AvatarComponent
                  agent={agent}
                  name={agent.name}
                  avatarUrl={agent.avatar_url}
                  size={48}
                  borderWidth={1.5}
                  borderColor="#333333"
                />
                <Text style={styles.arbiterName} numberOfLines={1}>{agent.name}</Text>
                <Text style={styles.arbiterEra} numberOfLines={1}>{agent.era}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Preset Dilemma Buttons */}
        <View style={styles.presetsBox}>
          <Text style={styles.presetLabel}>POPULAR HIGH-STAKES DILEMMAS:</Text>
          {PRESET_DILEMMAS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetChip}
              onPress={() => {
                setDilemma(item);
                handleStartDebate(item);
              }}
            >
              <Ionicons name="git-pull-request-outline" size={13} color={COLORS.gold} />
              <Text style={styles.presetText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Field */}
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>SUBMIT CUSTOM DILEMMA FOR ARBITRATION:</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Type your strategic conflict, career decision, or venture dilemma..."
            placeholderTextColor={COLORS.textMuted}
            value={dilemma}
            onChangeText={setDilemma}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.debateBtn, loading && styles.btnDisabled]}
            onPress={() => handleStartDebate()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={17} color="#000" />
                <Text style={styles.debateBtnText}>CONVENE COUNCIL DEBATE</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Debate Output */}
        {debateContent && (
          <View style={styles.outputBox}>
            <View style={styles.outputHeader}>
              <Ionicons name="trophy-outline" size={15} color={COLORS.gold} />
              <Text style={styles.outputTitle}>TRANSCRIPT OF PROCEEDINGS</Text>
            </View>

            <Text style={styles.outputText}>{debateContent}</Text>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => setSelectedQuote(debateContent)}
            >
              <Ionicons name="sparkles-outline" size={13} color={COLORS.gold} />
              <Text style={styles.exportBtnText}>EXPORT AS VIRAL CARD</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Follow Ups */}
        {followUps.length > 0 && (
          <FollowUpChips
            questions={followUps}
            onSelectQuestion={(q) => handleStartDebate(q)}
          />
        )}
      </ScrollView>

      {/* Quote Card Modal */}
      <QuoteCardModal
        visible={Boolean(selectedQuote)}
        quote={selectedQuote}
        agent={{
          name: 'The High Council Chamber',
          title: 'Triad Arbitration',
          avatar_url: agents[0]?.avatar_url,
          category: 'Strategic Conflict'
        }}
        onClose={() => setSelectedQuote(null)}
      />

      {/* Paywall */}
      <PaywallModal
        visible={paywallVisible}
        navigation={navigation}
        onOpenPricing={() => {
          setPaywallVisible(false);
          navigation.navigate('Pricing');
        }}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.pitchBlack,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  backBtn: {
    padding: 6,
  },
  headerTitles: {
    alignItems: 'center',
  },
  title: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  trioContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    padding: 14,
    marginBottom: 16,
  },
  trioHeading: {
    color: COLORS.goldMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  trioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  arbiterCol: {
    alignItems: 'center',
    width: 90,
  },
  arbiterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginBottom: 6,
  },
  arbiterName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  arbiterEra: {
    color: COLORS.textMuted,
    fontSize: 8,
    textAlign: 'center',
  },
  presetsBox: {
    marginBottom: 16,
  },
  presetLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  presetText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  inputCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 14,
    marginBottom: 16,
  },
  inputTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  debateBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  debateBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  outputBox: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: 16,
    marginBottom: 14,
  },
  outputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderDark,
    paddingBottom: 8,
    marginBottom: 12,
  },
  outputTitle: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  outputText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 21,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderDark,
    alignSelf: 'flex-start',
  },
  exportBtnText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
