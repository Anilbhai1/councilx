/**
 * COUNCIL X | THE SYNDICATE
 * FormattedMessage Component
 * High-Polish Gemini/ChatGPT Pro Rich Text Markdown Renderer
 * Eliminates raw asterisks (**), hashes (###), and provides clean typography
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

/**
 * Parse a single line containing inline bold (**text**) or inline code (`code`)
 */
function renderInlineContent(text, baseStyle = {}, boldStyle = {}) {
  if (!text) return null;

  // Split by **bold** pattern
  const parts = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    const chunk = match[0];
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      parts.push({
        type: 'bold',
        content: chunk.slice(2, -2)
      });
    } else if (chunk.startsWith('`') && chunk.endsWith('`')) {
      parts.push({
        type: 'code',
        content: chunk.slice(1, -1)
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Trailing text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return (
    <Text style={baseStyle}>
      {parts.map((p, idx) => {
        if (p.type === 'bold') {
          return (
            <Text key={idx} style={[styles.inlineBold, boldStyle]}>
              {p.content}
            </Text>
          );
        }
        if (p.type === 'code') {
          return (
            <Text key={idx} style={styles.inlineCode}>
              {p.content}
            </Text>
          );
        }
        return <Text key={idx}>{p.content}</Text>;
      })}
    </Text>
  );
}

export default function FormattedMessage({ content, isUser = false }) {
  if (!content) return null;

  if (isUser) {
    return <Text style={styles.userText}>{content}</Text>;
  }

  // Clean raw markers and parse blocks
  const lines = content.split('\n');
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      // Small vertical spacer between paragraphs
      elements.push(<View key={`sp_${i}`} style={styles.paragraphSpacer} />);
      continue;
    }

    // 1. Heading 1, 2, or 3 (### or ## or #)
    if (/^#{1,3}\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#{1,3}\s+/, '');
      elements.push(
        <View key={`h_${i}`} style={styles.headingBox}>
          <View style={styles.headingAccent} />
          {renderInlineContent(headingText, styles.headingText, styles.headingBold)}
        </View>
      );
      continue;
    }

    // 2. Numbered step: 1. or 2. or ૧. or ૨.
    const stepMatch = trimmed.match(/^([0-9]{1,2}|[૧-૯]{1,2})\.\s+(.*)/);
    if (stepMatch) {
      const stepNum = stepMatch[1];
      const stepBody = stepMatch[2];
      elements.push(
        <View key={`step_${i}`} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{stepNum}</Text>
          </View>
          <View style={styles.stepBodyWrap}>
            {renderInlineContent(stepBody, styles.bodyText, styles.boldText)}
          </View>
        </View>
      );
      continue;
    }

    // 3. Bullet points: • or - or *
    if (/^[•\-\*]\s+/.test(trimmed)) {
      const bulletBody = trimmed.replace(/^[•\-\*]\s+/, '');
      elements.push(
        <View key={`b_${i}`} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <View style={styles.bulletBodyWrap}>
            {renderInlineContent(bulletBody, styles.bodyText, styles.boldText)}
          </View>
        </View>
      );
      continue;
    }

    // 4. Blockquote or Highlight box (starting with > or 🏛️ or 👁️)
    if (trimmed.startsWith('>') || trimmed.startsWith('🏛️') || trimmed.startsWith('👁️')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <View key={`q_${i}`} style={styles.calloutBox}>
          <Ionicons name="sparkles" size={13} color="#CCCCCC" style={{ marginTop: 2, marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            {renderInlineContent(quoteText, styles.calloutText, styles.boldText)}
          </View>
        </View>
      );
      continue;
    }

    // 5. Standard paragraph line
    elements.push(
      <View key={`p_${i}`} style={styles.paragraphLine}>
        {renderInlineContent(trimmed, styles.bodyText, styles.boldText)}
      </View>
    );
  }

  return <View style={styles.container}>{elements}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  userText: {
    color: '#050505',
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '600',
  },
  paragraphSpacer: {
    height: 8,
  },
  paragraphLine: {
    marginBottom: 4,
  },
  bodyText: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  boldText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inlineBold: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inlineCode: {
    backgroundColor: '#1E1E1E',
    color: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12.5,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  headingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  headingAccent: {
    width: 3.5,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginRight: 8,
  },
  headingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headingBold: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#383838',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepBodyWrap: {
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginTop: 8,
    marginRight: 10,
  },
  bulletBodyWrap: {
    flex: 1,
  },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#141414',
    borderLeftWidth: 3,
    borderLeftColor: '#FFFFFF',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  calloutText: {
    color: '#EDEDED',
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
