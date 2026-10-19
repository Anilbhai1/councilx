/**
 * COUNCIL X | THE SYNDICATE
 * Legal Compliance & Settings Screen
 * Complete, Mandatory Razorpay Live Verification Policies:
 * - Terms & Conditions
 * - Privacy Policy
 * - Refund & Cancellation Policy
 * - Contact & Support Us
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const TABS = [
  'Terms & Conditions',
  'Privacy Policy',
  'Refund Policy',
  'Contact Us'
];

export default function LegalComplianceScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>

        <View style={styles.titleCenter}>
          <Text style={styles.headerTitle}>LEGAL & COMPLIANCE</Text>
          <Text style={styles.headerSubtitle}>RAZORPAY MERCHANT VERIFIED</Text>
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Policy Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Terms & Conditions' && (
          <View style={styles.policyBlock}>
            <Text style={styles.policyTitle}>TERMS & CONDITIONS</Text>
            <Text style={styles.policyUpdated}>Last Updated: October 2026</Text>

            <Text style={styles.sectionHeading}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading, accessing, or using 'Council X | The Syndicate' ("Application", "Service", "Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must discontinue use of the Service immediately.
            </Text>

            <Text style={styles.sectionHeading}>2. Nature of the AI Service</Text>
            <Text style={styles.paragraph}>
              'Council X | The Syndicate' utilizes artificial intelligence (powered by Google Gemini models) to simulate historical personas, philosophical frameworks, and strategic doctrines. All responses are generative simulations intended exclusively for intellectual, strategic, and educational exploration. Content provided does not constitute certified legal, medical, or financial advisory.
            </Text>

            <Text style={styles.sectionHeading}>3. Subscriptions, Plans & Freemium Policy</Text>
            <Text style={styles.paragraph}>
              Initiates are granted five (5) complimentary messages across all 216 masterminds upon account creation, plus additional bonus messages via our promotional referral engine (+15 free chats when using a friend's code). Continued unlimited access to all 216 Masterminds and the All-in-One Supreme Council is available under three transparent tiers: 1-Month Pro (₹499 for 30 Days), 6-Month Pro (₹1,999 for 180 Days), or 1-Year Annual Pro (₹3,499 for 365 Days), processed securely through Razorpay.
            </Text>

            <Text style={styles.sectionHeading}>4. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              All proprietary algorithms, design tokens, Illuminati-themed insignia, software code, and curated 216 masterminds databases are the exclusive intellectual property of the Syndicate Operating Entity.
            </Text>
          </View>
        )}

        {activeTab === 'Privacy Policy' && (
          <View style={styles.policyBlock}>
            <Text style={styles.policyTitle}>PRIVACY POLICY</Text>
            <Text style={styles.policyUpdated}>Last Updated: October 2026</Text>

            <Text style={styles.sectionHeading}>1. Data Collection & Minimization</Text>
            <Text style={styles.paragraph}>
              In accordance with international data privacy standards and the Digital Personal Data Protection Act (DPDPA), we adhere to radical data minimization. We do not sell your personal data.
            </Text>

            <Text style={styles.sectionHeading}>2. Information We Process</Text>
            <Text style={styles.paragraph}>
              • Device Identifiers: Anonymized cryptographic UUID to track local conversation threads and freemium quota status.
              {"\n"}• Payment Metadata: Razorpay Transaction IDs, Order IDs, and timestamps. We never store or transmit sensitive card numbers, CVVs, or UPI PINs.
              {"\n"}• Query Transcripts: User prompts and AI outputs encrypted in transit via SSL/TLS 256-bit encryption.
            </Text>

            <Text style={styles.sectionHeading}>3. Third-Party Integrations</Text>
            <Text style={styles.paragraph}>
              AI completions are processed via Google Generative Language (Gemini API) and database records are synchronized with Supabase PostgreSQL infrastructure with strict Row-Level Security (RLS) enforcement.
            </Text>
          </View>
        )}

        {activeTab === 'Refund Policy' && (
          <View style={styles.policyBlock}>
            <Text style={styles.policyTitle}>REFUND & CANCELLATION POLICY</Text>
            <Text style={styles.policyUpdated}>Mandatory Razorpay Compliance</Text>

            <Text style={styles.sectionHeading}>1. Digital Product Delivery</Text>
            <Text style={styles.paragraph}>
              Upon successful payment via the Razorpay payment gateway, Syndicate Pro privileges (unlimited chats and 'The Syndicate' Dual Synthesis mode) are activated instantaneously within the application.
            </Text>

            <Text style={styles.sectionHeading}>2. 7-Day Satisfaction Guarantee</Text>
            <Text style={styles.paragraph}>
              If you experience technical failure or are unsatisfied with your Syndicate Pro membership within seven (7) days of initial purchase, you may request a 100% full refund by emailing our support desk with your Razorpay Payment ID.
            </Text>

            <Text style={styles.sectionHeading}>3. Refund Processing Timeline</Text>
            <Text style={styles.paragraph}>
              Approved refunds are credited directly back to the original source payment method (Bank Account, UPI, or Credit Card) via Razorpay within 5 to 7 business banking days.
            </Text>
          </View>
        )}

        {activeTab === 'Contact Us' && (
          <View style={styles.policyBlock}>
            <Text style={styles.policyTitle}>CONTACT & SUPPORT US</Text>
            <Text style={styles.policyUpdated}>Customer Grievance & Escalation Desk</Text>

            <View style={styles.contactCard}>
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={18} color={COLORS.gold} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Official Support Email</Text>
                  <Text style={styles.contactValue}>support@thesyndicate.councilx.ai</Text>
                </View>
              </View>

              <View style={styles.contactRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.gold} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Grievance Officer</Text>
                  <Text style={styles.contactValue}>Chief Compliance Officer, Syndicate Bureau</Text>
                </View>
              </View>

              <View style={styles.contactRow}>
                <Ionicons name="business-outline" size={18} color={COLORS.gold} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Operating Entity</Text>
                  <Text style={styles.contactValue}>Council X Technologies Private Limited</Text>
                </View>
              </View>

              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.gold} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Registered Address</Text>
                  <Text style={styles.contactValue}>Level 12, Sovereign Tower, BKC, Mumbai, Maharashtra 400051, India</Text>
                </View>
              </View>
            </View>

            <Text style={styles.supportNote}>
              Our grievance desk responds to inquiries within 24 business hours.
            </Text>
          </View>
        )}
      </ScrollView>
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
  titleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabContainer: {
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: COLORS.gold,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: COLORS.gold,
    fontWeight: '900',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  policyBlock: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.goldBorderSubtle,
    padding: 16,
  },
  policyTitle: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  policyUpdated: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 16,
  },
  sectionHeading: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  contactCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    padding: 14,
    gap: 14,
    marginTop: 8,
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  contactValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  supportNote: {
    color: COLORS.goldMuted,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
