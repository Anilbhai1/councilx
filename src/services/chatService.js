/**
 * COUNCIL X | THE SYNDICATE
 * Chat History Service
 * Saves sessions in Supabase with automatic AsyncStorage fallback
 * Enforces distinct chat_id sessions and 100% context retention
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { paymentService } from './paymentService';

const SESSIONS_STORAGE_KEY = '@councilx_chat_sessions_v1';
const SESSION_PREFIX = '@councilx_session_';

export const chatService = {
  /**
   * Generate a unique chat_id for a fresh conversation session
   */
  generateChatId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Get all past conversation sessions (optionally filtered by agentId)
   */
  async getConversations(filterAgentId = null) {
    const userId = await paymentService.getUserId();
    let sessions = [];

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (filterAgentId) {
          query = query.eq('agent_id', filterAgentId);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          sessions = data.map(s => ({
            ...s,
            id: s.id || s.chat_id,
            chat_id: s.chat_id || s.id
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch conversations error:', e);
      }
    }

    // 2. Local Fallback / Merge with AsyncStorage
    if (!sessions || sessions.length === 0) {
      try {
        const raw = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            sessions = parsed.map(s => ({
              ...s,
              id: s.id || s.chat_id,
              chat_id: s.chat_id || s.id
            }));
            if (filterAgentId) {
              sessions = sessions.filter(s => s.agent_id === filterAgentId);
            }
          }
        }
      } catch (e) {
        console.warn('AsyncStorage load sessions error:', e);
      }
    }

    return sessions;
  },

  /**
   * Get single conversation with full messages (100% context retention)
   */
  async getConversation(idOrChatId) {
    if (!idOrChatId) return null;
    const userId = await paymentService.getUserId();

    if (isSupabaseConfigured()) {
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .or(`id.eq.${idOrChatId},chat_id.eq.${idOrChatId}`)
          .maybeSingle();

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`conversation_id.eq.${idOrChatId},chat_id.eq.${idOrChatId}`)
          .order('created_at', { ascending: true });

        if (conv) {
          return {
            ...conv,
            id: conv.id || conv.chat_id || idOrChatId,
            chat_id: conv.chat_id || conv.id || idOrChatId,
            messages: (msgs || []).map(m => ({
              ...m,
              followUpQuestions: m.follow_up_questions || m.followUpQuestions || []
            }))
          };
        }
      } catch (e) {
        console.warn('Supabase load session error:', e);
      }
    }

    // Local Fallback: Check dedicated session key first
    try {
      const sessionRaw = await AsyncStorage.getItem(`${SESSION_PREFIX}${idOrChatId}`);
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        if (parsed) return parsed;
      }
    } catch (e) {}

    // Fallback: Check in sessions list
    const sessions = await this.getConversations();
    const found = sessions.find(s => s.id === idOrChatId || s.chat_id === idOrChatId);
    return found || null;
  },

  /**
   * Create or update a conversation session with 100% of all messages
   */
  async saveConversation(session) {
    if (!session) return null;
    const userId = await paymentService.getUserId();
    const chatId = session.chat_id || session.id || this.generateChatId();

    const cleanSession = {
      ...session,
      id: chatId,
      chat_id: chatId,
      session_id: chatId,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    // 1. Save full session directly to dedicated storage key
    try {
      await AsyncStorage.setItem(`${SESSION_PREFIX}${chatId}`, JSON.stringify(cleanSession));
    } catch (e) {}

    // 2. Save metadata summary to sessions list
    try {
      const rawList = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      const sessions = rawList ? JSON.parse(rawList) : [];
      const summarySession = {
        id: cleanSession.id,
        chat_id: cleanSession.chat_id,
        session_id: cleanSession.session_id,
        user_id: userId,
        agent_id: cleanSession.agent_id,
        mode: cleanSession.mode || 'single_agent',
        title: cleanSession.title || 'Mastermind Counsel',
        preview: cleanSession.preview || '',
        updated_at: cleanSession.updated_at,
        created_at: cleanSession.created_at || cleanSession.updated_at
      };

      const existingIndex = sessions.findIndex(s => (s.id === chatId || s.chat_id === chatId));
      let updatedSessions;
      if (existingIndex >= 0) {
        updatedSessions = [...sessions];
        updatedSessions[existingIndex] = { ...updatedSessions[existingIndex], ...summarySession };
      } else {
        updatedSessions = [summarySession, ...sessions];
      }
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.warn('AsyncStorage save session list error:', e);
    }

    // 3. Sync to Supabase if available
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('conversations').upsert({
          id: cleanSession.id,
          chat_id: cleanSession.chat_id,
          session_id: cleanSession.session_id,
          user_id: userId,
          agent_id: cleanSession.agent_id,
          mode: cleanSession.mode || 'single_agent',
          title: cleanSession.title || 'Mastermind Counsel',
          preview: cleanSession.preview || '',
          updated_at: cleanSession.updated_at
        }, { onConflict: 'id' });

        // Upsert 100% of all messages in the session
        if (Array.isArray(cleanSession.messages) && cleanSession.messages.length > 0) {
          const messageRows = cleanSession.messages.map((m, idx) => ({
            id: m.id || `msg_${chatId}_${idx}_${Date.now()}`,
            conversation_id: cleanSession.id,
            chat_id: cleanSession.id,
            session_id: cleanSession.id,
            user_id: userId,
            role: m.role || 'user',
            content: m.content || '',
            agent_id: m.agent_id || cleanSession.agent_id,
            agent_name: m.agent_name || (cleanSession.title ? cleanSession.title.split(':')[0] : 'Mastermind'),
            agent_avatar: m.agent_avatar || '',
            follow_up_questions: m.follow_ups || m.followUpQuestions || [],
            created_at: m.createdAt || m.created_at || new Date(Date.now() + idx).toISOString()
          }));

          await supabase.from('messages').upsert(messageRows, { onConflict: 'id' });
        }
      } catch (e) {
        console.warn('Supabase save session error:', e);
      }
    }

    return cleanSession;
  },

  /**
   * Delete a conversation session permanently
   */
  async deleteConversation(idOrChatId) {
    if (!idOrChatId) return false;

    // Remove from local list & session storage
    try {
      const rawList = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      if (rawList) {
        const sessions = JSON.parse(rawList);
        const filtered = sessions.filter(s => s.id !== idOrChatId && s.chat_id !== idOrChatId);
        await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
      }
      await AsyncStorage.removeItem(`${SESSION_PREFIX}${idOrChatId}`);
    } catch (e) {}

    // Remove from Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('messages')
          .delete()
          .or(`conversation_id.eq.${idOrChatId},chat_id.eq.${idOrChatId}`);

        await supabase
          .from('conversations')
          .delete()
          .or(`id.eq.${idOrChatId},chat_id.eq.${idOrChatId}`);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }

    return true;
  }
};
