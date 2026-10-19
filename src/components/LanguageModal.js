/**
 * COUNCIL X | THE SYNDICATE
 * Worldwide 100+ Languages Selector Modal
 * Corporate Black & White Luxury Theme (OpenAI / Bloomberg Standard)
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, LANGUAGES } from '../utils/i18n';

export default function LanguageModal({ visible, onClose }) {
  const { lang, changeLanguage } = useLanguage();
  const [search, setSearch] = useState('');

  const popularLanguages = useMemo(() => {
    return LANGUAGES.filter((l) => l.popular);
  }, []);

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return LANGUAGES;
    const q = search.trim().toLowerCase();
    return LANGUAGES.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.label.toLowerCase().includes(q) ||
        l.englishName.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelectLanguage = (code) => {
    changeLanguage(code);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.globeIconCircle}>
                <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>Worldwide Languages</Text>
                <Text style={styles.subtitle}>100+ Global Languages & Direct Translation</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#A3A3A3" />
            </TouchableOpacity>
          </View>

          {/* Live Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color="#888888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search 100+ languages (Gujarati, Hindi, French, 日本語)..."
                placeholderTextColor="#666666"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#888888" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Pick / Popular Chips */}
          {!search.trim() && (
            <View style={styles.popularSection}>
              <Text style={styles.sectionLabel}>POPULAR LANGUAGES</Text>
              <View style={styles.chipsWrap}>
                {popularLanguages.map((l) => {
                  const isSelected = lang === l.code;
                  return (
                    <TouchableOpacity
                      key={l.code}
                      style={[styles.popularChip, isSelected && styles.popularChipSelected]}
                      onPress={() => handleSelectLanguage(l.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipFlag}>{l.flag}</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {l.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={13} color="#000000" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* 100+ Languages List */}
          <View style={styles.listSection}>
            <Text style={styles.sectionLabel}>
              ALL LANGUAGES ({filteredLanguages.length})
            </Text>
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = lang === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.langItem, isSelected && styles.langItemSelected]}
                    onPress={() => handleSelectLanguage(item.code)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemFlag}>{item.flag}</Text>
                      <View>
                        <Text style={[styles.itemNative, isSelected && styles.itemNativeSelected]}>
                          {item.label}
                        </Text>
                        <Text style={styles.itemEnglish}>{item.englishName}</Text>
                      </View>
                    </View>

                    <View style={styles.itemRight}>
                      <Text style={styles.itemCode}>{item.code.toUpperCase()}</Text>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      ) : (
                        <View style={styles.radioOutline} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  container: {
    width: '100%',
    maxWidth: 540,
    height: '88%',
    backgroundColor: '#0A0A0A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    backgroundColor: '#111111'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  globeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  subtitle: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1C1C1C'
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#282828',
    gap: 8
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13
  },
  popularSection: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  sectionLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5
  },
  popularChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  chipFlag: {
    fontSize: 12
  },
  chipText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700'
  },
  chipTextSelected: {
    color: '#000000',
    fontWeight: '800'
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  listContent: {
    paddingBottom: 20
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: '#121212',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1E1E1E'
  },
  langItemSelected: {
    backgroundColor: '#1E1E1E',
    borderColor: '#383838'
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  itemFlag: {
    fontSize: 20
  },
  itemNative: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700'
  },
  itemNativeSelected: {
    color: '#FFFFFF',
    fontWeight: '900'
  },
  itemEnglish: {
    color: '#888888',
    fontSize: 11,
    marginTop: 1
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  itemCode: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  radioOutline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#333333'
  }
});
