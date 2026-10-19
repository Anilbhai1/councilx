/**
 * COUNCIL X | THE SYNDICATE
 * Geographic Region / Country Selector Carousel
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const REGION_ICONS = {
  'All': 'globe-outline',
  'India': 'earth',
  'USA': 'flag-outline',
  'Japan': 'compass-outline',
  'Europe': 'business-outline',
  'China': 'shield-half-outline',
  'Ancient Greece': 'library-outline',
  'Global': 'planet-outline'
};

export default function CountryFilter({ regions, selectedRegion, onSelectRegion }) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="map-outline" size={13} color={COLORS.gold} />
        <Text style={styles.sectionTitle}>GEO-INTELLIGENCE FILTER</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {regions.map((region) => {
          const isSelected = selectedRegion === region;
          const iconName = REGION_ICONS[region] || 'location-outline';

          return (
            <TouchableOpacity
              key={region}
              style={[styles.chip, isSelected && styles.selectedChip]}
              onPress={() => onSelectRegion(region)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={iconName} 
                size={12} 
                color={isSelected ? '#000000' : COLORS.gold} 
              />
              <Text style={[styles.chipText, isSelected && styles.selectedText]}>
                {region}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  selectedChip: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldLight,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  selectedText: {
    color: '#000000',
    fontWeight: '900',
  },
});
