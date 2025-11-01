"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SVGProps } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Howl } from "howler";

type SeroResult = {
  score: number;
  verdict: string;
  roast: string;
  advice: string;
  confidence: string;
};

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "checksero_theme";
const SAMPLE_INPUTS = [
  'เพื่อนมันโพสต์ว่า "ปีนี้ต้องรวย" ทั้งที่เป็นหนี้บัตรเครดิตอยู่ ผมจะจวกยังไงดี',
  "เจอคนเปิดเพลงดังใน MRT แล้วทำหน้ามั่นหน้ามั่นใจ ควรตอบกลับแบบไหนให้หน้าหงาย",
  "คนในทีมชอบขโมยเครดิตงานคนอื่น ใส่เสียดายังไงไม่ให้โดนฟ้อง",
  "มีคนแซะว่าผมยังใช้มือถือรุ่นเก่าอยู่ จัดหนักให้หน่อยจะได้หายกร่าง",
] as const;

type ScoreTierConfig = {
  label: string;
  description: string;
  badge: {
    light: string;
    dark: string;
  };
  bar: {
    light: string;
    dark: string;
  };
};

const SCORE_TIERS: Array<{ min: number; config: ScoreTierConfig }> = [
  {
    min: 85,
    config: {
      label: "ไฟลุกทั้งซอย",
      description:
        "ระดับความเสร่อพุ่งเกินร้อย แบบนี้ต้องจับหัวกดฝาท่อแล้วเผายับซ้ำอีกที",
      badge: {
        light: "border-rose-200 bg-rose-100/80 text-rose-600",
        dark: "border-rose-500/50 bg-rose-500/20 text-rose-200",
      },
      bar: {
        light: "from-rose-400 via-amber-400 to-yellow-300",
        dark: "from-rose-400 via-amber-300 to-yellow-200",
      },
    },
  },
  {
    min: 60,
    config: {
      label: "เกรียนไฟลุก",
      description:
        "ดีกรีเสร่อถึงขั้นเป็นไวรัลได้ ฮาให้สุดแล้วฝากด่าให้ยับอย่าให้เหลือซาก",
      badge: {
        light: "border-amber-200 bg-amber-100/80 text-amber-600",
        dark: "border-amber-500/40 bg-amber-500/15 text-amber-200",
      },
      bar: {
        light: "from-amber-400 via-orange-300 to-lime-200",
        dark: "from-amber-300 via-orange-300 to-lime-200",
      },
    },
  },
  {
    min: 35,
    config: {
      label: "เริ่มแสบคัน",
      description:
        "ยังไม่ถึงขั้นไฟลุก แต่ก็ชวนเคลือบแผลด้วยลวดหนาม สวนกลับเบาๆ ก็จุกแล้ว",
      badge: {
        light: "border-sky-200 bg-sky-100/80 text-sky-600",
        dark: "border-sky-500/40 bg-sky-500/15 text-sky-200",
      },
      bar: {
        light: "from-sky-400 via-cyan-300 to-emerald-200",
        dark: "from-sky-300 via-cyan-300 to-emerald-200",
      },
    },
  },
  {
    min: 0,
    config: {
      label: "พอขำๆ",
      description:
        "ยังเสร่อไม่สุด แค่คันปากนิดหน่อย ตบสลับข้างให้พอมีสีสันในวงสนทนา",
      badge: {
        light: "border-slate-200 bg-slate-100/80 text-slate-600",
        dark: "border-slate-600/50 bg-slate-800/40 text-slate-200",
      },
      bar: {
        light: "from-slate-300 via-slate-200 to-slate-100",
        dark: "from-slate-500 via-slate-600 to-slate-700",
      },
    },
  },
];

