/**
 * COUNCIL X | THE SYNDICATE
 * Domain Category Filter Component
 * Corporate Black & White Luxury Theme (OpenAI / Bloomberg Minimal)
 */

import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/i18n';

const CATEGORY_ICONS = {
  'All': 'apps-outline',
  'Arts, Cinema & Entertainment (કલા, સિનેમા અને મનોરંજન)': 'film-outline',
  'Rajniti & Statecraft (રાજનીતિ)': 'shield-checkmark-outline',
  'Wealth & Finance': 'cash-outline',
  'Business & Startup': 'rocket-outline',
  'War & Strategy': 'flame-outline',
  'Medicine & Ayurveda (આયુર્વેદ અને મેડિકલ)': 'fitness-outline',
  'Tech & Science': 'hardware-chip-outline',
  'Marketing & Psychology': 'bulb-outline',
  'Philosophy & Dharma': 'infinite-outline',
  'Sports & Fitness (રમતગમત અને ફિટનેસ)': 'football-outline'
};

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  const { category, t } = useLanguage();
  const scrollRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);
  const [isGridExpanded, setIsGridExpanded] = useState(false);

  const handleScrollLeft = () => {
    const newPos = Math.max(0, scrollX - 220);
    scrollRef.current?.scrollTo({ x: newPos, animated: true });
    setScrollX(newPos);
  };

  const handleScrollRight = () => {
    const newPos = scrollX + 220;
    scrollRef.current?.scrollTo({ x: newPos, animated: true });
    setScrollX(newPos);
  };

  return (
    <View style={styles.container}>
      {/* Controls Bar: Grid View Toggle and Title */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{t('filterLabel', 'Select Category:')}</Text>
        <TouchableOpacity
          style={styles.expandToggleBtn}
          onPress={() => setIsGridExpanded(!isGridExpanded)}
          activeOpacity={0.75}
        >
          <Text style={styles.expandToggleText}>
            {isGridExpanded ? t('collapseCategories', 'Collapse ▴') : t('showAllCategories', 'View All Categories ▾')}
          </Text>
          <Ionicons
            name={isGridExpanded ? "grid" : "grid-outline"}
            size={12}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Grid Mode (Expanded Multi-Row) */}
      {isGridExpanded ? (
        <View style={styles.gridContainer}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const icon = CATEGORY_ICONS[cat] || 'ellipse-outline';
            const localizedLabel = category(cat);

            return (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, styles.gridPill, isSelected && styles.selectedPill]}
                onPress={() => onSelectCategory(cat)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={icon}
                  size={13}
                  color={isSelected ? '#000000' : '#A3A3A3'}
                />
                <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>
                  {localizedLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Horizontal Scroll Mode with Left/Right Arrows */
        <View style={styles.scrollWrapper}>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={handleScrollLeft}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={14} color="#D1D5DB" />
          </TouchableOpacity>

          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const icon = CATEGORY_ICONS[cat] || 'ellipse-outline';
              const localizedLabel = category(cat);

              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pill, isSelected && styles.selectedPill]}
                  onPress={() => onSelectCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={icon}
                    size={13}
                    color={isSelected ? '#000000' : '#A3A3A3'}
                  />
                  <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>
                    {localizedLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={handleScrollRight}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  headerTitle: {
    color: '#888888',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  expandToggleText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  scrollWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    width: 26,
    height: 32,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 6,
    gap: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  gridPill: {
    marginVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
  },
  selectedPill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  pillText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
  },
  selectedPillText: {
    color: '#000000',
    fontWeight: '900',
  },
});
