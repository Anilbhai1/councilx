/**
 * COUNCIL X | THE SYNDICATE
 * Live Market Ticker Marquee Component (src/components/LiveMarketTicker.js)
 * 
 * Fetches real benchmark indices from /api/ticker (Nifty 50, Sensex, Bank Nifty, Crude, Gold, USD/INR)
 * and renders a continuous scrolling marquee ticker at the top of the UI.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { geminiService } from '../services/geminiService';

export default function LiveMarketTicker({ onSelectTicker, style }) {
  const [tickerItems, setTickerItems] = useState([
    { symbol: '^NSEI', name: 'NIFTY 50', price: 24200.5, change: 125.4, changePercent: 0.52 },
    { symbol: '^BSESN', name: 'SENSEX', price: 79450.2, change: 380.1, changePercent: 0.48 },
    { symbol: '^NSEBANK', name: 'BANK NIFTY', price: 51800.0, change: -45.0, changePercent: -0.09 },
    { symbol: 'CL=F', name: 'CRUDE OIL', price: 71.5, change: -0.8, changePercent: -1.10 },
    { symbol: 'GC=F', name: 'GOLD', price: 2750.0, change: 14.2, changePercent: 0.52 },
    { symbol: 'USDINR=X', name: 'USD/INR', price: 84.1, change: 0.05, changePercent: 0.06 }
  ]);

  useEffect(() => {
    let isMounted = true;
    const loadTicker = async () => {
      try {
        const data = await geminiService.fetchLiveMarketOverview();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setTickerItems(data);
        }
      } catch (e) {}
    };

    loadTicker();
    const interval = setInterval(loadTicker, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={[styles.tickerContainer, style]}>
      <View style={styles.pulseBox}>
        <View style={styles.pulseDot} />
        <Text style={styles.pulseLabel}>MARKET PULSE</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tickerItems.map((item, idx) => {
          const isUp = (item.change || 0) >= 0;
          return (
            <TouchableOpacity
              key={`${item.symbol || idx}-${idx}`}
              style={styles.tickerChip}
              activeOpacity={0.8}
              onPress={() => onSelectTicker && onSelectTicker(item)}
            >
              <Text style={styles.tickerName}>{item.name || item.symbol}</Text>
              <Text style={styles.tickerPrice}>
                {item.price ? Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
              </Text>
              <Text style={[styles.tickerChange, isUp ? styles.textUp : styles.textDown]}>
                {isUp ? '▲ +' : '▼ '}{item.changePercent ? item.changePercent.toFixed(2) : '0.00'}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tickerContainer: {
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    overflow: 'hidden'
  },
  pulseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#262626'
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF66',
    marginRight: 6
  },
  pulseLabel: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 16
  },
  tickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8
  },
  tickerName: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  tickerPrice: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  tickerChange: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  textUp: {
    color: '#00FF66'
  },
  textDown: {
    color: '#FF4444'
  }
});

