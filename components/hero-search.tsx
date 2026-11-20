"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ArrowUpRight, Dices, Loader2, Mic, Share2, Square, Trash2 } from "lucide-react";
import {
  generateRecommendations,
  replaceRecommendation,
  type Recommendation,
} from "@/app/actions";
import { ChoiceModal } from "@/components/choice-modal";
import { NoralyAvatar } from "@/components/noraly-avatar";
import { RecommendationCard, RecommendationCardSkeleton } from "@/components/recommendation-card";
import { useToast } from "@/components/toast";
import { useSpeechRecognition } from "@/components/use-speech-recognition";
import { MODIFIERS, type ExcludedItem, type ModifierId, type SearchRequest } from "@/lib/search";
import { useAmbiance } from "@/lib/ambiance";
import { useLang, useT } from "@/lib/use-lang";
import { useHistory, useSeenItems } from "@/lib/user-data";

const MAX_LENGTH = 500;
const DUO_MAX_LENGTH = 300;
const MIN_LENGTH = 5;
const PAGE_SIZE = 5;

type Mode = "solo" | "duo";

type Results = {
  request: SearchRequest;
  items: Recommendation[];
  modifiers: ModifierId[];
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; results: Results; refreshing: boolean }
  | { status: "error"; message: string };

const keyOf = (r: { type: string; id: number }) => `${r.type}:${r.id}`;
const toExcluded = (r: Recommendation): ExcludedItem => ({ id: r.id, type: r.type, title: r.title });

function describe(request: SearchRequest) {
  return request.mode === "solo" ? request.prompt : `${request.first} / ${request.second}`;
}

