# 🎓 UniAI Backend API

> An intelligent AI-powered study assistant backend built with FastAPI, LangChain, and Google Gemini — designed to help students learn smarter through document analysis, quiz extraction, essay generation, and podcast creation.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

**UniAI Backend** is the server-side component of the UniAI learning platform. It exposes a RESTful API that enables:

- Uploading PDF documents and creating intelligent AI agents that can answer questions about the content using **Retrieval-Augmented Generation (RAG)**.
- Extracting multiple-choice quiz questions from uploaded `.pdf` and `.docx` files.
- Generating open-ended essay questions either from an uploaded document or from a given topic.
- Creating an audio podcast dialogue from a PDF's content using Google Gemini (script generation) and OpenAI TTS (text-to-speech).

The backend manages stateful chat sessions in memory, allowing multi-turn conversations with full chat history tracking.

---

## Features

### 🤖 AI Chat Agent (RAG-based)
- Upload one or more PDF documents to create a dedicated session.
- A **LangChain Agent** is created per session, powered by **Google Gemini 2.5 Flash**.
- Uses a **Hybrid Retriever** combining:
  - **FAISS** vector store with **OpenAI `text-embedding-3-small`** embeddings (semantic search).
  - **BM25** retriever for keyword-based search.
  - **MMR (Maximal Marginal Relevance)** to ensure answer diversity.
- The agent has access to two tools:
  1. `document_search` — Searches uploaded documents first (highest priority).
  2. `web_search` — Falls back to Tavily web search if no relevant document content is found.
- Full conversation history is stored per session.

### 📝 Quiz Extraction
- Upload a `.pdf` or `.docx` file containing Vietnamese multiple-choice questions (`Câu 1`, `Câu 2`, etc.).
- Extracts question text, answer options (A–D), and highlighted/marked correct answers.
- PDF extraction uses **PyMuPDF (fitz)** with support for embedded drawings/images rendered as inline Base64 images.
- DOCX extraction uses **python-docx** with a multi-strategy parser (multi-line and single-line formats).
- Returns structured JSON with all questions.

### 🔀 Quiz Shuffling
- Shuffle question order and/or answer option order.
- The `correct_answer_index` and `correct_answer_char` are automatically updated to reflect the new ordering.

### ⬇️ Quiz Download
- Download the extracted/shuffled quiz as a **Word (.docx)** or **PDF** file.
- Includes a formatted answer key table.

### ✍️ Essay Question Generation
- Generate open-ended academic questions using **Google Gemini 2.5 Flash**.
- Two modes:
  - **RAG Mode** (`session_id`): Questions are grounded in the content of previously uploaded PDF documents.
  - **Topic Mode** (`topic`): Questions are generated from general AI knowledge on any subject.
- Includes suggested model answers for each question.
- Robust JSON extraction and repair logic handles truncated or malformed LLM outputs, with up to 3 automatic retries.

### 🎙️ Podcast Generator
- Converts PDF content into a natural conversational podcast script between two personas:
  - **Person A (Host)**: Asks insightful questions.
  - **Person B (Expert)**: Provides in-depth explanations.
- Uses **Google Gemini** to generate the dialogue script.
- Converts each dialogue line to speech using **OpenAI TTS (`tts-1-hd`)**.
  - Person A voice: `echo` (warm male voice).
  - Person B voice: `nova` (clear female voice).
- Merges all audio segments using **pydub** with natural pauses between speakers.
- Audio is served as an MP3 file via a dedicated endpoint.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FastAPI Application                │
│                      (index.py)                      │
├───────────────┬─────────────────┬────────────────────┤
│  Chat / RAG   │  Quiz Module    │  Podcast Module    │
│  ─────────    │  ───────────    │  ──────────────    │
│  agent_core   │  PDF Extractor  │  podcast_generator │
│  (LangChain   │  DOCX Extractor │  (Gemini script +  │
│   Agent)      │  Shuffle/DL     │   OpenAI TTS)      │
└───────┬───────┴────────┬────────┴──────────┬─────────┘
        │                │                   │
        ▼                ▼                   ▼
  Google Gemini     PyMuPDF /          Google Gemini +
  OpenAI Embed.     python-docx        OpenAI TTS
  FAISS + BM25      ReportLab
  Tavily Search
