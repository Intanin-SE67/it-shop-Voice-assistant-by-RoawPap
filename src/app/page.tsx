"use client";

import { useEffect, useRef, useState } from "react";

type ApiResult = {
  transcript?: string;
  answer?: string;
  matches?: Array<any>;
  error?: string;
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("เตรียมพร้อม...");
  const [result, setResult] = useState<ApiResult>({});

  const recognitionRef = useRef<any>(null);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "th-TH";
    utter.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function stopvoice() {
    window.speechSynthesis.cancel();
  }

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("เบราว์เซอร์ไม่รองรับ Web Speech API");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatus("กำลังฟังเสียงของคุณ...");
    };

    rec.onend = () => {
      setIsListening(false);
      setStatus("รอรับคำสั่งต่อไป...");
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`เกิดข้อผิดพลาด: ${e?.error}`);
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setStatus("กำลังวิเคราะห์คำถาม...");
      setResult({ transcript });

      try {
        const resp = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript }),
        });
        const data: ApiResult = await resp.json();
        setResult(data);
        setStatus(data.error ? "เกิดข้อผิดพลาด" : "ค้นหาเสร็จสิ้น");
        if (data.answer) speak(data.answer);
      } catch (err) {
        setStatus("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      }
    };

    recognitionRef.current = rec;
  }, []);

  const handleStart = () => {
    stopvoice();
    setResult({});
    try {
      recognitionRef.current?.start();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header Section */}
      <header className="bg-indigo-700 text-white py-12 px-6 text-center shadow-lg">
        <h1 className="text-4xl font-extrabold tracking-tight">
          🎲 Board Game <span className="text-yellow-400">Voice Assistant</span>
        </h1>
        <p className="mt-3 text-indigo-100 text-lg">
          สอบถามข้อมูลสินค้าด้วยเสียงได้ทันที
        </p>
      </header>

      <main className="max-w-4xl mx-auto -mt-8 px-4 pb-20">
        {/* Control Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-slate-200">
          <div className="flex flex-col items-center gap-6">
            
            {/* Visual Listening Indicator */}
            <div className="relative">
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
              )}
              <button
                onClick={isListening ? () => recognitionRef.current?.stop() : handleStart}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isListening ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                } text-white`}
              >
                {isListening ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-center">
              <div className={`text-sm font-medium px-4 py-1 rounded-full mb-2 ${isListening ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {status}
              </div>
              <p className="text-slate-500 text-sm italic">ลองพูดว่า: "มีเกมเศรษฐีไหม?" หรือ "แนะนำบอร์ดเกมงบ 500 หน่อย"</p>
            </div>

            <div className="flex gap-2">
               <button onClick={stopvoice} className="text-xs text-slate-400 hover:text-slate-600 underline">
                หยุดเสียง AI
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Transcript & Answer */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">เสียงที่คุณพูด</h3>
              <p className="text-slate-800 leading-relaxed">{result.transcript || "..."}</p>
            </div>
            
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">AI ตอบกลับ</h3>
              <p className="text-indigo-900 font-medium leading-relaxed">{result.answer || "รอฟังคำถามของคุณ..."}</p>
              {result.error && <p className="text-red-500 text-xs mt-2 italic">{result.error}</p>}
            </div>
          </div>

          {/* Product Matches */}
          <div className="md:col-span-2">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[200px]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                สินค้าที่เกี่ยวข้อง ({result.matches?.length || 0})
              </h3>
              
              {result.matches && result.matches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.matches.map((item: any, index: number) => (
                    <div key={index} className="group flex flex-col border border-slate-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-slate-50 p-4 overflow-hidden">
                        <img 
                          src={item.images} 
                          alt={item.name} 
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 bg-white border-t border-slate-50">
                        <div className="font-bold text-slate-800 text-sm truncate">{item.name}</div>
                        <div className="text-indigo-600 font-semibold mt-1">
                          ฿{item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm italic">ยังไม่มีข้อมูลสินค้าแสดง</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
