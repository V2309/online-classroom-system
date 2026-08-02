// lib/chatService.ts

import axios from "axios";



// ==================

//  API Config

// ==================

const API_BASE_URL = "http://localhost:8000";



// 'api' instance này CHỈ dùng nội bộ trong file này

const api = axios.create({

  baseURL: API_BASE_URL,

  headers: { "Content-Type": "application/json" },

});



// ==================

//  Type Definitions

// ==================

export interface UploadResponse {

  session_id: string;

}



export interface SendMessageResponse {

  response: string;

  is_quiz: boolean;

}



export interface PodcastResponse {

  success: boolean;

  dialogue?: string;

  audio_url?: string;

  message?: string;

}



export interface SessionInfo {

  session_id: string;

  created_at: string;

  files: string[];

}



export interface ChatMessageItem {

  role: "user" | "assistant";

  content: string;

  isQuiz?: boolean;

}



// ==================

//  API Functions

// (Tất cả hàm này đều được export và an toàn để import)

// ==================



export const uploadDocuments = async (files: File[]): Promise<UploadResponse> => {

  const formData = new FormData();

  files.forEach((file) => {

    formData.append("files", file);

  });



  const response = await api.post<UploadResponse>("/upload-documents", formData, {

    headers: { "Content-Type": "multipart/form-data" },

  });



  return response.data;

};



export const sendMessage = async (

  message: string,

  sessionId: string

): Promise<SendMessageResponse> => {

  const response = await api.post<SendMessageResponse>("/chat", {

    message,

    session_id: sessionId,

  });

  return response.data;

};



export const getSessionInfo = async (sessionId: string): Promise<SessionInfo> => {

  const response = await api.get<SessionInfo>(`/session/${sessionId}/info`);

  return response.data;

};



export const getChatHistory = async (sessionId: string): Promise<ChatMessageItem[]> => {

  const response = await api.get<ChatMessageItem[]>(`/session/${sessionId}/history`);

  return response.data;

};



export const generatePodcast = async (sessionId: string): Promise<PodcastResponse> => {

  const response = await api.post<PodcastResponse>("/generate-podcast", {

    session_id: sessionId,

  });

  return response.data;

};



// Lưu ý: ĐÃ XÓA 'export default api;'