```

### Session Management

Sessions are stored **in-memory** as a Python dictionary keyed by a UUID. Each session holds:
- The compiled `AgentExecutor` instance.
- The raw text chunks (used for podcast and essay generation).
- The full `chat_history` as LangChain `HumanMessage`/`AIMessage` objects.
- A list of processed filenames.

> ⚠️ Sessions are not persisted across server restarts.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Web Framework** | [FastAPI](https://fastapi.tiangolo.com/) |
| **LLM Orchestration** | [LangChain](https://www.langchain.com/) |
| **Primary LLM** | Google Gemini 2.5 Flash (`langchain-google-genai`) |
| **Embeddings** | OpenAI `text-embedding-3-small` |
| **Vector Store** | FAISS (via `langchain-community`) |
| **Keyword Search** | BM25 Retriever |
| **Web Search** | Tavily Search API |
| **PDF Parsing** | PyMuPDF (`fitz`), pdfminer, pdfplumber |
| **DOCX Parsing** | python-docx |
| **PDF Generation** | ReportLab |
| **TTS** | OpenAI TTS (`tts-1-hd`) |
| **Audio Processing** | pydub + FFmpeg |
| **Script Generation** | Google Gemini (`google-generativeai`) |
| **ASGI Server** | Uvicorn |
| **Deployment** | Vercel (Python Serverless) |

---

## Project Structure

```
backend/
├── index.py              # Main FastAPI application; all API routes, request/response models,
│                         # PDF/DOCX extraction logic, and session management
├── agent_core.py         # LangChain agent setup: document loading, text splitting,
│                         # FAISS vector store, hybrid retriever, agent executor,
│                         # and essay question generation logic
├── podcast_generator.py  # PodcastGenerator class: Gemini dialogue creation + OpenAI TTS
├── prompt_template.py    # All LLM prompt templates (agent system prompt,
│                         # RAG essay prompt, topic essay prompt)
├── requirements.txt      # Full Python dependency list (pinned versions)
├── vercel.json           # Vercel deployment configuration
├── .env                  # Environment variables (NOT committed to version control)
└── uploads/              # Temporary directory for quiz file uploads (auto-created)
```

---

## API Endpoints

### Core

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — confirms the API is running |
| `GET` | `/api/health` | Secondary health check for the quiz API |

### Document Chat (RAG)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-documents` | Upload PDF files, process them, and create a chat session |
| `POST` | `/chat` | Send a chat message to the AI agent within an existing session |
| `GET` | `/session/{session_id}/info` | Get session metadata (processed files, chat count, agent status) |
| `GET` | `/session/{session_id}/history` | Retrieve the full chat history for a session |
| `GET` | `/sessions` | List all active session IDs (debugging) |

### Podcast

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate-podcast` | Generate a podcast dialogue and audio from an existing session's PDF content |
| `GET` | `/audio/{filename}` | Stream / download the generated MP3 audio file |

### Quiz

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/extract-quiz` | Upload a `.pdf` or `.docx` file and extract structured quiz questions |
| `POST` | `/api/shuffle-quiz` | Shuffle question order and/or answer options in a quiz dataset |
| `POST` | `/api/download-quiz` | Download a quiz as a formatted `.pdf` or `.docx` file |

### Essay Generation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-essay-questions` | Generate essay questions from an uploaded document (RAG) or a topic |

---

## Getting Started

### Prerequisites

- Python **3.10+**
- **FFmpeg** installed and available on your system PATH (required for pydub audio merging)
- API keys for: Google AI (Gemini), OpenAI, and Tavily Search

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd backend
```

### 2. Create and Activate a Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below).

### 5. Run the Development Server

```bash
uvicorn index:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

Interactive API documentation (Swagger UI) is available at `http://localhost:8000/docs`.

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ===============================
# AI APIs (Required)
# ===============================

# Primary Google API Key (Gemini LLM + Embeddings)
GOOGLE_API_KEY=your_google_api_key_here

# Backup Google API Key (used automatically if primary is missing)
GOOGLE_API_KEY_BACKUP=your_backup_google_api_key_here

# OpenAI API Key (Embeddings + TTS)
OPENAI_API_KEY=your_openai_api_key_here

# Tavily Search API Key (Web search fallback for the agent)
TAVILY_API_KEY=your_tavily_api_key_here

# ===============================
# Email Configuration (Optional)
# ===============================
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# ===============================
# App Configuration (Optional)
# ===============================
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000
VECTOR_STORE_PATH=./vector_stores
LOG_LEVEL=INFO
```

> 🔒 **Never commit your `.env` file to version control.** Add it to `.gitignore`.

### API Key Sources

| Key | Where to Get It |
|---|---|
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `TAVILY_API_KEY` | [Tavily AI](https://app.tavily.com/) |

---

## Deployment

This project is configured for deployment on **Vercel** using the Python serverless runtime.

### `vercel.json`

```json
{
  "builds": [
    {
      "src": "index.py",
      "use": "@vercel/python",
      "config": { "includeFiles": "*.py" }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.py"
    }
  ]
}
```

All routes are forwarded to `index.py` (the FastAPI application). Environment variables must be configured in the Vercel project settings dashboard.

### CORS Configuration

The API currently allows CORS from the following origins (configurable in `index.py`):
- `http://localhost:3000` (Next.js / React default)
- `http://localhost:5173` (Vite default)

Update the `allow_origins` list in the `CORSMiddleware` configuration to add your production frontend domain.

---

## Notes & Limitations

- **In-memory sessions**: All session data (agent, chat history, document chunks) is stored in RAM. Sessions are lost on server restart. For production, consider using Redis or a database.
- **Document chunk limit**: PDF content is truncated to **10,000 characters** for podcast generation and **12,000 characters** for essay generation to avoid token limits.
- **Supported file types for Quiz Extraction**: `.pdf` and `.docx` only.
- **Supported file types for Chat**: `.pdf` only.
- **FFmpeg dependency**: The `podcast_generator.py` file hard-codes a local FFmpeg path for Windows development. Update the `PATH` configuration if running on a different OS or installation path.
- **Vietnamese language**: The quiz parser, agent prompts, and podcast generator are primarily optimized for Vietnamese-language documents.
