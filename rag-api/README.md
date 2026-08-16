<div align="center">
  <br />
  <h1>🤖 Online Classroom — AI / RAG Service</h1>
  <br />

  <div>
    <img src="https://img.shields.io/badge/-Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
    <img src="https://img.shields.io/badge/-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/-LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" />
    <img src="https://img.shields.io/badge/-OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" />
    <img src="https://img.shields.io/badge/-Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
    <img src="https://img.shields.io/badge/-FAISS-00A67E?style=for-the-badge&logo=meta&logoColor=white" />
    <img src="https://img.shields.io/badge/-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  </div>

  <h3 align="center">Online Classroom System — FastAPI RAG & AI Service</h3>

  <div align="center">
    An intelligent AI-powered study assistant built with FastAPI, LangChain, and Google Gemini —
    enabling document-based Q&A, automatic quiz extraction, essay generation, and podcast creation.
  </div>
</div>

---

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🏗️ [Architecture](#architecture)
5. 🗂️ [Project Structure](#project-structure)
6. 🤸 [Quick Start](#quick-start)
7. 🌐 [API Overview](#api-overview)
8. 📌 [Environment Variables](#environment-variables)
9. 🚀 [Deployment](#deployment)
10. 📝 [Notes & Limitations](#notes--limitations)

---

## <a name="introduction">✨ Introduction</a>

**RAG API** is the AI brain of the Online Classroom System. It exposes a RESTful API that enables:

- Uploading PDF documents and creating intelligent AI agents that can answer questions based on the content using **Retrieval-Augmented Generation (RAG)**.
- Extracting structured multiple-choice quiz questions from `.pdf` and `.docx` files.
- Generating open-ended essay questions either from uploaded documents or from any given topic.
- Creating an audio podcast dialogue from a PDF's content using **Google Gemini** (script) and **OpenAI TTS** (speech).

The service manages stateful chat sessions in memory, supporting multi-turn conversations with full chat history tracking. It is consumed internally by the **NestJS backend** via the AI Gateway module.

---

## <a name="tech-stack">⚙️ Tech Stack</a>

| Technology | Purpose |
|---|---|
| **[FastAPI](https://fastapi.tiangolo.com/)** | High-performance Python async web framework |
| **[Uvicorn](https://www.uvicorn.org/)** | ASGI server — runs the FastAPI application |
| **[LangChain](https://www.langchain.com/)** | LLM orchestration, agent creation, and chain building |
| **[Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/)** | Primary LLM — chat Q&A, essay generation, podcast scripting |
| **[OpenAI `text-embedding-3-small`](https://platform.openai.com/docs/guides/embeddings)** | Dense vector embeddings for semantic search |
| **[OpenAI TTS (`tts-1-hd`)](https://platform.openai.com/docs/guides/text-to-speech)** | Text-to-speech for podcast audio generation |
| **[FAISS](https://faiss.ai/)** | Local vector store for fast similarity search |
| **[rank-bm25](https://github.com/dorianbrown/rank_bm25)** | BM25 keyword-based retriever |
| **[Tavily Search](https://tavily.com/)** | Web search fallback when documents lack relevant content |
| **[PyMuPDF (fitz)](https://pymupdf.readthedocs.io/)** | PDF parsing with inline image support |
| **[python-docx](https://python-docx.readthedocs.io/)** | Word document (.docx) parsing |
| **[ReportLab](https://www.reportlab.com/)** | Generate downloadable PDF quiz files |
| **[pydub](https://github.com/jiaaro/pydub)** | Merge audio segments with pauses for podcast |
| **[Pydantic](https://docs.pydantic.dev/)** | Request/response model validation |
| **[python-dotenv](https://github.com/theskumar/python-dotenv)** | Load environment variables from `.env` |

---

## <a name="features">🔋 Features</a>

🤖 **AI Chat Agent — RAG-based (`/upload-documents`, `/chat`)**
Upload one or more PDF files to create a dedicated chat session. A **LangChain Agent** is initialized per session, powered by **Google Gemini 2.5 Flash**. Uses a **Hybrid Retriever** combining FAISS (semantic search) + BM25 (keyword search) + MMR (result diversity). The agent has two tools: `document_search` (searches uploaded docs first) and `web_search` (Tavily fallback). Full conversation history is tracked per session.

📝 **Quiz Extraction (`/api/extract-quiz`)**
Upload a `.pdf` or `.docx` file containing Vietnamese multiple-choice questions. Extracts question text, answer options (A–D), and highlighted correct answers. Returns structured JSON. PDF extraction uses PyMuPDF with embedded image support; DOCX uses python-docx with multi-strategy parsing.

🔀 **Quiz Shuffling (`/api/shuffle-quiz`)**
Shuffle question order and/or answer option order. The `correct_answer_index` and `correct_answer_char` fields are automatically recalculated to match the new ordering.

⬇️ **Quiz Download (`/api/download-quiz`)**
Download the extracted or shuffled quiz as a formatted **Word (.docx)** or **PDF** file, complete with an answer key table.

✍️ **Essay Question Generation (`/api/generate-essay-questions`)**
Generate academic open-ended questions via Google Gemini with two modes:
- **RAG Mode** (`session_id`): Questions grounded in previously uploaded document content.
- **Topic Mode** (`topic`): Questions generated from AI general knowledge on any subject.
Includes suggested model answers. Robust JSON repair logic handles truncated LLM outputs with up to 3 automatic retries.

🎙️ **Podcast Generator (`/generate-podcast`)**
Converts PDF content into a natural conversational podcast between two personas:
- **Person A (Host)**: Asks insightful questions — voice: OpenAI `echo`.
- **Person B (Expert)**: Provides in-depth explanations — voice: OpenAI `nova`.
Gemini generates the dialogue script; OpenAI TTS converts each line to speech; pydub merges all segments with natural pauses.

---

## <a name="architecture">🏗️ Architecture</a>

```
┌──────────────────────────────────────────────────────────┐
│                   FastAPI Application                    │
│                       (index.py)                         │
├──────────────────┬───────────────────┬───────────────────┤
│   Chat / RAG     │   Quiz Module     │  Podcast Module   │
│  ─────────────   │  ─────────────    │  ─────────────    │
│  IngestPipeline  │  extract_pdf_data │ PodcastGenerator  │
│  QAPipeline      │  extract_docx_data│ (Gemini script +  │
│  (LangChain      │  shuffle/download │  OpenAI TTS)      │
│   Agent)         │                   │                   │
└────────┬─────────┴──────────┬────────┴─────────┬─────────┘
         │                    │                  │
         ▼                    ▼                  ▼
   Google Gemini         PyMuPDF /         Google Gemini +
   OpenAI Embed.         python-docx       OpenAI TTS
   FAISS + BM25          ReportLab         pydub
   Tavily Search
```

### Session Management

Sessions are stored **in-memory** as a Python dictionary keyed by a UUID. Each session holds:
- The compiled `AgentExecutor` instance (LangChain agent).
- The raw text chunks (used for podcast and essay generation).
- The full `chat_history` as `HumanMessage`/`AIMessage` objects.
- A list of processed filenames.

> ⚠️ Sessions are **not persisted** across server restarts. For production, consider Redis or a database-backed session store.

---

## <a name="project-structure">🗂️ Project Structure</a>

```
rag-api/
├── index.py                  # FastAPI entry point — all routes, session management, Pydantic models
├── agent_core.py             # LangChain agent setup (legacy): document loading, FAISS, hybrid retriever
├── podcast_generator.py      # PodcastGenerator: Gemini dialogue + OpenAI TTS + pydub merge
├── prompt_template.py        # All LLM prompt templates (agent system, RAG essay, topic essay)
├── config.py                 # RAG configuration (chunk_size, top_k, similarity thresholds)
├── requirements.txt          # Python dependencies
├── vercel.json               # Vercel serverless deployment config
├── .env                      # Environment variables (not committed)
│
├── pipelines/                # High-level pipeline orchestration
│   ├── ingest_pipeline.py    # Raw file → chunk → embed → FAISS index
│   └── qa_pipeline.py        # Question → hybrid search → rerank → Gemini answer
│
├── ingestion/                # Pre-retrieval: document loading & preparation
│   ├── loaders.py            # Load PDF, Word, URL content
│   ├── cleaners.py           # Strip noise, HTML tags, extra whitespace
│   └── chunkers.py           # Recursive & semantic text chunking
│
├── indexing/                 # Embedding & vector store
│   ├── embeddings.py         # OpenAI embedding model configuration
│   └── vector_store.py       # FAISS vector store interface
│
├── retrieval/                # Advanced retrieval strategies
│   ├── query_router.py       # Route questions to the correct data source
│   ├── query_transform.py    # Query expansion, HyDE, sub-question decomposition
│   └── search_engine.py      # Hybrid search (FAISS vector + BM25 keyword)
│
├── post_processing/          # Post-retrieval processing
│   ├── reranker.py           # Cross-encoder reranking of retrieved chunks
│   └── context_compress.py   # Filter noise and compress context window
│
├── generation/               # LLM response generation
│   ├── llm_factory.py        # Initialize and manage LLM instances (GPT, Gemini)
│   ├── prompts.py            # Prompt templates (system, few-shot)
│   └── output_parsers.py     # Force structured JSON output from LLM
│
├── quiz/                     # Quiz extraction, shuffling, and download
│   └── __init__.py           # extract_pdf_data, extract_docx_data, shuffle, download
│
└── uploads/                  # Temporary upload directory (auto-created at runtime)
```

---

## <a name="quick-start">🤸 Quick Start</a>

### Prerequisites

- **Python** 3.10 or higher
- **FFmpeg** installed and available on PATH (required by pydub for audio merging)
- API keys for: **Google AI (Gemini)**, **OpenAI**, and **Tavily Search**

### Installation

**1. Navigate to the rag-api directory**

```bash
cd online-classroom-system/rag-api
```

**2. Create and activate a virtual environment**

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

```bash
cp .env.example .env
```

Fill in your API keys (see [Environment Variables](#environment-variables) below).

**5. Start the development server**

```bash
uvicorn index:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at **`http://localhost:8000`**.

Swagger UI (interactive docs): **`http://localhost:8000/docs`**

### Useful Scripts

| Command | Description |
|---|---|
| `uvicorn index:app --reload --port 8000` | Start development server with hot-reload |
| `uvicorn index:app --port 8000` | Start production server |
| `pip install -r requirements.txt` | Install all dependencies |
| `pip freeze > requirements.txt` | Update requirements after adding packages |

---

## <a name="api-overview">🌐 API Overview</a>

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API health check |
| `GET` | `/api/health` | Secondary health check |

### Document Chat (RAG)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-documents` | Upload PDFs, process and create a chat session |
| `POST` | `/chat` | Send a message to the AI agent within a session |
| `GET` | `/session/{session_id}/info` | Get session metadata (files, message count, status) |
| `GET` | `/session/{session_id}/history` | Retrieve full chat history for a session |
| `GET` | `/sessions` | List all active session IDs |

### Quiz

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/extract-quiz` | Upload `.pdf` or `.docx` and extract quiz questions |
| `POST` | `/api/shuffle-quiz` | Shuffle question and/or answer option order |
| `POST` | `/api/download-quiz` | Download quiz as formatted `.pdf` or `.docx` |

### Essay Generation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-essay-questions` | Generate essay questions from document (RAG) or topic |

### Podcast

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate-podcast` | Generate podcast audio from an existing session's content |
| `GET` | `/audio/{filename}` | Stream or download the generated MP3 audio file |

---

## <a name="environment-variables">📌 Environment Variables</a>

Create a `.env` file in the `rag-api/` directory (copy from `.env.example`):

```env
# ── AI APIs (Required) ────────────────────────────────────────
# Google Gemini — LLM for Q&A, essay generation, podcast scripting
GOOGLE_API_KEY=your_google_api_key_here

# Backup Google API Key (auto-used if primary is empty)
GOOGLE_API_KEY_BACKUP=your_backup_google_api_key_here

# OpenAI — Embeddings (text-embedding-3-small) + TTS (tts-1-hd)
OPENAI_API_KEY=your_openai_api_key_here

# Tavily — Web search fallback for the AI agent
TAVILY_API_KEY=your_tavily_api_key_here

# ── App Configuration (Optional) ─────────────────────────────
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
```

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | Google AI Studio key for Gemini LLM |
| `GOOGLE_API_KEY_BACKUP` | ⚠️ Optional | Fallback key if primary is missing |
| `OPENAI_API_KEY` | ✅ | OpenAI key for embeddings and TTS |
| `TAVILY_API_KEY` | ✅ | Tavily key for web search fallback |
| `DEBUG` | ⚠️ Optional | Enable debug mode (default: `True`) |
| `API_HOST` | ⚠️ Optional | Server bind address (default: `0.0.0.0`) |
| `API_PORT` | ⚠️ Optional | Server port (default: `8000`) |
| `LOG_LEVEL` | ⚠️ Optional | Logging verbosity (default: `INFO`) |

### Where to Get API Keys

| Key | Source |
|---|---|
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `TAVILY_API_KEY` | [Tavily AI](https://app.tavily.com/) |

> 🔒 **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

---

## <a name="deployment">🚀 Deployment</a>

This service is configured for **Vercel** Python serverless deployment via `vercel.json`:

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
    { "src": "/(.*)", "dest": "index.py" }
  ]
}
```

All requests are forwarded to `index.py`. Set environment variables in the Vercel project settings dashboard.

**CORS Origins** (configurable in `index.py`):
- `http://localhost:3000` — Next.js frontend
- `http://localhost:8080` — NestJS backend
- Update `allow_origins` to include your production domain.

---

## <a name="notes--limitations">📝 Notes & Limitations</a>

- **In-memory sessions**: All session data (agent, chat history, document chunks) is stored in RAM and lost on server restart. For production, use Redis or a persistent database.
- **Document chunk limit**: PDF content is truncated to **10,000 characters** for podcast and **12,000 characters** for essay generation to avoid LLM token limits.
- **Supported file types for Quiz**: `.pdf` and `.docx` only.
- **Supported file types for Chat**: `.pdf` only.
- **FFmpeg dependency**: Required by pydub for audio segment merging. Must be installed and on PATH.
- **Language**: Quiz parser, agent prompts, and podcast generator are primarily optimized for **Vietnamese-language** documents.
- **Retry logic**: Essay generation includes up to 3 automatic retries with JSON repair for handling truncated or malformed LLM outputs.

---

<div align="center">
  <p>Built with ❤️ using FastAPI & LangChain</p>
</div>
