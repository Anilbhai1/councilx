import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/i18n';

export default function TermsModal({ visible, onClose }) {
  const { lang, t } = useLanguage();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              <Text style={styles.title}>{t('termsTitle', 'Terms & Conditions')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.noticeBox}>
              <Text style={styles.noticeBadge}>COUNCIL X | THE SYNDICATE LEGAL DOSSIER</Text>
              <Text style={styles.lastUpdated}>Version 2.4 • Effective Worldwide</Text>
            </View>

            {/* Section 1: AI Generated Intelligence */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hardware-chip-outline" size={18} color="#FFFFFF" />
                <Text style={styles.sectionTitle}>
                  {lang === 'gu'
                    ? '૧. આર્ટિફિશિયલ ઇન્ટેલિજન્સ સંશ્લેષણ (AI Intelligence Disclaimer)'
                    : lang === 'hi'
                    ? '१. कृत्रिम बुद्धिमत्ता प्रकटीकरण (AI Intelligence Disclaimer)'
                    : '1. AI Generated Intelligence & Frameworks'}
                </Text>
              </View>
              <Text style={styles.sectionText}>
                {lang === 'gu'
                  ? 'Council X દ્વારા આપવામાં આવતી તમામ સલાહ, વ્યુહરચના અને જવાબો Google Gemini 3.0 Flash & 3.1 Pro AI મૉડેલ આધારિત છે. આ જવાબો જાહેરમાં ઉપલબ્ધ ઐતિહાસિક પુસ્તકો, દર્શનશાસ્ત્રો (જેમ કે ભગવદ્ ગીતા, અર્થશાસ્ત્ર) અને બિઝનેસ ફ્રેમવર્કનું સંશ્લેષણ છે. આ કોઈ વ્યાવસાયિક કાયદાકીય, મેડિકલ કે નાણાકીય રોકાણની બાંયધરી નથી.'
                  : lang === 'hi'
                  ? 'Council X द्वारा प्रदान की जाने वाली सभी रणनीतियाँ एवं उत्तर Google Gemini AI द्वारा सार्वजनिक ऐतिहासिक ग्रंथों, दर्शनशास्त्रों एवं व्यावसायिक केस स्टडीज के आधार पर तैयार किए जाते हैं। यह कोई औपचारिक कानूनी, वित्तीय अथवा चिकित्सीय सलाह नहीं है।'
                  : 'All analyses, strategic roadmaps, and insights produced by Council X are synthesized by Google Gemini AI architectures referencing verified public historical doctrines, philosophical texts (e.g. Bhagavad Gita, Arthashastra), and global business frameworks. They are educational and strategic mental models and do not constitute formal legal, medical, or financial fiduciary advice.'}
              </Text>
            </View>

            {/* Section 2: Nominative Fair Use & Wikipedia Data */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={18} color="#FFFFFF" />
                <Text style={styles.sectionTitle}>
                  {lang === 'gu'
                    ? '૨. પબ્લિક ડોમેન અને ફેર યુઝ (Fair Use & Public Knowledge)'
                    : lang === 'hi'
                    ? '२. पब्लिक डोमेन एवं फेयर यूज (Fair Use & Public Knowledge)'
                    : '2. Public Domain & Transformative Nominative Fair Use'}
                </Text>
              </View>
              <Text style={styles.sectionText}>
                {lang === 'gu'
                  ? 'ઐતિહાસિક મહાનુભાવો, ઋષિઓ અને આધુનિક વિચારકોના નામ, છબીઓ અને તથ્યો જાહેર જ્ઞાનકોશ (Wikimedia Commons & Wikipedia API) હેઠળ શૈક્ષણિક અને પરામર્શ સંશોધન માટે ફેર યુઝ (Fair Use) હેઠળ દર્શાવવામાં આવે છે.'
                  : lang === 'hi'
                  ? 'ऐतिहासिक महापुरुषों, विचारकों एवं वैश्विक हस्तियों के नाम, चित्र एवं जीवनवृत्त विकिमीडिया कॉमन्स एवं विकिपीडिया सार्वजनिक ज्ञानकोश से शैक्षणिक संदर्भ एवं अनुसंधान हेतु फेयर यूज के अंतर्गत उपयोग किए जाते हैं।'
                  : 'Names, public photographs, and biographical summaries of historical legends and notable figures are referenced for educational, research, and thought-leadership mental modeling under standard nominative fair use doctrine utilizing verified open APIs (Wikimedia Commons & Wikipedia).'}
              </Text>
            </View>

            {/* Section 3: Non-Affiliation */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
                <Text style={styles.sectionTitle}>
                  {lang === 'gu'
                    ? '૩. બિન-જોડાણ સ્પષ્ટતા (Non-Affiliation Disclaimer)'
                    : lang === 'hi'
                    ? '३. गैर-संबद्धता प्रकटीकरण (Non-Affiliation Disclaimer)'
                    : '3. Non-Affiliation & Independent Platform'}
                </Text>
              </View>
              <Text style={styles.sectionText}>
                {lang === 'gu'
                  ? 'Council X | The Syndicate એક સ્વતંત્ર ટેકનોલોજી પ્લેટફોર્મ છે. આ પ્લેટફોર્મ કોઈ જીવંત વ્યક્તિ, રાજકીય પક્ષ, ધાર્મિક સંસ્થા કે કોર્પોરેટ સંસ્થા સાથે સંલગ્ન, સમર્થિત કે પ્રાયોજિત નથી.'
                  : lang === 'hi'
                  ? 'Council X | The Syndicate एक स्वतंत्र अनुसंधान मंच है। यह किसी भी जीवित हस्ती, राजनीतिक दल, धार्मिक न्यास या व्यावसायिक घराने से प्रत्यक्ष रूप से संबद्ध या संपोषित नहीं है।'
                  : 'Council X | The Syndicate is an independent AI research platform. It is not affiliated with, endorsed, sponsored, or officially connected with any living personality, political party, religious entity, or corporate conglomerate.'}
              </Text>
            </View>

            {/* Section 4: Strict Zero-Tolerance Adult / NSFW Policy */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                  {lang === 'gu'
                    ? '૪. કડક અશ્લીલતા વિરોધી નીતિ (Strict Zero-Tolerance NSFW Policy)'
                    : lang === 'hi'
                    ? '४. अश्लीलता एवं अभद्र सामग्री निषेध (Strict Anti-NSFW Policy)'
                    : '4. Strict Zero-Tolerance Adult / NSFW Policy'}
                </Text>
              </View>
              <Text style={styles.sectionText}>
                {lang === 'gu'
                  ? 'આ પ્લેટફોર્મ પર કોઈપણ પ્રકારના પોર્નોગ્રાફિક, અશ્લીલ, હિંસક, કે નફરત ફેલાવતા એજન્ટ બનાવવાની કે ચર્ચા કરવાની સખત મનાઈ છે. અમારું ઓટોમેટેડ સેફ્ટી ફિલ્ટર આવા તમામ પ્રયાસોને તુરંત બ્લોક કરે છે અને ખાતું રદ થઈ શકે છે.'
                  : lang === 'hi'
                  ? 'इस मंच पर किसी भी प्रकार के अश्लील, व्यस्क (Adult/Pornographic), नफरत फैलाने वाले अथवा अवैध एजेंट्स का निर्माण या वार्तालाप पूर्णतः प्रतिबंधित है। उल्लंघन करने पर खाता तत्काल समाप्त किया जा सकता है।'
                  : 'The creation or solicitation of pornographic, sexually explicit, hateful, defamatory, or illicit personas is strictly prohibited. Council X employs dual-layer content filters; violation leads to immediate suspension of services.'}
              </Text>
            </View>

            {/* Section 5: Subscription, Custom Agents & Refunds */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                <Text style={styles.sectionTitle}>
                  {lang === 'gu'
                    ? '૫. સબ્સ્ક્રિપ્શન અને પર્સનલ એજન્ટ સ્લોટ્સ'
                    : lang === 'hi'
                    ? '५. सदस्यता एवं पर्सनल एजेंट स्लॉट्स'
                    : '5. Subscriptions, Micro-Purchases & Fair Fair Quotas'}
                </Text>
              </View>
              <Text style={styles.sectionText}>
                {lang === 'gu'
                  ? 'સબ્સ્ક્રિપ્શન પ્લાન અને ₹૪૯ પર્સનલ એજન્ટ એડ-ઓન ડિજિટલ સેવાઓ છે જે ખરીદી થતાં જ તાત્કાલિક એક્ટિવેટ થાય છે. સુરક્ષિત ચુકવણી Razorpay દ્વારા પ્રોસેસ કરવામાં આવે છે.'
                  : lang === 'hi'
                  ? 'सदस्यता प्लान एवं ₹४९ पर्सनल एजेंट ऐड-ऑन डिजिटल सेवाएँ हैं जो भुगतान के तुरंत बाद सक्रिय हो जाती हैं। सभी भुगतान Razorpay द्वारा सुरक्षित रूप से प्रोसेस किए जाते हैं।'
                  : 'Subscription plans and ₹49 single agent micro-purchases are instant digital services provisioned immediately upon confirmation via Razorpay. Quotas are enforced strictly per tiered accounts.'}
              </Text>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.acceptBtn} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="checkmark-done" size={20} color="#000000" />
              <Text style={styles.acceptBtnText}>{t('termsAccept', 'I Understand & Accept')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#0F0F0F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 15
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    backgroundColor: '#141414'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E1E1E'
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  noticeBox: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center'
  },
  noticeBadge: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  lastUpdated: {
    color: '#888888',
    fontSize: 11,
    marginTop: 3
  },
  section: {
    marginBottom: 18,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242424'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1
  },
  sectionText: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 19
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    backgroundColor: '#141414'
  },
  acceptBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  acceptBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
