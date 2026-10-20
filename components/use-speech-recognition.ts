"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// La Web Speech API n'est pas dans lib.dom de TypeScript : types minimaux de ce qu'on utilise.
type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Accès au micro refusé : autorisez-le dans votre navigateur.",
  "service-not-allowed": "Accès au micro refusé : autorisez-le dans votre navigateur.",
  "audio-capture": "Aucun micro détecté.",
  network: "La reconnaissance vocale nécessite une connexion internet.",
};

/**
 * Dictée vocale (speech to text) via la Web Speech API du navigateur.
 * `onTranscript` reçoit tout ce qui a été dicté depuis le dernier `start()`.
 */
export function useSpeechRecognition(lang: string, onTranscript: (text: string) => void) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => getCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onTranscriptRef.current(text.trim());
    };
    recognition.onerror = (e) => {
      // "no-speech" et "aborted" ne sont pas de vraies erreurs (silence, arrêt volontaire).
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(ERRORS[e.error] ?? "La dictée vocale a échoué, réessayez.");
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    setError(null);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setError("Impossible de démarrer le micro.");
    }
  }, [lang]);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
