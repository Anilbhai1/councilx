/**
 * COUNCIL X | THE SYNDICATE
 * Smart Dynamic Follow-Up Chips Component
 * Corporate Black & White Luxury Theme (OpenAI / Bloomberg Standard)
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FollowUpChips({ questions = [], onSelectQuestion }) {
  if (!questions || questions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="sparkles" size={11} color="#FFFFFF" />
        <Text style={styles.headerText}>STRATEGIC FOLLOW-UPS</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {questions.map((question, index) => (
          <TouchableOpacity
            key={`chip_${index}`}
            style={styles.chip}
            onPress={() => onSelectQuestion(question)}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText} numberOfLines={2}>
              {question}
            </Text>
            <Ionicons name="arrow-up-circle" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  headerText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    flexShrink: 1,
  },
});
