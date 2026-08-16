# index.py — UniAI Backend API
# Chỉ chứa: App setup + API routes + Session management.
# Logic nghiệp vụ nằm tại: pipelines/, quiz/, podcast_generator.py

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
import uuid
import io
import json
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# ── RAG pipeline ──────────────────────────────────────────────────────
from pipelines.ingest_pipeline import IngestPipeline
from pipelines.qa_pipeline import QAPipeline
from prompt_template import AGENT_SYSTEM_PROMPT

# ── Quiz module ───────────────────────────────────────────────────────
from quiz import (
    extract_pdf_data, extract_docx_data, allowed_file,
    shuffle_questions, shuffle_answers,
    download_quiz_docx, download_quiz_pdf,
)

# ── Podcast ───────────────────────────────────────────────────────────
from podcast_generator import PodcastGenerator
from langchain_core.messages import HumanMessage, AIMessage

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

load_dotenv()


def configure_google_api_key():
    primary_key = os.getenv("GOOGLE_API_KEY")
    backup_key = os.getenv("GOOGLE_API_KEY_BACKUP")
    if primary_key and primary_key.strip():
        print(f"[INFO] Using primary GOOGLE_API_KEY (***{primary_key[-4:]})")
    elif backup_key and backup_key.strip():
        print(f"[WARN] Using backup GOOGLE_API_KEY_BACKUP (***{backup_key[-4:]})")
        os.environ["GOOGLE_API_KEY"] = backup_key
    else:
        print("[CRITICAL] GOOGLE_API_KEY not found in .env!")


configure_google_api_key()

app = FastAPI(title="UniAI Backend API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory session store
sessions = {}

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    content: str
    role: str  # "user" hoặc "assistant"


class ChatRequest(BaseModel):
    message: str
    session_id: str


class ChatResponse(BaseModel):
    response: str
    is_quiz: bool = False


class DocumentUploadResponse(BaseModel):
    message: str
    session_id: str
    success: bool


class PodcastRequest(BaseModel):
    session_id: str


class PodcastResponse(BaseModel):
    success: bool
    dialogue: Optional[str] = None
    audio_url: Optional[str] = None
    message: str


class QuizExtractionResponse(BaseModel):
    success: bool
    filename: str
    quiz_data: List[dict]
    total_questions: int


class QuizShuffleRequest(BaseModel):
    quiz_data: List[dict]
    shuffle_questions: bool = False
    shuffle_answers: bool = False


class QuizShuffleResponse(BaseModel):
    success: bool
    quiz_data: List[dict]
    total_questions: int


class QuizDownloadRequest(BaseModel):
    quiz_data: List[dict]
    filename: str
    format: str  # 'pdf' or 'docx'


class EssayQuestionItem(BaseModel):
    question_number: int
    question_text: str
    suggested_answer: str


class EssayGenerationRequest(BaseModel):
    num_questions: int
    session_id: Optional[str] = None
    topic: Optional[str] = None


class EssayGenerationResponse(BaseModel):
    success: bool
    questions: List[EssayQuestionItem] = []
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Routes — Health
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "UniAI Backend API is running!", "version": "2.0.0"}


@app.get("/api/health")
async def quiz_health_check():
    return {"status": "ok", "message": "Quiz API is running"}


# ---------------------------------------------------------------------------
# Routes — Document Chat (RAG)
# ---------------------------------------------------------------------------

