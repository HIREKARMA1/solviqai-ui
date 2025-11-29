'use client';

import { useEffect, useRef, useState } from 'react';

type UseTranscriptionOptions = {
  language?: string;
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  emitEveryMs?: number;
  enabled?: boolean;
};

export function useTranscription(options: UseTranscriptionOptions = {}) {
  const { language = 'en-US', onPartial, onFinal, emitEveryMs = 2000, enabled = true } = options;
  const [isListening, setIsListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [finalized, setFinalized] = useState('');
  const [confidence, setConfidence] = useState(100);
  const recognitionRef = useRef<any>(null);
  const lastEmitRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      let conf = 1.0;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        conf = event.results[i][0].confidence ?? conf;
        if (event.results[i].isFinal) finalText += transcript + ' ';
        else interim += transcript;
      }
      if (interim) {
        setPartial(interim);
        const now = Date.now();
        if (onPartial && now - lastEmitRef.current >= emitEveryMs) {
          lastEmitRef.current = now;
          onPartial(interim);
        }
      } else {
        setPartial('');
      }
      if (finalText) {
        setFinalized((prev) => prev + finalText);
        setConfidence(Math.round((conf || 1.0) * 100));
        onFinal && onFinal(finalText.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      if (isListening && enabled) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, [language, emitEveryMs, onPartial, onFinal, isListening, enabled]);

  useEffect(() => {
    if (!recognitionRef.current) return;
    if (!enabled) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  }, [enabled]);

  const start = () => {
    if (!recognitionRef.current) return;
    if (!enabled) return;
    try {
      setPartial('');
      setFinalized('');
      lastEmitRef.current = 0;
      recognitionRef.current.start();
      setIsListening(true);
    } catch {}
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  };

  return {
    isListening,
    partial,
    finalized,
    confidence,
    start,
    stop,
    reset: () => {
      setPartial('');
      setFinalized('');
    }
  };
}