const getScoreTier = (score: number): ScoreTierConfig => {
  for (const tier of SCORE_TIERS) {
    if (score >= tier.min) {
      return tier.config;
    }
  }
  return SCORE_TIERS[SCORE_TIERS.length - 1]!.config;
};

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<SeroResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [sound, setSound] = useState<Howl | null>(null);
  const [sound2, setSound2] = useState<Howl | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const resultSectionRef = useRef<HTMLDivElement | null>(null);
  const themeSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(mode === "dark" ? "theme-dark" : "theme-light");
    document.documentElement.style.colorScheme = mode;
    document.documentElement.setAttribute("data-theme", mode);
  }, []);

  useEffect(() => {
    const primaryFx = new Howl({
      src: ["/ระเบิด.mp3"],
      volume: 1,
      loop: false,
    });

    const secondaryFx = new Howl({
      src: ["/จารแดง.mp3"],
      volume: 1,
      loop: false,
    });

    setSound(primaryFx);
    setSound2(secondaryFx);

    return () => {
      primaryFx.unload();
      secondaryFx.unload();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const initialTheme: ThemeMode =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : prefersDark.matches
        ? "dark"
        : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setIsThemeReady(true);
  }, [applyTheme]);

  useEffect(() => {
    if (!isThemeReady) {
      return;
    }

    applyTheme(theme);

    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [applyTheme, theme, isThemeReady]);

  useEffect(() => {
    if (!isTransitioning) {
      return;
    }

    const timeout = setTimeout(() => setIsTransitioning(false), 900);
    return () => clearTimeout(timeout);
  }, [isTransitioning]);

  useEffect(() => {
    return () => {
      if (themeSwitchTimer.current) {
        clearTimeout(themeSwitchTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!result || isLoading) {
      return;
    }

    const timeout = window.setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [result, isLoading]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    if (themeSwitchTimer.current) {
      clearTimeout(themeSwitchTimer.current);
    }
    themeSwitchTimer.current = setTimeout(() => {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }, 80);
  };

  const handleSamplePrompt = (sample: string) => {
    setInputText(sample);
    setResult(null);
    setErrorMessage(null);
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.setSelectionRange(sample.length, sample.length);
    }, 60);
  };

  const checkSero = async () => {
    if (!inputText.trim()) {
      setResult(null);
      setErrorMessage("พิมพ์ข้อความมาก่อน แล้วค่อยให้ AI ช่วยวิเคราะห์นะ");
      return;
    }

    setIsShaking(true);
    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);

    if (sound) {
      sound.stop();
      sound.play();
      sound2?.stop();
      sound2?.play();
    }

    try {
      const res = await fetch("/api/check-sero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        setErrorMessage(
          data?.error ?? "API มีปัญหาชั่วคราว ลองใหม่อีกครั้งนะ",
        );
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("มีปัญหาในการเชื่อมต่อกับ API ลองใหม่อีกครั้งนะ");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsShaking(false);
      }, 900);
    }
  };

  const isDark = theme === "dark";

  const panelSurface = isDark
    ? "bg-slate-900/70 border-slate-700/60 shadow-[0_30px_90px_-60px_rgba(8,10,20,0.9)]"
    : "bg-white/60 border-slate-200/70 shadow-[0_40px_110px_-70px_rgba(15,23,42,0.35)]";

  const resultSurface = isDark
    ? "bg-slate-950/85 border-slate-800/60 shadow-[0_45px_140px_-80px_rgba(70,90,150,0.45)]"
    : "bg-slate-50/70 border-slate-200/70 shadow-[0_45px_130px_-80px_rgba(148,163,184,0.4)]";

  const badgeSurface = isDark
    ? "border-slate-700/60 bg-slate-800/60 text-slate-200"
    : "border-slate-200/70 bg-white/70 text-slate-600";

  const accentText = isDark ? "text-slate-300" : "text-slate-600";
  const subtleText = isDark ? "text-slate-400" : "text-slate-500";

  const stepBadge = isDark
    ? "bg-slate-800/70 text-slate-200"
    : "bg-slate-200/60 text-slate-600";

  const buttonClasses = isDark
    ? "bg-gradient-to-r from-indigo-400/80 via-sky-400/70 to-emerald-300/60 text-slate-900"
    : "bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-700/85 text-slate-100";

  const loadingSurface = isDark
    ? "border-slate-600/60 bg-slate-800/40 text-slate-200"
    : "border-slate-200 bg-white/70 text-slate-600";

  const errorSurface = isDark
    ? "border-rose-400/35 bg-rose-400/10 text-rose-200"
    : "border-rose-200/70 bg-rose-100/60 text-rose-600";

  const verdictSurface = isDark
    ? "border-slate-700/60 bg-slate-900/60"
    : "border-slate-200 bg-white/75";

  const roastSurface = isDark
    ? "border-rose-400/30 bg-rose-400/10"
    : "border-rose-200/70 bg-rose-100/55";

  const adviceSurface = isDark
    ? "border-emerald-400/30 bg-emerald-400/10"
    : "border-emerald-200/70 bg-emerald-100/55";

  const progressTrackClass = isDark
    ? "bg-slate-800/70"
    : "bg-slate-200/80";

  const scoreTier = result ? getScoreTier(result.score) : null;
  const tierBadgeClass = scoreTier
    ? isDark
      ? scoreTier.badge.dark
      : scoreTier.badge.light
    : "";
  const tierBarGradient = scoreTier
    ? isDark
      ? scoreTier.bar.dark
      : scoreTier.bar.light
    : "";

  const sampleChipBase = isDark
    ? "border-slate-700/60 bg-slate-900/45 text-slate-200 hover:border-slate-500 hover:bg-slate-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
    : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-400/80 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500";

  const normalizedScore = result ? Math.min(Math.max(result.score, 0), 100) : 0;

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center overflow-hidden px-4 transition-colors duration-500 ${isDark ? "text-slate-100" : "text-slate-900"} ${isShaking ? "animate-shake" : ""}`}
    >
      <div className={`theme-transition ${isTransitioning ? "active" : ""}`} />

      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 left-12 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: isDark
              ? "radial-gradient(circle at 30% 30%, rgba(88,110,198,0.42), transparent 70%)"
              : "radial-gradient(circle at 30% 30%, rgba(180,199,230,0.55), transparent 65%)",
            transition: "background 0.9s ease",
          }}
        />
        <div
          className="absolute bottom-[-120px] right-[-40px] h-96 w-96 rounded-full blur-3xl"
          style={{
            background: isDark
              ? "radial-gradient(circle at 70% 60%, rgba(80,130,210,0.28), transparent 60%)"
              : "radial-gradient(circle at 70% 60%, rgba(200,210,230,0.45), transparent 60%)",
            transition: "background 0.9s ease",
          }}
        />
        <div
          className="absolute inset-y-1/4 left-1/2 hidden h-80 w-80 -translate-x-1/2 rounded-full blur-[120px] md:block"
          style={{
            background: isDark
              ? "radial-gradient(circle at 50% 50%, rgba(96,154,195,0.25), transparent 70%)"
              : "radial-gradient(circle at 50% 50%, rgba(208,219,238,0.5), transparent 70%)",
            transition: "background 0.9s ease",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <nav className="flex w-full flex-col gap-4 px-2 pt-10 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <div className="flex flex-col gap-2">
            <span className={`text-xs uppercase tracking-[0.45em] ${subtleText}`}>
              CheckSero Lab
            </span>
            <p className="text-lg font-semibold md:text-xl">
              AI วิเคราะห์ความเสร่อแบบถึงใจ เปิด 24 ชั่วโมง
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-medium transition backdrop-blur-sm sm:self-auto ${isDark ? "border-slate-700/60 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900/70" : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white/80"}`}
          >
            {isDark ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
            <span>{isDark ? "โหมดสว่าง" : "โหมดมืด"}</span>
          </button>
        </nav>

        <main className="mt-16 grid w-full gap-10 pb-20 md:grid-cols-[1.1fr_1fr]">
          <section className="space-y-6">
            <span
              className={`inline-flex items-center rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] transition-colors duration-500 ${badgeSurface}`}
            >
              Roast Mode
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              ให้ AI จวกความเสร่อแทนคุณแบบถึงพริกถึงขิง
            </h1>
            <p className={`text-base leading-relaxed ${accentText}`}>
              ส่งข้อความที่คิดว่าเสร่อมาเหอะ เดี๋ยวระบบนี้จัดการด่าให้
              พร้อมสกอร์และคำแนะนำแบบกวนๆ เอาไปขยี้ต่อได้เลย
            </p>
            <ul className={`space-y-3 text-sm leading-relaxed ${accentText}`}>
              <li className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-500 ${stepBadge}`}
                >
                  1
                </span>
                <span>
                  โยนข้อความสุดจะเสร่อมาให้ AI ด่าแทนแบบมีตรรกะ ไม่หลุดโฟกัส
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-500 ${stepBadge}`}
                >
                  2
                </span>
                <span>
                  รับคะแนน ความมั่นใจ พร้อมคำวินิจฉัยสุดแสบกับคำแนะนำแก้เกม
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-500 ${stepBadge}`}
                >
                  3
                </span>
                <span>
                  บันทึกโหมดที่ชอบได้ จะหม่นหรือสว่าง ระบบก็ซัดแรงไม่เปลี่ยน
                </span>
              </li>
            </ul>
            <div className="pt-4">
              <p className={`text-[11px] uppercase tracking-[0.35em] ${subtleText}`}>
                กดลองตัวอย่างก็ได้
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {SAMPLE_INPUTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleSamplePrompt(sample)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-xs font-medium leading-relaxed transition ${sampleChipBase}`}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-500 ${panelSurface}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
            <div className="relative flex h-full flex-col gap-6 p-8">
              <div className="flex items-center justify-between">
                <span className={`text-xs uppercase tracking-[0.5em] ${subtleText}`}>
                  Input
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.4em] transition-colors duration-500 ${badgeSurface}`}
                >
                  {theme === "dark" ? "Dark AF" : "Bright AF"}
                </span>
              </div>
              <TextareaAutosize
                ref={textAreaRef}
                minRows={5}
                maxRows={14}
                className={`min-h-[180px] w-full resize-none rounded-2xl border border-transparent px-5 py-4 text-base leading-relaxed shadow-inner transition focus:outline-none focus:ring-2 ${isDark ? "bg-slate-950/60 text-slate-100 placeholder:text-slate-500 focus:ring-slate-500/50" : "bg-white/80 text-slate-900 placeholder:text-slate-500 focus:ring-slate-400/40"}`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="โยนข้อความที่คิดว่าเสร่อมาเลย เดี๋ยว AI ด่าให้ยับ..."
              />
              <button
                type="button"
                onClick={checkSero}
                disabled={isLoading}
                className={`group relative inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition ${buttonClasses} shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {isLoading ? "กำลังจวกให้แสบ..." : "จ้วงเช็คแม่งเลย"}
                <span className="ml-3 h-2 w-2 rounded-full bg-white transition-all duration-300 group-hover:w-3" />
              </button>
              {isLoading && (
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${loadingSurface}`}
                >
                  <span className="inline-flex h-6 w-6 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
                  <span>กำลังวิเคราะห์อยู่ ใจเย็นๆ เดี๋ยวจัดให้</span>
                </div>
              )}
              {errorMessage && !isLoading && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${errorSurface}`}
                >
                  {errorMessage}
                </div>
              )}
            </div>
          </section>
        </main>

        {result && !isLoading && (
          <section
            ref={resultSectionRef}
            className={`relative mb-16 w-full rounded-[32px] border p-8 backdrop-blur-xl transition-all duration-500 md:p-10 ${resultSurface}`}
          >
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={`text-xs uppercase tracking-[0.5em] ${subtleText}`}>
                  ผลวินิจฉัย
                </p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                  AI สรุปให้แบบตรงๆ ไม่มียั้ง
                </h2>
              </div>
              <span
                className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] transition-colors duration-500 ${badgeSurface}`}
              >
                ความมั่นใจ {result.confidence}
              </span>
            </header>

            <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div
                className={`rounded-3xl border px-6 py-8 text-center shadow-inner transition-all duration-500 ${isDark ? "border-slate-700/50 bg-slate-900/50" : "border-slate-200 bg-white/70"}`}
              >
                <p className="text-xs uppercase tracking-[0.6em] text-slate-400">
                  Sero Score
                </p>
                <p
                  className={`mt-4 text-6xl font-black ${isDark ? "text-amber-300" : "text-amber-400"}`}
                >
                  {result.score}
                </p>
                <p className={`mt-2 text-sm ${accentText}`}>
                  คะแนนความเสร่อ ยิ่งสูงยิ่งน่าหัวเราะ
                </p>
                {scoreTier && (
                  <>
                    <span
                      className={`mt-4 inline-flex items-center justify-center rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] ${tierBadgeClass}`}
                    >
                      {scoreTier.label}
                    </span>
                    <p className={`mt-3 text-xs leading-relaxed ${accentText}`}>
                      {scoreTier.description}
                    </p>
                    <div
                      className={`mt-6 h-2.5 w-full overflow-hidden rounded-full transition-colors duration-500 ${progressTrackClass}`}
                    >
                      <div
                        className={`h-full bg-gradient-to-r transition-all duration-700 ease-out ${tierBarGradient}`}
                        style={{ width: `${normalizedScore}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-5">
                <div className={`rounded-3xl border p-6 transition-all duration-500 ${verdictSurface}`}>
                  <p className="text-xs uppercase tracking-[0.5em] text-fuchsia-400">
                    Verdict
                  </p>
                  <p className="mt-3 whitespace-pre-line text-base font-semibold leading-relaxed">
                    {result.verdict}
                  </p>
                </div>
                <div className={`rounded-3xl border p-6 transition-all duration-500 ${roastSurface}`}>
                  <p className="text-xs uppercase tracking-[0.5em] text-rose-400">
                    Roast
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                    {result.roast}
                  </p>
                </div>
                <div className={`rounded-3xl border p-6 transition-all duration-500 ${adviceSurface}`}>
                  <p className="text-xs uppercase tracking-[0.5em] text-emerald-400">
                    Advice
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                    {result.advice}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className={`mb-10 text-center text-xs ${accentText}`}>
          <p>ทำขำๆ อยากเช็กความเสร่อก็จัดไป วสุโชค ใจน้ำ</p>
        </footer>
      </div>
    </div>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx={12} cy={12} r={4} />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.65 17.65 1.42 1.42" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.35 17.65-1.42 1.42" />
      <path d="m19.07 4.93-1.42 1.42" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 12.79A9 9 0 0 1 11.21 3a7 7 0 1 0 9.79 9.79z" />
    </svg>
  );
}
