/**
 * COUNCIL X | THE SYNDICATE
 * Chat History Sidebar Drawer Component
 * 
 * Inspired by ChatGPT / Gemini luxury interfaces:
 * - Shows distinct past chat sessions by unique chat_id
 * - Clean "+ Start New Chat" button
 * - Filter by current mastermind vs all masterminds
 * - Instant session resume with 100% context memory
 * - Delete individual sessions from Supabase and AsyncStorage
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { chatService } from '../services/chatService';

export default function ChatHistoryDrawer({
  visible,
  onClose,
  currentChatId,
  agentId,
  agentName,
  onSelectSession,
  onNewChat
}) {
  const [sessions, setSessions] = useState([]);
  const [filterMode, setFilterMode] = useState('agent'); // 'agent' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible, filterMode]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await chatService.getConversations();
      setSessions(data || []);
    } catch (e) {
      console.warn('Failed to load sessions in drawer:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filterMode === 'agent' && agentId) {
      if (s.agent_id !== agentId) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (s.title || '').toLowerCase().includes(q);
    const previewMatch = (s.preview || '').toLowerCase().includes(q);
    return titleMatch || previewMatch;
  });

  const handleDeleteSession = async (session) => {
    const idToDelete = session.chat_id || session.id;
    const executeDelete = async () => {
      await chatService.deleteConversation(idToDelete);
      setSessions(prev => prev.filter(s => (s.chat_id !== idToDelete && s.id !== idToDelete)));
      // If active session was deleted, start new chat
      if (currentChatId === idToDelete && onNewChat) {
        onNewChat();
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm ? window.confirm('Delete this conversation session permanently?') : true;
      if (confirmed) await executeDelete();
    } else {
      Alert.alert(
        'Delete Session',
        'Are you sure you want to delete this conversation session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete }
        ]
      );
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 2) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Slide-over Drawer Container */}
        <View style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconRing}>
                <Ionicons name="time-outline" size={18} color="#D4AF37" />
              </View>
              <View>
                <Text style={styles.drawerTitle}>CHAT ARCHIVES</Text>
                <Text style={styles.drawerSubtitle}>
                  {filterMode === 'agent' ? (agentName || 'Mastermind') : 'All Conversations'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>

          {/* New Chat Primary Button */}
          <TouchableOpacity
            style={styles.newChatBtn}
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              if (onNewChat) onNewChat();
            }}
          >
            <Ionicons name="add" size={20} color="#000000" style={{ marginRight: 6 }} />
            <Text style={styles.newChatBtnText}>+ Start New Chat</Text>
          </TouchableOpacity>

          {/* Filter Segment Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, filterMode === 'agent' && styles.tabItemActive]}
              onPress={() => setFilterMode('agent')}
            >
              <Text style={[styles.tabText, filterMode === 'agent' && styles.tabTextActive]} numberOfLines={1}>
                {agentName ? `${agentName.split(' ')[0]} Chats` : 'This Agent'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, filterMode === 'all' && styles.tabItemActive]}
              onPress={() => setFilterMode('all')}
            >
              <Text style={[styles.tabText, filterMode === 'all' && styles.tabTextActive]}>
                All Masterminds
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={15} color="#888888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor="#666666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#888888" />
              </TouchableOpacity>
            )}
          </View>

          {/* Session List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Retrieving archives...</Text>
            </View>
          ) : filteredSessions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#444444" />
              <Text style={styles.emptyTitle}>No Sessions Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No matching conversations found.'
                  : `Start your first conversation with ${agentName || 'this mastermind'}.`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredSessions}
              keyExtractor={(item) => item.chat_id || item.id || `session_${Math.random()}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isCurrent = (item.chat_id || item.id) === currentChatId;
                const dateLabel = formatTimestamp(item.updated_at || item.created_at);

                return (
                  <TouchableOpacity
                    style={[styles.sessionCard, isCurrent && styles.sessionCardActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose();
                      if (onSelectSession) onSelectSession(item);
                    }}
                  >
                    <View style={styles.sessionHeaderRow}>
                      <View style={styles.sessionTitleGroup}>
                        {isCurrent && <View style={styles.activeDot} />}
                        <Text style={[styles.sessionTitle, isCurrent && styles.sessionTitleActive]} numberOfLines={1}>
                          {item.title || 'Mastermind Counsel'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteIconBtn}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          handleDeleteSession(item);
                        }}
                      >
                        <Ionicons name="trash-outline" size={15} color="#666666" />
                      </TouchableOpacity>
                    </View>

                    {item.preview ? (
                      <Text style={styles.sessionPreview} numberOfLines={2}>
                        {item.preview}
                      </Text>
                    ) : null}

                    <View style={styles.sessionFooterRow}>
                      <Text style={styles.sessionDate}>{dateLabel}</Text>
                      {isCurrent ? (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>ACTIVE CHAT</Text>
                        </View>
                      ) : (
                        <View style={styles.resumeRow}>
                          <Text style={styles.resumeText}>Resume</Text>
                          <Ionicons name="chevron-forward" size={12} color="#D4AF37" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  drawerContainer: {
    width: Platform.OS === 'web' ? 380 : '86%',
    maxWidth: 420,
    height: '100%',
    backgroundColor: '#0B0B10',
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 20
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIconRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)'
  },
  drawerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2
  },
  drawerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 14,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  newChatBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888'
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    padding: 0
  },
  listContent: {
    paddingBottom: 24
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  sessionCardActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderColor: 'rgba(212, 175, 55, 0.4)'
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  sessionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 6
  },
  sessionTitle: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },
  sessionTitleActive: {
    color: '#D4AF37',
    fontWeight: '700'
  },
  deleteIconBtn: {
    padding: 4
  },
  sessionPreview: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8
  },
  sessionFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sessionDate: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '500'
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)'
  },
  activeBadgeText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resumeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '600',
    marginRight: 2
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  loadingText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 10
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60
  },
  emptyTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16
  }
});
