"use client"

import { useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Howl } from 'howler';
export default function Home() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<any>(null);
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
    setSound2(newSound2)
  }, []);

  const checkSero = async () => {
    setIsShaking(true);
    setIsLoading(true);

    if (sound) {
      sound.play();
      sound2?.play()
    }

    try {
      const res = await fetch('/api/check-sero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult('เกิดข้อผิดพลาดในการเชื่อมต่อกับ API');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsShaking(false);
      }, 1000);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 px-4 ${isShaking ? 'animate-shake' : ''}`}>
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">เช็คความเสร่อ</h1>
        <p className="text-sm text-gray-400 mt-2">กรอกข้อความเพื่อเช็คความเสร่อจาก AI</p>
      </header>

      <main className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <TextareaAutosize
          minRows={4}
          maxRows={10}
          className="w-full p-4 text-lg border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6 bg-gray-900 text-white"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="ป้อนข้อความของคุณที่นี่..."
        />
        <button
          onClick={checkSero}
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          เช็คความเสร่อ
        </button>


        {isLoading && (
          <div className="mt-6 text-center text-white">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-solid border-blue-600 border-t-transparent rounded-full" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p>กำลังประมวลผล...</p>
          </div>
        )}


        {result && !isLoading && (
          <div className="mt-6 p-4 bg-gray-700 rounded-md">
            <p className="text-lg font-semibold text-white">ผลลัพธ์</p>
            <p className="text-md font-semibold text-gray-300">{result}</p>
          </div>
        )}
      </main>

      <footer className="mt-10 text-center text-sm text-gray-400">
        <p>ระบบนี้ทำความบันเทิงเท่านั้น วสุโชค ใจน้ำ</p>
      </footer>
    </div>
  );
}