@app.post("/upload-documents", response_model=DocumentUploadResponse)
async def upload_documents(files: List[UploadFile] = File(...)):
    """Upload PDF files và khởi tạo RAG session."""
    temp_files = []
    try:
        session_id = str(uuid.uuid4())
        uploaded_files = []

        for file in files:
            if not file.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} không phải PDF")

            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            tmp.write(await file.read())
            tmp.close()
            temp_files.append(tmp.name)

            class MockFile:
                def __init__(self, name, path):
                    self.name = name
                    self.path = path
                def getbuffer(self):
                    with open(self.path, 'rb') as f:
                        return f.read()

            uploaded_files.append(MockFile(file.filename, tmp.name))

        # Ingest → Embed → Index
        ingest_result = IngestPipeline().run(uploaded_files)

        # Build RAG Pipeline
        qa_pipeline = QAPipeline(ingest_result=ingest_result, system_prompt=AGENT_SYSTEM_PROMPT)

        sessions[session_id] = {
            'qa_pipeline': qa_pipeline,
            'raw_text': ingest_result.raw_text,
            'text_chunks': ingest_result.chunks,
            'chat_history': [],
            'processed_files': [f.filename for f in files],
        }

        return DocumentUploadResponse(
            message=f"Đã xử lý thành công {len(files)} tài liệu",
            session_id=session_id,
            success=True,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý tài liệu: {str(e)}")
    finally:
        for path in temp_files:
            if os.path.exists(path):
                os.unlink(path)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Gửi tin nhắn đến AI trong session."""
    try:
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session không tồn tại. Vui lòng upload lại tài liệu.")

        session = sessions[request.session_id]
        qa_pipeline = session.get('qa_pipeline')
        chat_history = session.get('chat_history', [])

        chat_history.append(HumanMessage(content=request.message))

        try:
            if qa_pipeline:
                answer, _ = await qa_pipeline.answer(request.message, chat_history)
            else:
                agent_executor = session.get('agent_executor')
                response = agent_executor.invoke({
                    "input": request.message,
                    "chat_history": chat_history,
                })
                answer = response['output']
        except Exception as agent_error:
            print(f"[ERROR] Chat failed: {agent_error}")
            answer = f"Xin lỗi, có lỗi xảy ra: {str(agent_error)}. Vui lòng thử lại."
            return ChatResponse(response=answer, is_quiz=False)

        chat_history.append(AIMessage(content=answer))
        sessions[request.session_id]['chat_history'] = chat_history

        # Detect quiz JSON in response
        is_quiz = False
        try:
            stripped = answer.strip()
            if stripped.startswith('{') and stripped.endswith('}'):
                parsed = json.loads(answer)
                is_quiz = isinstance(parsed, dict) and 'questions' in parsed and 'quiz_title' in parsed
            else:
                quiz_keywords = ["quiz", "trắc nghiệm", "câu hỏi", "test", "kiểm tra"]
                is_quiz = any(kw in request.message.lower() for kw in quiz_keywords)
        except Exception:
            pass

        return ChatResponse(response=answer, is_quiz=is_quiz)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý chat: {str(e)}")


@app.get("/session/{session_id}/info")
async def get_session_info(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session không tồn tại")
    session = sessions[session_id]
    return {
        "session_id": session_id,
        "processed_files": session.get('processed_files', []),
        "chat_count": len(session.get('chat_history', [])),
        "agent_status": "active" if session.get('agent_executor') else "inactive",
    }


@app.get("/sessions")
async def list_sessions():
    return {"active_sessions": list(sessions.keys()), "session_count": len(sessions)}


@app.get("/session/{session_id}/history")
async def get_chat_history(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session không tồn tại")
    history = sessions[session_id].get('chat_history', [])
    return {
        "chat_history": [
            {"role": "user" if isinstance(m, HumanMessage) else "assistant", "content": m.content}
            for m in history
        ]
    }


# ---------------------------------------------------------------------------
# Routes — Podcast
# ---------------------------------------------------------------------------

@app.post("/generate-podcast", response_model=PodcastResponse)
async def generate_podcast(request: PodcastRequest):
    """Tạo podcast từ nội dung PDF đã upload."""
    try:
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session không tồn tại")

        session = sessions[request.session_id]

        # Ưu tiên raw_text, fallback về text_chunks
        pdf_content = session.get('raw_text', '')
        if not pdf_content:
            chunks = session.get('text_chunks', [])
            pdf_content = "\n\n".join(c.page_content for c in chunks)

        if not pdf_content:
            raise HTTPException(status_code=400, detail="Không có nội dung để tạo podcast")

        if len(pdf_content) > 10_000:
            pdf_content = pdf_content[:10_000] + "..."

        result = PodcastGenerator().generate_podcast(pdf_content)

        if result['success']:
            return PodcastResponse(
                success=True,
                dialogue=result['dialogue'],
                audio_url=f"/audio/{os.path.basename(result['audio_path'])}",
                message=result['message'],
            )
        return PodcastResponse(success=False, message=result['message'])

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        return PodcastResponse(success=False, message=f"Lỗi khi tạo podcast: {str(e)}")


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    audio_path = os.path.join(tempfile.gettempdir(), filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file không tìm thấy")
    return FileResponse(audio_path, media_type="audio/mpeg",
                        headers={"Content-Disposition": f"inline; filename={filename}"})


# ---------------------------------------------------------------------------
# Routes — Essay Generation
# ---------------------------------------------------------------------------

@app.post("/api/generate-essay-questions", response_model=EssayGenerationResponse)
async def generate_essay_questions_api(request: EssayGenerationRequest):
    """Tạo câu hỏi tự luận từ PDF session hoặc chủ đề."""
    try:
        if not request.session_id and not request.topic:
            raise HTTPException(status_code=400, detail="Cần cung cấp 'session_id' hoặc 'topic'.")
        if request.session_id and request.topic:
            raise HTTPException(status_code=400, detail="Chỉ cung cấp một trong hai: 'session_id' hoặc 'topic'.")
        if request.num_questions <= 0:
            raise HTTPException(status_code=400, detail="Số lượng câu hỏi phải lớn hơn 0.")

        if request.session_id:
            if request.session_id not in sessions:
                raise HTTPException(status_code=404, detail="Session không tồn tại.")
            session = sessions[request.session_id]
            raw_text = session.get('raw_text', '') or "\n\n".join(
                c.page_content for c in session.get('text_chunks', [])
            )
            if not raw_text:
                raise HTTPException(status_code=400, detail="Không có nội dung tài liệu trong session.")
            qa_pipeline = session.get('qa_pipeline') or QAPipeline()
            questions = await qa_pipeline.generate_essay_questions(
                num_questions=request.num_questions, context=raw_text
            )
        else:
            questions = await QAPipeline().generate_essay_questions(
                num_questions=request.num_questions, topic=request.topic
            )

        return EssayGenerationResponse(
            success=True,
            questions=[EssayQuestionItem(**q) for q in questions],
        )

    except ValueError as ve:
        return EssayGenerationResponse(success=False, message=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        return EssayGenerationResponse(success=False, message=f"Lỗi máy chủ: {str(e)}")


# ---------------------------------------------------------------------------
# Routes — Quiz
# ---------------------------------------------------------------------------

@app.post("/api/extract-quiz", response_model=QuizExtractionResponse)
async def extract_quiz_api(file: UploadFile = File(...)):
    """Trích xuất câu hỏi trắc nghiệm từ PDF hoặc DOCX."""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail='Không có file được chọn')
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail='Chỉ chấp nhận .pdf và .docx')

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        with open(file_path, "wb") as buf:
            buf.write(await file.read())

        try:
            ext = filename.rsplit('.', 1)[1].lower()
            quiz_data = extract_docx_data(file_path) if ext == 'docx' else extract_pdf_data(file_path)
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

        return QuizExtractionResponse(
            success=True,
            filename=filename,
            quiz_data=quiz_data,
            total_questions=len([q for q in quiz_data if isinstance(q.get('question_number'), int)]),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Lỗi khi xử lý file: {str(e)}')


@app.post("/api/shuffle-quiz", response_model=QuizShuffleResponse)
async def shuffle_quiz_api(request: QuizShuffleRequest):
    """Xáo trộn thứ tự câu hỏi và/hoặc đáp án."""
    try:
        data = request.quiz_data
        if request.shuffle_answers:
            data = shuffle_answers(data)
        if request.shuffle_questions:
            data = shuffle_questions(data)
        return QuizShuffleResponse(
            success=True,
            quiz_data=data,
            total_questions=len([q for q in data if isinstance(q.get('question_number'), int)]),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Lỗi khi đảo đề: {str(e)}')


@app.post("/api/download-quiz")
async def download_quiz_api(request: QuizDownloadRequest):
    """Tải đề thi dưới dạng PDF hoặc Word."""
    try:
        if request.format == 'pdf':
            stream, fname = download_quiz_pdf(request.quiz_data, request.filename)
            return StreamingResponse(
                io.BytesIO(stream.read()), media_type='application/pdf',
                headers={"Content-Disposition": f"attachment; filename={fname}"},
            )
        elif request.format == 'docx':
            stream, fname = download_quiz_docx(request.quiz_data, request.filename)
            return StreamingResponse(
                io.BytesIO(stream.read()),
                media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                headers={"Content-Disposition": f"attachment; filename={fname}"},
            )
        raise HTTPException(status_code=400, detail='Định dạng không được hỗ trợ')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Lỗi khi tạo file: {str(e)}')


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("index:app", host="0.0.0.0", port=8000, reload=True)
