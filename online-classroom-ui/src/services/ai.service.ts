import { api } from "@/lib/api";

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  session_id: string;
}

export interface ChatMessageResponse {
  response: string;
  is_quiz: boolean;
}

export interface PodcastResponse {
  success: boolean;
  dialogue?: string;
  audio_url?: string;
  message?: string;
}

export interface EssayQuestionItem {
  question_number: number;
  question_text: string;
  sample_answer?: string;
  rubric?: string;
}

export interface EssayGenerationResponse {
  success: boolean;
  questions: EssayQuestionItem[];
  message?: string;
}

export interface QuizExtractionResponse {
  success: boolean;
  filename: string;
  quiz_data: any[];
  total_questions: number;
  error?: string;
}

export interface QuizShuffleResponse {
  success: boolean;
  quiz_data: any[];
  total_questions: number;
}

export const aiService = {
  // ─── Upload PDF Documents for RAG session ─────────────────────────────────
  async uploadDocuments(files: File[]): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await api.post<UploadDocumentResponse>(
      "/ai/upload-documents",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      }
    );
    return response.data;
  },

  // ─── Send message to AI in session ────────────────────────────────────────
  async sendMessage(message: string, sessionId: string): Promise<ChatMessageResponse> {
    const response = await api.post<ChatMessageResponse>(
      "/ai/chat",
      {
        session_id: sessionId,
        message,
      },
      { timeout: 120000 }
    );
    return response.data;
  },

  // ─── Generate Podcast from session ────────────────────────────────────────
  async generatePodcast(sessionId: string): Promise<PodcastResponse> {
    const response = await api.post<PodcastResponse>(
      "/ai/generate-podcast",
      {
        session_id: sessionId,
      },
      { timeout: 180000 }
    );
    return response.data;
  },

  // ─── Get audio URL for podcast playback ───────────────────────────────────
  getAudioUrl(audioUrl: string): string {
    if (!audioUrl) return "";
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      return audioUrl;
    }
    // Base API URL ví dụ: http://localhost:8080/api
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
    if (audioUrl.startsWith("/api/")) {
      const serverOrigin = apiBase.replace(/\/api$/, "");
      return `${serverOrigin}${audioUrl}`;
    }
    if (audioUrl.startsWith("/audio/")) {
      return `${apiBase}/ai${audioUrl}`;
    }
    return `${apiBase}/ai/audio/${audioUrl}`;
  },

  // ─── Generate Essay Questions (from PDF session or topic) ─────────────────
  async generateEssayQuestions(data: {
    session_id?: string;
    topic?: string;
    num_questions: number;
  }): Promise<EssayGenerationResponse> {
    const response = await api.post<EssayGenerationResponse>(
      "/ai/generate-essay-questions",
      data,
      { timeout: 180000 }
    );
    return response.data;
  },

  // ─── Extract Quiz from PDF or DOCX file ───────────────────────────────────
  async extractQuiz(file: File): Promise<QuizExtractionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<QuizExtractionResponse>(
      "/ai/extract-quiz",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      }
    );
    return response.data;
  },

  // ─── Shuffle Quiz Questions & Answers ─────────────────────────────────────
  async shuffleQuiz(data: {
    quiz_data: any[];
    shuffle_questions?: boolean;
    shuffle_answers?: boolean;
  }): Promise<QuizShuffleResponse> {
    const response = await api.post<QuizShuffleResponse>(
      "/ai/shuffle-quiz",
      data,
      { timeout: 60000 }
    );
    return response.data;
  },

  // ─── Download Quiz (PDF or DOCX) ──────────────────────────────────────────
  async downloadQuiz(data: {
    quiz_data: any[];
    format: "pdf" | "docx";
    filename?: string;
  }): Promise<Blob> {
    const response = await api.post("/ai/download-quiz", data, {
      responseType: "blob",
      timeout: 120000,
    });
    return response.data;
  },

  // ─── Get Session Info ─────────────────────────────────────────────────────
  async getSessionInfo(sessionId: string): Promise<any> {
    const response = await api.get(`/ai/session/${sessionId}/info`);
    return response.data;
  },

  // ─── Get Session Chat History ─────────────────────────────────────────────
  async getSessionHistory(sessionId: string): Promise<any> {
    const response = await api.get(`/ai/session/${sessionId}/history`);
    return response.data;
  },
};
