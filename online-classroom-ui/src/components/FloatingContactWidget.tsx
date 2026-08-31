"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Check,
  Copy,
  ChevronUp,
  Headphones,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

interface FloatingContactWidgetProps {
  phoneNumber?: string;
  zaloUrl?: string;
  messengerUrl?: string;
}

export default function FloatingContactWidget({
  phoneNumber = "0795720147 ",
  zaloUrl = "https://zalo.me/0795720147",
  messengerUrl = "https://m.me/docus.education",
}: FloatingContactWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "bot" | "user"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "Xin chào! 👋 DoCus có thể hỗ trợ gì cho bạn về lớp học trực tuyến hoặc các gói dịch vụ hôm nay?",
      time: "Vừa xong",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    "Tư vấn tạo lớp học & tính năng",
    "Báo giá gói Pro & School",
    "Hướng dẫn tích hợp Stream Video",
  ];

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNumber.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { sender: "user", text, time: now }]);
    if (!textToSend) setInputMessage("");

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let reply = "Cảm ơn bạn đã quan tâm! Chuyên viên tư vấn DoCus sẽ phản hồi ngay qua hotline hoặc bạn có thể chat nhanh qua Zalo/Messenger.";
      if (text.includes("giá") || text.includes("Báo giá") || text.includes("gói")) {
        reply = "DoCus hiện có gói Starter miễn phí, gói Pro (199k/tháng) và gói School cho trường học. Bạn có muốn nhận demo chi tiết không?";
      } else if (text.includes("lớp") || text.includes("tính năng")) {
        reply = "DoCus hỗ trợ phòng học trực tuyến HD, bảng trắng cộng tác, giao bài tập tự động chấm và lưu trữ tài liệu không giới hạn!";
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: reply,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 800);
  };

  return (
    <aside aria-label="Kênh liên hệ nhanh" className="fixed bottom-5 right-5 z-50 flex items-end gap-2 select-none">
      {/* ── MINI CHAT BOX POPUP (SITS TIGHTLY BESIDE THE BUTTONS) ── */}
      {isChatOpen && (
        <div className="w-[320px] sm:w-[350px] h-[470px] max-h-[82vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                  <Headphones className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-primary rounded-full animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Tư vấn viên DoCus
                  <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full font-normal">Online</span>
                </h4>
                <p className="text-[11px] text-white/80">Thường phản hồi trong vài phút</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 scrollbar-thin text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none shadow-sm"
                      : "bg-card text-foreground border border-border rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 bg-card border border-border rounded-2xl w-fit text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-2 bg-card border-t border-border flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap px-2.5 py-1 bg-muted hover:bg-primary/10 hover:text-primary text-[11px] font-medium text-foreground rounded-full border border-border/80 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message input */}
          <div className="p-3 bg-card border-t border-border flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-muted/60 border border-border text-foreground px-3.5 py-2 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary-hover transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── RIGHT COLUMN: SPEED DIAL BUTTONS & TOGGLE ── */}
      <div className="flex flex-col items-end gap-3">
        {/* EXPANDED ACTION BUTTONS */}
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-8 pointer-events-none scale-90"
          }`}
        >
          {/* 1. HOTLINE / PHONE CALL BUTTON */}
          <div className="group relative flex items-center justify-end">
            {!isChatOpen && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-card border border-border shadow-lg px-3 py-1.5 rounded-full text-xs font-semibold text-foreground flex items-center gap-2 whitespace-nowrap pointer-events-none group-hover:pointer-events-auto">
                <span>Hotline: {phoneNumber}</span>
                <button
                  onClick={handleCopyPhone}
                  title="Sao chép số"
                  className="hover:text-primary transition-colors p-0.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            <a
              href={`tel:${phoneNumber.replace(/\s/g, "")}`}
              aria-label="Gọi hotline hỗ trợ"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all relative group"
            >
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25" />
              <Phone className="w-5 h-5 animate-pulse" />
            </a>
          </div>

          {/* 2. ZALO BUTTON */}
          <div className="group relative flex items-center justify-end">
            {!isChatOpen && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-card border border-border shadow-lg px-3 py-1.5 rounded-full text-xs font-semibold text-foreground whitespace-nowrap pointer-events-none">
                <span>Chat Zalo</span>
              </div>
            )}
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nhắn tin qua Zalo"
              className="w-12 h-12 rounded-full bg-[#0068FF] text-white flex items-center justify-center shadow-lg hover:shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all relative"
            >
              {/* Zalo Custom SVG Icon */}
              <svg className="w-6 h-6 fill-current" viewBox="0 0 48 48">
                <path d="M24 4C12.95 4 4 12.51 4 23.01c0 5.4 2.37 10.28 6.22 13.78L8.14 43.1c-.24.71.46 1.36 1.13 1.05l7.53-3.47c2.26.63 4.67.97 7.2.97 11.05 0 20-8.51 20-19.01S35.05 4 24 4z" />
                <text
                  x="24"
                  y="28"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="900"
                  fill="#0068FF"
                  fontFamily="sans-serif"
                >
                  Zalo
                </text>
              </svg>
            </a>
          </div>

          {/* 3. MESSENGER BUTTON */}
          <div className="group relative flex items-center justify-end">
            {!isChatOpen && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-card border border-border shadow-lg px-3 py-1.5 rounded-full text-xs font-semibold text-foreground whitespace-nowrap pointer-events-none">
                <span>Facebook Messenger</span>
              </div>
            )}
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nhắn tin qua Facebook Messenger"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0084FF] via-[#A033FF] to-[#FF5E3A] text-white flex items-center justify-center shadow-lg hover:shadow-purple-500/30 hover:scale-110 active:scale-95 transition-all"
            >
              {/* Messenger Custom SVG Icon */}
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.912 1.453 5.518 3.727 7.222V22l3.39-1.86c.924.256 1.898.395 2.883.395 5.523 0 10-4.145 10-9.277C22 6.145 17.523 2 12 2zm1.066 12.48l-2.73-2.912-5.328 2.912 5.86-6.223 2.797 2.912 5.261-2.912-5.86 6.223z" />
              </svg>
            </a>
          </div>

          {/* 4. LIVE CHAT / MINI CHAT BUBBLE BUTTON */}
          <div className="group relative flex items-center justify-end">
            {!isChatOpen && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-card border border-border shadow-lg px-3 py-1.5 rounded-full text-xs font-semibold text-foreground whitespace-nowrap pointer-events-none">
                <span>Hỗ trợ trực tuyến</span>
              </div>
            )}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              aria-label="Mở khung chat trực tuyến"
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>

      {/* ── MAIN TOGGLE BUTTON ── */}
      <button
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            setIsChatOpen(false);
          } else {
            setIsOpen(true);
          }
        }}
        aria-label={isOpen ? "Thu gọn kênh liên hệ" : "Mở các kênh liên hệ"}
        className="group relative w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/20"
      >
        <div className="relative">
          {isOpen ? (
            <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
          ) : (
            <div className="relative">
              <Headphones className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
            </div>
          )}
        </div>
        
        {/* Tooltip on toggle button when closed */}
        {!isOpen && (
          <span className="absolute right-16 bg-card border border-border shadow-lg px-3 py-1.5 rounded-full text-xs font-bold text-foreground whitespace-nowrap animate-bounce">
            Cần hỗ trợ? 💬
          </span>
        )}
      </button>
      </div>
    </aside>
  );
}
