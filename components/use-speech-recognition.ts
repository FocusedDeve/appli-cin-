"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { transcribeAudio } from "@/app/transcribe";
import { DICTS } from "@/lib/i18n";
import { useLang } from "@/lib/use-lang";

const SAMPLE_RATE = 16000;
const MAX_SECONDS = 45;

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/** Encode un AudioBuffer en WAV 16 bits mono. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Décode l'enregistrement du navigateur (webm/mp4) et le convertit en WAV 16 kHz mono, léger à envoyer. */
async function toWav(blob: Blob): Promise<Blob> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * SAMPLE_RATE), SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return encodeWav(rendered.getChannelData(0), SAMPLE_RATE);
  } finally {
    void ctx.close();
  }
}

const MIC_ERRORS: Record<string, "micDenied" | "micNotFound" | "micBusy"> = {
  NotAllowedError: "micDenied",
  SecurityError: "micDenied",
  NotFoundError: "micNotFound",
  NotReadableError: "micBusy",
};

/**
 * Dictée vocale (speech to text) : enregistre le micro, puis envoie l'audio au serveur,
 * qui le transcrit avec Gemini. Fonctionne sur tous les navigateurs ayant MediaRecorder.
 * `onTranscript` reçoit le texte dicté une fois l'enregistrement arrêté.
 */
export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const lang = useLang();
  const langRef = useRef(lang);
  const supported = useSyncExternalStore(
    () => () => {},
    isSupported,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    langRef.current = lang;
  });

  const releaseMic = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      releaseMic();
    },
    [releaseMic],
  );

  const start = useCallback(async () => {
    if (!isSupported() || recorderRef.current) return;
    setError(null);
    cancelledRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setError(DICTS[langRef.current][MIC_ERRORS[(e as Error).name] ?? "micFailed"]);
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = async () => {
      releaseMic();
      recorderRef.current = null;
      setListening(false);
      if (cancelledRef.current || chunks.length === 0) return;

      setTranscribing(true);
      try {
        const wav = await toWav(new Blob(chunks, { type: recorder.mimeType }));
        const formData = new FormData();
        formData.append("audio", wav, "dictee.wav");
        formData.append("lang", langRef.current);
        const result = await transcribeAudio(formData);
        if (cancelledRef.current) return;
        if (result.ok) onTranscriptRef.current(result.text);
        else setError(result.error);
      } catch {
        if (!cancelledRef.current) setError(DICTS[langRef.current].dictationFailed);
      } finally {
        setTranscribing(false);
      }
    };

    recorder.start();
    setListening(true);
    // Arrêt automatique : garde l'envoi léger et évite un micro resté ouvert.
    timeoutRef.current = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, MAX_SECONDS * 1000);
  }, [releaseMic]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  /** Abandonne l'enregistrement en cours sans le transcrire. */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  return { supported, listening, transcribing, error, start, stop, cancel };
}
