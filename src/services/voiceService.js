/**
 * COUNCIL X | THE SYNDICATE
 * Voice Service: Speech-to-Text (Mic Input) & Text-to-Speech (Listen / Read Aloud)
 * Supports Gujarati (gu-IN), Hindi (hi-IN), and English (en-US)
 */

import { Platform } from 'react-native';

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
  }

  getLangCode(lang = 'gu') {
    switch (lang) {
      case 'gu':
        return 'gu-IN';
      case 'hi':
        return 'hi-IN';
      default:
        return 'en-US';
    }
  }

  isSpeechRecognitionSupported() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    return false;
  }

  /**
   * Start listening from microphone and stream transcript live
   */
  startListening({ lang = 'gu', onTranscript, onError, onEnd }) {
    if (!this.isSpeechRecognitionSupported()) {
      if (onError) onError('Speech recognition not supported in this browser.');
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.getLangCode(lang);
      this.recognition.interimResults = true;
      this.recognition.continuous = true;

      this.recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (onTranscript) onTranscript(fullTranscript);
      };

      this.recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (onError) onError(event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      if (onError) onError(err.message);
      this.isListening = false;
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  /**
   * Read aloud AI response in active language
   */
  speak({ text, lang = 'gu', onStart, onEnd }) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      this.stopSpeaking();

      // Clean markdown symbols for cleaner voice speech
      const cleaned = text
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .replace(/•/g, '')
        .trim();

      const utterance = new window.SpeechSynthesisUtterance(cleaned);
      utterance.lang = this.getLangCode(lang);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    }
    return false;
  }

  stopSpeaking() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
  }
}

export const voiceService = new VoiceService();
