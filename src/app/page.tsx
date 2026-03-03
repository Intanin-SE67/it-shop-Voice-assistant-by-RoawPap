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
  const [status, setStatus] = useState("พร้อมพูด");
  const [result, setResult] = useState<ApiResult>({});
  const [inputText, setInputText] = useState(""); //การพิมพ์

  const recognitionRef = useRef<any>(null);
  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "th-TH"; 
    utter.rate = 1; 
    utter.pitch = 1;

    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utter);
  }
  function stopvoice() {
    window.speechSynthesis.cancel();
  }
  async function sendText(text: string) {
    if (!text.trim()) return;

    setStatus("กำลังส่งไปถามระบบ...");
    setResult({ transcript: text });

    const resp = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data: ApiResult = await resp.json();
    setResult(data);
    setStatus(data.error ? "เกิดข้อผิดพลาด" : "เสร็จสิ้น");

    if (data.answer) {
      speak(data.answer);
    }
  }

  // --------- เกี่ยวกับการพิมพ์ -------------------------------
  useEffect(() => {
    // รองรับ Chrome: webkitSpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("เบราว์เซอร์นี้ไม่รองรับ Web Speech API (แนะนำ Chrome เท่านั้น)");
      return;
    }
  // -------------------------------------------------------
    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false; // เอาเฉพาะผลสุดท้าย
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatus("กำลังฟัง... พูดคำถามได้เลย");
    };

    rec.onend = () => {
      setIsListening(false);
      setStatus("หยุดฟังแล้ว");
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`เกิดข้อผิดพลาด: ${e?.error || "unknown"}`);
      setResult({ error: e?.error || "speech error" });
    };
//---------- แก้ไข ---------------
    rec.onresult = async (event: any) => {
  const transcript = event.results?.[0]?.[0]?.transcript || "";
  await sendText(transcript);
}; // -----------------------------------------------
    recognitionRef.current = rec;
  }, []);

  function start() {
    setResult({});
    try {
      recognitionRef.current?.start();
    } catch {
      // บางครั้ง start ซ้ำเร็วเกิน จะ throw
    }
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return (
    <div className="bg-img">
      <div className="ml-44 mr-44 bg-current/50 invert shadow-lg">
        <main className="min-h-screen p-6 max-w-3xl mx-auto invert">
        <h1 className="text-2xl font-bold">Board games Shop Voice Q&A EE (Web Speech)</h1>
        <p className="text-sm opacity-80 mt-2">
          กดเริ่มแล้วพูด เช่น “มี UNO Classic ไหม ราคาเท่าไหร่”
        </p>

        <div className="mt-6 flex gap-3">
          {!isListening ? (
            <button className="px-4 py-2 rounded bg-black text-white" onClick={() => {  stopvoice(); start(); }}>
              เริ่มพูด
            </button>
          ) : (
            <button className="px-4 py-2 rounded bg-red-600 text-black" onClick={stop}>
              หยุด
            </button>
          )}
          <div className="px-3 py-2 rounded border text-sm">{status}</div>
          <button className="px-4 py-2 rounded bg-black text-white" onClick={stopvoice}>
            หยุดเสียง
          </button>
        </div>
          
        <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="พิมพ์คำถาม เช่น มี UNO ไหม"
              className="flex-1 px-3 py-2 rounded border text-black"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  stopvoice();
                  sendText(inputText);
                  setInputText("");
                }
              }}
            />
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white"
              onClick={() => {
                stopvoice();
                sendText(inputText);
                setInputText("");
              }}
            >
              ส่ง
            </button>
          </div>
          

        <section className="mt-8 space-y-4">
          <div className="p-4 rounded border">
            <div className="font-semibold">ข้อความที่ถอดเสียง</div>
            <div className="mt-2 text-sm">{result.transcript ?? "-"}</div>
          </div>

          <div className="p-4 rounded border">
            <div className="font-semibold">คำตอบ</div>
            <div className="mt-2 text-sm">{result.answer ?? "-"}</div>
            {result.error && <div className="mt-2 text-sm text-red-600">{result.error}</div>}
          </div>
          
          {result.matches && result.matches.length > 0 && <div className="p-4 rounded border">
                <div className="font-semibold mb-3">สินค้าที่พบ</div>
                <div className="grid grid-cols-2 gap-4"> {result.matches.map((item: any, index: number) => 
                    <div key={index} className="border rounded p-3 text-center bg-white text-black">
                      <img src={item.images} alt={item.name} className="w-full h-40 object-contain mb-2"/>
                      <div className="font-medium">
                        {item.name}
                      </div>
                      <div className="text-sm">
                        ราคา {item.price} บาท
                      </div>
                    </div>
                  )}
                </div>
              </div>}
        </section>
      </main>
      </div>
    </div>

  );
}
