"use client";

import { useEffect, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { generateRecommendations, type Recommendation } from "@/app/actions";

const MAX_LENGTH = 500;

const EXAMPLES = [
  "Un huis clos psychologique avec une fin inattendue",
  "Un film feel-good pour un dimanche pluvieux",
  "Un thriller coréen sur la vengeance",
];

const LOADING_MESSAGES = [
  "Analyse de vos goûts en cours…",
  "Exploration de la cinémathèque…",
  "Sélection des films qui vous correspondent…",
  "Recherche des plateformes gratuites…",
];

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; recommendations: Recommendation[] }
  | { status: "error"; message: string };

export function HeroSearch() {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [, startTransition] = useTransition();
  const loading = state.status === "loading";

  function submit(text: string) {
    const value = text.trim();
    if (value.length < 5 || loading) return;
    setState({ status: "loading" });
    startTransition(async () => {
      try {
        const result = await generateRecommendations(value);
        setState(
          result.ok
            ? { status: "success", recommendations: result.recommendations }
            : { status: "error", message: result.error },
        );
      } catch {
        setState({ status: "error", message: "Une erreur est survenue, réessayez." });
      }
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(prompt);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée envoie, Maj+Entrée insère un retour à la ligne.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(prompt);
    }
  }

  const compact = state.status === "success";

  return (
    <section
      className={`relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 transition-all duration-700 ${
        compact ? "pt-32" : "min-h-svh justify-center"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/20 blur-3xl"
      />

      <motion.div
        layout
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Que voulez-vous <span className="text-blue-500">regarder</span> ?
        </h1>
        {!compact && (
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Décrivez un scénario, une ambiance, un acteur. Le sommelier vous propose une sélection sur-mesure.
          </p>
        )}
      </motion.div>

      <motion.form
        layout
        onSubmit={onSubmit}
        className="mt-10 w-full rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl transition-shadow focus-within:border-blue-500/50 focus-within:shadow-[0_0_40px_-5px_rgba(30,64,175,0.7)]"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={MAX_LENGTH}
          rows={3}
          disabled={loading}
          placeholder="Ex : un huis clos psychologique avec une fin inattendue…"
          aria-label="Décrivez le film que vous cherchez"
          className="w-full resize-none bg-transparent px-3 py-2 text-lg text-white placeholder:text-gray-500 focus:outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-xs text-gray-500">
            {prompt.length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={loading || prompt.trim().length < 5}
            aria-label="Lancer la recherche"
            className="flex size-10 items-center justify-center rounded-full bg-blue-700 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </motion.form>

      <div className="mt-6 min-h-24 w-full">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-gray-400 transition hover:border-blue-500/50 hover:text-white"
                >
                  {example}
                </button>
              ))}
            </motion.div>
          )}

          {state.status === "loading" && <LoadingAnimation key="loading" />}

          {state.status === "error" && (
            <motion.p
              key="error"
              role="alert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400"
            >
              {state.message}
            </motion.p>
          )}

          {state.status === "success" && (
            <motion.ul
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pb-24"
            >
              {/* Provisoire : remplacé par les RecommendationCard en phase 4. */}
              {state.recommendations.map((r) => (
                <li key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-display text-lg font-semibold">
                    {r.title} <span className="text-gray-500">({r.year})</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-400">{r.reason}</p>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function LoadingAnimation() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1)),
      2500,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 py-4"
    >
      <div className="flex items-center gap-3">
        <motion.span
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="size-5 text-blue-500" />
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-gray-300"
          >
            {LOADING_MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-blue-600"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -6, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