export function HeroSearch() {
  const toast = useToast();
  const ambiance = useAmbiance();
  const t = useT();
  const lang = useLang();
  const seen = useSeenItems();
  const history = useHistory();

  const [mode, setMode] = useState<Mode>("solo");
  const [prompt, setPrompt] = useState("");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  // Texte déjà saisi au moment où la dictée démarre : la dictée s'y ajoute.
  const baseRef = useRef("");
  const voice = useSpeechRecognition((transcript) =>
    setPrompt(`${baseRef.current} ${transcript}`.trim().slice(0, MAX_LENGTH)),
  );

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [state, setState] = useState<State>({ status: "idle" });
  const [replacing, setReplacing] = useState<string[]>([]);

  // Tirage au sort « Choisis pour moi ».
  const [highlight, setHighlight] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Recommendation | null>(null);
  const lastWinnerRef = useRef<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // Dernières cartes affichées : « Déjà vu » ne doit pas relire un instantané périmé.
  const itemsRef = useRef<Recommendation[]>([]);

  const loading = state.status === "loading";
  const refreshing = state.status === "success" && state.refreshing;
  const busy = loading || refreshing;
  const results = state.status === "success" ? state.results : null;
  useEffect(() => {
    itemsRef.current = results?.items ?? [];
  });

  const valid =
    mode === "solo"
      ? prompt.trim().length >= MIN_LENGTH
      : first.trim().length >= MIN_LENGTH && second.trim().length >= MIN_LENGTH;

  function currentRequest(): SearchRequest {
    return mode === "solo"
      ? { mode, prompt: prompt.trim() }
      : { mode, first: first.trim(), second: second.trim() };
  }

  /** Arrête le tirage au sort en cours (timers + état) avant de modifier la grille. */
  function stopDraw() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setSpinning(false);
    setWinner(null);
    setHighlight(null);
  }

  /** Nouvelle recherche depuis le formulaire (ou l'historique). */
  async function search(request: SearchRequest) {
    if (busy) return;
    voice.cancel();
    stopDraw();
    history.add(request);
    setVisible(PAGE_SIZE);
    setHighlight(null);
    setState({ status: "loading" });
    try {
      const result = await generateRecommendations(request, { exclude: seen.recent, lang });
      setState(
        result.ok
          ? { status: "success", refreshing: false, results: { request, items: result.recommendations, modifiers: [] } }
          : { status: "error", message: result.error },
      );
    } catch {
      setState({ status: "error", message: t.memoryLapse });
    }
  }

  function submit() {
    if (!valid) return;
    void search(currentRequest());
  }

  /** Relance la recommandation avec une nouvelle combinaison de modificateurs d'ambiance. */
  async function refine(modifiers: ModifierId[]) {
    if (!results || busy || replacing.length > 0) return;
    stopDraw();
    const { request, items } = results;
    setState({ status: "success", results, refreshing: true });
    try {
      const result = await generateRecommendations(request, {
        modifiers,
        exclude: [...items.map(toExcluded), ...seen.recent],
        lang,
      });
      if (result.ok) {
        setVisible(PAGE_SIZE);
        setHighlight(null);
        setState({
          status: "success",
          refreshing: false,
          results: { request, items: result.recommendations, modifiers },
        });
      } else {
        toast(result.error);
        setState({ status: "success", results, refreshing: false });
      }
    } catch {
      toast(t.memoryLapse);
      setState({ status: "success", results, refreshing: false });
    }
  }

  function toggleModifier(id: ModifierId) {
    if (!results) return;
    const next = results.modifiers.includes(id)
      ? results.modifiers.filter((m) => m !== id)
      : [...results.modifiers, id];
    void refine(next);
  }

  /** « Déjà vu » : mémorise l'œuvre puis remplace uniquement cette carte. */
  async function markSeen(target: Recommendation) {
    if (!results || replacing.includes(keyOf(target))) return;
    const { request, modifiers } = results;
    const items = itemsRef.current;
    const targetKey = keyOf(target);
    seen.add(toExcluded(target));
    setReplacing((list) => [...list, targetKey]);

    // Remplace dans l'état courant (et pas dans un instantané périmé) : d'autres cartes ont pu changer.
    const swap = (replacement: Recommendation | null) =>
      setState((current) => {
        if (current.status !== "success") return current;
        const list = current.results.items;
        const next = replacement
          ? list.map((r) => (keyOf(r) === targetKey ? replacement : r))
          : list.filter((r) => keyOf(r) !== targetKey);
        return { ...current, results: { ...current.results, items: next } };
      });

    try {
      const result = await replaceRecommendation(request, {
        modifiers,
        // Tout ce qui est affiché, plus les œuvres déjà vues (la carte courante en fait partie).
        exclude: [toExcluded(target), ...items.map(toExcluded), ...seen.recent],
        lang,
      });
      if (result.ok) {
        swap(result.recommendation);
      } else {
        toast(result.error);
        swap(null);
      }
    } catch {
      toast(t.memoryLapseCard);
      swap(null);
    } finally {
      setReplacing((list) => list.filter((k) => k !== targetKey));
    }
  }

  async function share() {
    if (!results) return;
    const shown = results.items.slice(0, visible);
    const items = shown.map((r) => keyOf(r)).join(",");
    const q = describe(results.request).slice(0, 150);
    const url = `${window.location.origin}/selection?items=${items}&q=${encodeURIComponent(q)}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t.shareTitle, text: t.shareText, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // Partage natif indisponible : repli sur la copie.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(t.linkCopied);
    } catch {
      toast(t.copyFailed);
    }
  }

  /** Roulette : un contour saute de carte en carte en ralentissant, puis la modale annonce le gagnant. */
  function pickForMe() {
    if (!results || spinning) return;
    const pool = results.items.slice(0, visible);
    if (pool.length < 2) return;

    const candidates = pool.filter((r) => keyOf(r) !== lastWinnerRef.current);
    const winnerCard = candidates[Math.floor(Math.random() * candidates.length)];
    const winnerIndex = pool.indexOf(winnerCard);

    const steps = 14;
    let elapsed = 0;
    setWinner(null);
    setSpinning(true);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    for (let i = 0; i < steps; i++) {
      // On remonte depuis le gagnant : la dernière étape tombe forcément dessus.
      const index = (((winnerIndex - (steps - 1 - i)) % pool.length) + pool.length) % pool.length;
      // Délai croissant (easing quadratique) : 50 ms au début, ~270 ms à la fin, ≈ 1,8 s au total.
      elapsed += 50 + 220 * (i / (steps - 1)) ** 2;
      timersRef.current.push(
        setTimeout(() => {
          const card = pool[index];
          setHighlight(keyOf(card));
          document.getElementById(`card-${keyOf(card)}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, elapsed),
      );
    }
    timersRef.current.push(
      setTimeout(() => {
        lastWinnerRef.current = keyOf(winnerCard);
        setSpinning(false);
        setWinner(winnerCard);
      }, elapsed + 500),
    );
  }

  function closeWinner() {
    setWinner(null);
    setHighlight(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée envoie, Maj+Entrée insère un retour à la ligne.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    voice.cancel();
    setMode(next);
  }

  function replay(request: SearchRequest) {
    setMode(request.mode);
    if (request.mode === "solo") setPrompt(request.prompt);
    else {
      setFirst(request.first);
      setSecond(request.second);
    }
    void search(request);
  }

  const compact = state.status === "success" || state.status === "loading";
  const duo = results?.request.mode === "duo";
  const shown = results?.items.slice(0, visible) ?? [];
  const showSuggestions = state.status === "idle" || state.status === "error";

  return (
    <section
      className={`mx-auto flex w-full max-w-6xl flex-col px-5 sm:px-8 ${
        compact ? "pt-28" : "min-h-svh justify-center pb-16 pt-24"
      }`}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {!compact && <NoralyAvatar size={48} />}
          <h1
            className={`font-display text-balance leading-[1.05] text-ink ${
              compact ? "text-3xl sm:text-4xl" : "mt-6 text-5xl sm:text-6xl"
            }`}
          >
            {t.heroTitleStart} <em className="text-ink-2">{t.heroTitleVerb}</em> {ambiance}
            {lang === "fr" ? " ?" : "?"}
          </h1>
          {!compact && (
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-ink-2">
              {t.heroSubtitle}
            </p>
          )}
        </motion.div>

        <div
          role="group"
          aria-label={t.searchMode}
          className="relative mt-8 flex rounded-xl border border-line bg-surface p-1"
        >
          {(
            [
              { id: "solo", label: t.solo },
              { id: "duo", label: t.duo },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchMode(id)}
              aria-pressed={mode === id}
              disabled={busy}
              className={`relative h-10 min-w-24 rounded-lg px-5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed ${
                mode === id ? "text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              {mode === id && (
                <motion.span
                  layoutId="mode-indicator"
                  className="absolute inset-0 rounded-lg bg-elevated"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-4 w-full rounded-2xl border border-line bg-surface p-3 transition-colors duration-150 focus-within:border-line-strong"
        >
          {mode === "solo" ? (
            <AutoTextarea
              value={prompt}
              onChange={setPrompt}
              onKeyDown={onKeyDown}
              maxLength={MAX_LENGTH}
              disabled={busy}
              placeholder={t.promptPlaceholder}
              ariaLabel={t.promptAria}
              className="w-full px-2 py-1.5 text-lg"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { label: t.person1, value: first, set: setFirst, placeholder: t.person1Placeholder },
                  { label: t.person2, value: second, set: setSecond, placeholder: t.person2Placeholder },
                ] as const
              ).map((field) => (
                <label key={field.label} className="block rounded-xl border border-line bg-canvas px-3 py-2 focus-within:border-line-strong">
                  <span className="text-xs font-medium text-ink-2">{field.label}</span>
                  <AutoTextarea
                    value={field.value}
                    onChange={field.set}
                    onKeyDown={onKeyDown}
                    maxLength={DUO_MAX_LENGTH}
                    disabled={busy}
                    placeholder={field.placeholder}
                    className="mt-1 w-full"
                  />
                </label>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 px-2 pt-2">
            <span className="text-xs text-ink-2">
              {mode === "solo" ? (
                <>
                  <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">Ctrl</kbd>{" "}
                  <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">{t.keyEnter}</kbd> {t.toLaunch}
                </>
              ) : (
                t.duoHint
              )}
            </span>
            <div className="flex items-center gap-2">
              {mode === "solo" && voice.supported && (
                <button
                  type="button"
                  onClick={() => {
                    if (voice.listening) {
                      voice.stop();
                    } else {
                      baseRef.current = prompt;
                      voice.start();
                    }
                  }}
                  disabled={busy || voice.transcribing}
                  aria-label={voice.listening ? t.micStop : t.micStart}
                  aria-pressed={voice.listening}
                  className={`relative flex size-11 items-center justify-center rounded-xl transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    voice.listening ? "bg-red-600 text-white" : "text-ink-2 hover:bg-elevated hover:text-ink"
                  }`}
                >
                  {voice.listening && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-xl bg-red-500/50"
                      animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  {voice.transcribing ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : voice.listening ? (
                    <Square className="relative size-4 fill-current" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </button>
              )}
              <button
                type="submit"
                disabled={busy || !valid}
                aria-label={t.launch}
                className="flex size-11 items-center justify-center rounded-xl bg-navy text-ink transition-colors duration-150 hover:bg-navy-hover disabled:cursor-not-allowed disabled:bg-elevated disabled:text-ink-2"
              >
                <ArrowUp className="size-5" />
              </button>
            </div>
          </div>
          {mode === "solo" && (voice.listening || voice.transcribing || voice.error) && (
            <p
              role={voice.error ? "alert" : "status"}
              className={`px-2 pt-2 text-xs ${voice.error ? "text-red-400" : "text-ink-2"}`}
            >
              {voice.error ??
                (voice.transcribing ? t.transcribing : t.listening)}
            </p>
          )}
        </form>

        {showSuggestions && (
          <div className="mt-6 w-full space-y-6">
            {state.status === "error" && (
              <p role="alert" className="text-center text-sm text-red-400">
                {state.message}
              </p>
            )}

            {state.status === "idle" && mode === "solo" && (
              <ul className="flex flex-col items-start gap-1 sm:items-center">
                {t.examples.map((example) => (
                  <li key={example}>
                    <button
                      type="button"
                      onClick={() => setPrompt(example)}
                      className="group inline-flex min-h-11 items-center gap-1.5 text-left text-sm text-ink-2 transition-colors duration-150 hover:text-ink"
                    >
                      {example}
                      <ArrowUpRight className="size-3.5 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {history.entries.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h2 className="text-xs font-medium text-ink-2">{t.recents}</h2>
                  <button
                    type="button"
                    onClick={history.clear}
                    aria-label={t.clearHistory}
                    title={t.clearHistory}
                    className="flex size-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-elevated hover:text-ink"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <ul>
                  {history.entries.map((entry) => (
                    <li key={entry.at}>
                      <button
                        type="button"
                        onClick={() => replay(entry.request)}
                        title={describe(entry.request)}
                        className="flex min-h-11 w-full items-center gap-2 text-left text-sm text-ink-2 transition-colors duration-150 hover:text-ink"
                      >
                        {entry.request.mode === "duo" && (
                          <span className="shrink-0 rounded border border-line px-1.5 text-xs">{t.duoBadge}</span>
                        )}
                        <span className="truncate">{describe(entry.request)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && <LoadingState duo={mode === "duo"} />}

      {state.status === "success" && results && (
        <div className="pb-24 pt-10">
          <div className="mb-8 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.modifiersAria}>
              {MODIFIERS.map((m) => {
                const active = results.modifiers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModifier(m.id)}
                    disabled={busy || replacing.length > 0}
                    aria-pressed={active}
                    className={`h-11 rounded-lg border px-4 text-sm transition-colors duration-150 disabled:cursor-not-allowed ${
                      active
                        ? "border-line-strong bg-navy text-ink"
                        : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {t.modifiers[m.id] ?? m.label}
                  </button>
                );
              })}
              {refreshing && (
                <span role="status" className="flex items-center gap-2 text-sm text-ink-2">
                  <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <NoralyAvatar size={24} />
                  </motion.span>
                  {t.refreshing}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {shown.length >= 2 && (
                <button
                  type="button"
                  onClick={pickForMe}
                  disabled={busy || spinning}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-navy-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Dices className="size-4" />
                  {t.pickForMe}
                </button>
              )}
              <button
                type="button"
                onClick={share}
                disabled={busy}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Share2 className="size-4" />
                {t.share}
              </button>
            </div>
          </div>

          <p className="mb-6 flex items-center gap-3 text-ink-2">
            <NoralyAvatar size={32} />
            {duo ? t.selectionDuo : t.selectionSolo}
          </p>

          <ul
            className={`grid grid-cols-1 gap-x-6 gap-y-10 transition-opacity duration-150 sm:grid-cols-2 lg:grid-cols-3 ${
              refreshing ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((r, i) => (
                <motion.li
                  key={keyOf(r)}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: (i % PAGE_SIZE) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                >
                  {replacing.includes(keyOf(r)) ? (
                    <RecommendationCardSkeleton />
                  ) : (
                    <RecommendationCard
                      recommendation={r}
                      duo={duo}
                      onSeen={markSeen}
                      highlighted={highlight === keyOf(r)}
                    />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {visible < results.items.length && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="h-11 rounded-lg border border-line px-6 text-sm text-ink transition-colors duration-150 hover:border-line-strong"
              >
                {t.seeMore}
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {winner && (
          <ChoiceModal
            key={keyOf(winner)}
            recommendation={winner}
            duo={duo}
            onClose={closeWinner}
            onRetry={() => {
              closeWinner();
              pickForMe();
            }}
            canRetry={shown.length > 2}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/** Zone de saisie qui grandit avec le texte (4 lignes mini, 10 maxi). */
function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  maxLength,
  disabled,
  placeholder,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  maxLength: number;
  disabled: boolean;
  placeholder: string;
  ariaLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      maxLength={maxLength}
      rows={3}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={`resize-none bg-transparent leading-relaxed text-ink placeholder:text-ink-2 focus:outline-none disabled:opacity-60 ${className}`}
    />
  );
}

function LoadingState({ duo }: { duo: boolean }) {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="pb-24 pt-12">
      <div className="mb-10 flex items-center justify-center gap-3">
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <NoralyAvatar size={40} />
        </motion.span>
        <p className="text-ink-2">
          {duo ? t.loadingDuo : t.loadingSolo}
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <li key={i} className={i === 2 ? "hidden lg:block" : ""}>
            <RecommendationCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
