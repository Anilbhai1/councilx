/**
 * COUNCIL X | THE SYNDICATE
 * History Screen: Archived Mastermind Sessions
 * Supabase + AsyncStorage persistent session browser
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { chatService } from '../services/chatService';
import { agentService } from '../services/agentService';
import { paymentService } from '../services/paymentService';

export default function HistoryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const data = await chatService.getConversations();
    setSessions(data);
    setLoading(false);
  };

  const handleResumeSession = async (session) => {
    try {
      // Fetch full session with all historical messages from Supabase/AsyncStorage
      const fullSession = await chatService.getConversation(session.id);
      const sessionToResume = fullSession || session;

      if (session.mode === 'supreme_council_216' || session.mode === 'syndicate_all_in_one') {
        navigation.navigate('Syndicate', { existingSession: sessionToResume });
      } else if (session.mode === 'council_debate') {
        navigation.navigate('Debate', { existingSession: sessionToResume });
      } else {
        let agent = agentService.getAgentById(session.agent_id);
        if (!agent || (agent.id === 'council_agent_0001' && session.agent_id !== 'council_agent_0001')) {
          const customAgents = await paymentService.getCustomAgents();
          const foundCustom = customAgents.find(c => c.id === session.agent_id || c.name === session.agent_id);
          if (foundCustom) {
            agent = foundCustom;
          } else {
            agent = {
              id: session.agent_id,
              name: session.title ? session.title.split(':')[0] : 'Mastermind',
              title: session.title || 'Mastermind',
              role: session.title || 'Mastermind'
            };
          }
        }
        navigation.navigate('Chat', { agent, existingSession: sessionToResume });
      }
    } catch (err) {
      console.warn('Resume archive error:', err);
      const agent = agentService.getAgentById(session.agent_id);
      navigation.navigate('Chat', { agent, existingSession: session });
    }
  };

  const handleDeleteSession = async (id) => {
    const executeDelete = async () => {
      await chatService.deleteConversation(id);
      await loadSessions();
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Are you sure you wish to strike this counsel from the archives permanently?')
        : true;
      if (confirmed) {
        await executeDelete();
      }
    } else {
      Alert.alert(
        'Delete Session',
        'Are you sure you wish to strike this counsel from the archives permanently?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => executeDelete()
          }
        ]
      );
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.preview && s.preview.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.title}>SECRET ARCHIVES</Text>
          <Text style={styles.subtitle}>HISTORICAL COUNCIL SESSIONS</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={loadSessions}>
          <Ionicons name="refresh" size={18} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={COLORS.gold} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search archives by keyword..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sessions List */}
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => handleResumeSession(item)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={styles.modeBadge}>
                <Ionicons
                  name={item.mode === 'supreme_council_216' || item.mode === 'syndicate_all_in_one' ? 'diamond' : item.mode === 'council_debate' ? 'git-compare' : 'person'}
                  size={11}
                  color={COLORS.gold}
                />
                <Text style={styles.modeText}>
                  {item.mode === 'supreme_council_216' || item.mode === 'syndicate_all_in_one' ? '216 SUPREME COUNCIL' : item.mode === 'council_debate' ? 'COUNCIL DEBATE' : '1-ON-1 COUNSEL'}
                </Text>
              </View>

              <TouchableOpacity onPress={() => handleDeleteSession(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.sessionPreview} numberOfLines={2}>{item.preview || 'No transcript preview available.'}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>
                {new Date(item.updated_at || item.created_at || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>

              <View style={styles.resumeRow}>
                <Text style={styles.resumeText}>RESUME</Text>
                <Ionicons name="arrow-forward" size={11} color={COLORS.gold} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="file-tray-outline" size={44} color={COLORS.borderDark} />
            <Text style={styles.emptyTitle}>No Archives Recorded</Text>
            <Text style={styles.emptyDesc}>
              Initiate a consultation with any Mastermind to record your strategic conversations.
            </Text>
          </View>
        }
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
  refreshBtn: {
    padding: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  sessionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeText: {
    color: COLORS.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 4,
  },
  sessionTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  sessionPreview: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderDark,
    paddingTop: 8,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resumeText: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
});
