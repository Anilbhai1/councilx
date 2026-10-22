/**
 * COUNCIL X | THE SYNDICATE
 * Progressive Web App (PWA) Controller & Installation Engine
 * Manages service worker registration, manifest injection, and 'Install App' prompt lifecycle
 */

import { Platform } from 'react-native';

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.listeners = new Set();
    this.installed = false;
    this.initialized = false;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Check if already installed / running in standalone mode
    this.checkStandalone();

    // 2. Inject PWA Manifest & Meta Tags dynamically into <head>
    this.injectPWAMetaTags();

    // 3. Register Service Worker
    this.registerServiceWorker();

    // 4. Capture native 'beforeinstallprompt' event (Chrome, Edge, Android Chrome, Brave)
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent automatic browser mini-infobar
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyListeners();
    });

    // 5. Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.installed = true;
      this.deferredPrompt = null;
      this.notifyListeners();
      console.log('✅ CouncilX PWA installed successfully on device');
    });
  }

  checkStandalone() {
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    this.installed = Boolean(isStandalone);
  }

  injectPWAMetaTags() {
    if (typeof document === 'undefined') return;

    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    // 1. <link rel="manifest" href="/manifest.json">
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      head.appendChild(manifestLink);
    }

    // 2. <meta name="theme-color" content="#00F0FF">
    if (!document.querySelector('meta[name="theme-color"]')) {
      const themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      themeMeta.content = '#00F0FF';
      head.appendChild(themeMeta);
    }

    // 3. iOS Web App Capable
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const iosMeta = document.createElement('meta');
      iosMeta.name = 'apple-mobile-web-app-capable';
      iosMeta.content = 'yes';
      head.appendChild(iosMeta);
    }

    // 4. iOS Status Bar Style
    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const iosStatusMeta = document.createElement('meta');
      iosStatusMeta.name = 'apple-mobile-web-app-status-bar-style';
      iosStatusMeta.content = 'black-translucent';
      head.appendChild(iosStatusMeta);
    }

    // 5. iOS App Title
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const iosTitleMeta = document.createElement('meta');
      iosTitleMeta.name = 'apple-mobile-web-app-title';
      iosTitleMeta.content = 'CouncilX';
      head.appendChild(iosTitleMeta);
    }

    // 6. Apple Touch Icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = '/assets/icon.png';
      head.appendChild(appleIcon);
    }
  }

  registerServiceWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ CouncilX Service Worker registered. Scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('ℹ️ Service Worker registration notice:', err?.message || err);
        });
    });
  }

  isIOS() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  }

  isInstalled() {
    this.checkStandalone();
    return this.installed;
  }

  canPromptDirectly() {
    return Boolean(this.deferredPrompt);
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      return {
        success: false,
        isIOS: this.isIOS(),
        isInstalled: this.isInstalled(),
        reason: 'no-prompt'
      };
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.notifyListeners();

      return {
        success: choiceResult.outcome === 'accepted',
        outcome: choiceResult.outcome,
        isIOS: false,
        isInstalled: choiceResult.outcome === 'accepted'
      };
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      return { success: false, error: err.message };
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb({
          canInstall: this.canPromptDirectly(),
          isInstalled: this.isInstalled(),
          isIOS: this.isIOS()
        });
      } catch (e) {}
    }
  }
}

export const pwaService = new PWAService();
