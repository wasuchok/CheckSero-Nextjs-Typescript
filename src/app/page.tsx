"use client"

import { useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Howl } from 'howler';

type SeroResult = {
  score: number;
  verdict: string;
  roast: string;
  advice: string;
  confidence: string;
};

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<SeroResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [sound, setSound] = useState<Howl | null>(null);
  const [sound2, setSound2] = useState<Howl | null>(null);

  useEffect(() => {
    const newSound = new Howl({
      src: ['/ระเบิด.mp3'],
      volume: 1,
      loop: false,
    });

    const newSound2 = new Howl({
      src: ['/จารแดง.mp3'],
      volume: 1,
      loop: false,
    });

    setSound(newSound);
    setSound2(newSound2);
  }, []);

  const checkSero = async () => {
    if (!inputText.trim()) {
      setErrorMessage('พิมพ์ข้อความก่อนดิ แล้วค่อยให้ฉันวิเคราะห์');
      return;
    }

    setIsShaking(true);
    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);

    if (sound) {
      sound.play();
      sound2?.play();
    }

    try {
      const res = await fetch('/api/check-sero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        setErrorMessage(data?.error ?? 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
        return;
      }

      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับ API');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsShaking(false);
      }, 1000);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-100 text-slate-800 px-4 ${
        isShaking ? 'animate-shake' : ''
      }`}
    >
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 drop-shadow-sm">เช็คความเสร่อ</h1>
        <p className="text-sm text-slate-600 mt-2">กรอกข้อความเพื่อเช็คความเสร่อจาก AI</p>
      </header>

      <main className="relative w-full max-w-2xl">
        <div className="absolute inset-0 -z-10 bg-white/80 backdrop-blur rounded-3xl shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)]"></div>
        <div className="relative bg-white/90 rounded-3xl border border-white/60 p-8">
          <TextareaAutosize
            minRows={5}
            maxRows={16}
            className="w-full p-4 text-lg border border-amber-200/70 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400/50 mb-6 bg-amber-50/70 text-slate-900 placeholder:text-slate-400 leading-relaxed"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ป้อนข้อความของคุณที่นี่..."
          />
          <button
            onClick={checkSero}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 text-white font-semibold shadow-lg shadow-amber-200/60 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-pink-200"
          >
            เช็คความเสร่อ
          </button>

          {isLoading && (
            <div className="mt-6 text-center text-slate-700">
              <div
                className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-solid border-pink-400 border-t-transparent rounded-full"
                role="status"
              >
                <span className="sr-only">Loading...</span>
              </div>
              <p>กำลังประมวลผล...</p>
            </div>
          )}

          {errorMessage && !isLoading && (
            <div className="mt-6 p-4 bg-rose-100 border border-rose-200 rounded-xl text-rose-700">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}

          {result && !isLoading && (
            <div className="mt-6 p-6 bg-gradient-to-br from-sky-50 via-white to-rose-100 rounded-3xl space-y-5 border border-white/70 shadow-[0_18px_40px_-25px_rgba(244,114,182,0.8)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900">ผลลัพธ์</p>
                <span className="px-3 py-1 text-xs sm:text-sm rounded-full bg-sky-100 text-sky-600 border border-sky-200 font-medium">
                  ความมั่นใจ: {result.confidence}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <p className="text-4xl font-black text-pink-500 drop-shadow-sm">{result.score}/100</p>
                  <span className="text-sm text-slate-500">คะแนนความเสร่อโดยประมาณ</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-wide text-sky-500">Verdict</p>
                  <p className="text-base font-semibold text-slate-800 whitespace-pre-line leading-relaxed">
                    {result.verdict}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-wide text-pink-500">Roast</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-7">
                    {result.roast}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-wide text-emerald-500">Advice</p>
                  <p className="text-sm text-emerald-700 whitespace-pre-line leading-7">
                    {result.advice}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>ระบบนี้ทำความบันเทิงเท่านั้น วสุโชค ใจน้ำ</p>
      </footer>
    </div>
  );
}
