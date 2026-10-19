/**
 * COUNCIL X | THE SYNDICATE
 * Chat History Service
 * Saves sessions in Supabase with automatic AsyncStorage fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { paymentService } from './paymentService';

const SESSIONS_STORAGE_KEY = '@councilx_chat_sessions_v1';

export const chatService = {
  /**
   * Get all past conversation sessions
   */
  async getConversations() {
    const userId = await paymentService.getUserId();

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase fetch conversations error:', e);
      }
    }

    // 2. Local Fallback
    try {
      const raw = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Get single conversation with full messages
   */
  async getConversation(id) {
    const userId = await paymentService.getUserId();

    if (isSupabaseConfigured()) {
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', id)
          .single();

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });

        if (conv) {
          return {
            ...conv,
            messages: msgs || []
          };
        }
      } catch (e) {
        console.warn('Supabase load session error:', e);
      }
    }

    // Local Fallback
    const sessions = await this.getConversations();
    return sessions.find(s => s.id === id) || null;
  },

  /**
   * Create or update a conversation session
   */
  async saveConversation(session) {
    const userId = await paymentService.getUserId();
    const cleanSession = {
      ...session,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    // Save locally
    const sessions = await this.getConversations();
    const existingIndex = sessions.findIndex(s => s.id === cleanSession.id);
    let updatedSessions;

    if (existingIndex >= 0) {
      updatedSessions = [...sessions];
      updatedSessions[existingIndex] = cleanSession;
    } else {
      updatedSessions = [cleanSession, ...sessions];
    }

    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));

    // Sync to Supabase if available
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('conversations').upsert({
          id: cleanSession.id,
          user_id: userId,
          agent_id: cleanSession.agent_id,
          mode: cleanSession.mode || 'single_agent',
          title: cleanSession.title || 'Mastermind Counsel',
          preview: cleanSession.preview || '',
          updated_at: cleanSession.updated_at
        });

        // Upsert latest message
        if (cleanSession.messages && cleanSession.messages.length > 0) {
          const lastMsg = cleanSession.messages[cleanSession.messages.length - 1];
          await supabase.from('messages').upsert({
            id: lastMsg.id,
            conversation_id: cleanSession.id,
            user_id: userId,
            role: lastMsg.role,
            content: lastMsg.content,
            agent_id: lastMsg.agent_id,
            agent_name: lastMsg.agent_name,
            agent_avatar: lastMsg.agent_avatar,
            follow_up_questions: lastMsg.followUpQuestions || []
          });
        }
      } catch (e) {
        console.warn('Supabase save error:', e);
      }
    }

    return cleanSession;
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(id) {
    const sessions = await this.getConversations();
    const filtered = sessions.filter(s => s.id !== id);
    await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));

    if (isSupabaseConfigured()) {
      try {
        // Delete all child messages first to maintain database integrity
        await supabase.from('messages').delete().eq('conversation_id', id);
        await supabase.from('conversations').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }

    return true;
  }
};
