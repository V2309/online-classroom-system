import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, MessageCircle, Send, Loader2, BookOpen, Brain, Mic } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { uploadDocuments, sendMessage, generatePodcast } from "@/lib/chatService";
import ChatMessage from "./ChatMessage";

type Role = "user" | "assistant";

interface ChatItem {
  role: Role;
  content: string;
  isQuiz: boolean;
}

interface UploadResponse {
  session_id: string;
}

interface SendMessageResponse {
  response: string;
  is_quiz: boolean;
}

interface PodcastData {
  success: boolean;
  dialogue?: string;
  audio_url?: string;
  message?: string;
}

const UniAI: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState<boolean>(false);
  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onDrop = async (acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter((file) => file.type === "application/pdf");

    if (pdfFiles.length === 0) {
      alert("Vui lòng chọn file PDF!");
      return;
    }

    setIsUploading(true);
    try {
      const response = (await uploadDocuments(pdfFiles)) as UploadResponse;
      setSessionId(response.session_id);
      setUploadedFiles(pdfFiles.map((f) => f.name));

      // Add welcome message
      setMessages([
        {
          role: "assistant",
          content:
            "Chào bạn, mình là UniAI! Mình đã sẵn sàng để giúp bạn học tập với tài liệu vừa rồi. Hãy hỏi mình bất cứ điều gì nhé.",
          isQuiz: false,
        },
      ]);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Lỗi upload tài liệu: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage: ChatItem = {
      role: "user",
      content: inputMessage,
      isQuiz: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = (await sendMessage(userMessage.content, sessionId)) as SendMessageResponse;

      const aiMessage: ChatItem = {
        role: "assistant",
        content: response.response,
        isQuiz: response.is_quiz,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("[ERROR] Send message error:", error);
      const errorMessage: ChatItem = {
        role: "assistant",
        content: "Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn.",
        isQuiz: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePodcast = async () => {
    if (!sessionId) {
      alert("Vui lòng upload tài liệu trước!");
      return;
    }

    setIsGeneratingPodcast(true);
    try {
      const response = (await generatePodcast(sessionId)) as PodcastData;

      if (response.success) {
        setPodcastData(response);
        alert("Tạo podcast thành công! Bạn có thể nghe ở phần bên dưới.");
      } else {
        alert("Lỗi tạo podcast: " + (response.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error generating podcast:", error);
      alert("Lỗi khi tạo podcast: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  return (
    <div className="">
      {/* Header
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">UniAI</h1>
            </div>
            <span className="text-gray-500">Trợ lý học tập thông minh</span>
          </div>
        </div>
      </header> */}

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-background text-foreground">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar (Upload + Hướng dẫn + Podcast) */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
              {/* Document Upload */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Nạp Tri Thức
                </h2>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                    ${isDragActive ? "border-primary bg-accent/40" : "border-border hover:border-primary"}
                    ${isUploading ? "pointer-events-none opacity-50" : ""}
                  `}
                >
                  <input {...getInputProps()} />

                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                      <p className="text-sm text-secondary">Đang xử lý...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-secondary">
                        {isDragActive ? "Thả file PDF vào đây" : "Kéo thả hoặc click để chọn PDF"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-foreground mb-2">Files đã tải:</h3>
                    <div className="space-y-1">
                      {uploadedFiles.map((fileName, index) => (
                        <div key={index} className="flex items-center text-sm text-secondary">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          <span className="truncate">{fileName}</span>
                        </div>
                      ))}
                    </div>

                    {/* Podcast Generator Button */}
                    <div className="mt-4">
                      <button
                        onClick={handleGeneratePodcast}
                        disabled={isGeneratingPodcast}
                        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
                      >
                        {isGeneratingPodcast ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Đang tạo podcast...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            <span>🎙️ Tạo Podcast</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Podcast Result */}
              {podcastData && podcastData.success && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">🎙️ Podcast</h3>
                  <div className="space-y-3">
                    {podcastData.dialogue && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Nội dung hội thoại:</h4>
                        <div className="bg-muted p-3 rounded-lg text-xs text-foreground max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{podcastData.dialogue}</pre>
                        </div>
                      </div>
                    )}
                    {podcastData.audio_url && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Audio:</h4>
                        <audio controls className="w-full">
                          <source src={`${process.env.NEXT_PUBLIC_FLASK_API_URL}${podcastData.audio_url}`} type="audio/mpeg" />
                          Trình duyệt không hỗ trợ audio.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Guide */}
              {sessionId && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">💡 Hướng dẫn sử dụng</h3>
                  <div className="space-y-3 text-sm text-secondary">
                    <div>
                      <h4 className="font-medium text-foreground">🧠 Hỏi đáp:</h4>
                      <p>• Hỏi trực tiếp về khái niệm, định nghĩa</p>
                      <p>• Yêu cầu giải thích chi tiết</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-xl border border-border shadow-sm h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center space-x-2 p-4 border-b border-border bg-muted/40 rounded-t-xl">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Trợ lý học tập thông minh</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!sessionId && (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">Vui lòng tải lên tài liệu để bắt đầu!</p>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div key={index} className="animate-fade-in">
                    <ChatMessage message={message} />
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl p-3 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-secondary">UniAI đang suy nghĩ...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {sessionId && (
                <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-card rounded-b-xl">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Hỏi về giáo trình, tạo quiz, hoặc bất cứ điều gì..."
                      className="flex-1 border border-input bg-background text-foreground rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      <span>Gửi</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniAI;
