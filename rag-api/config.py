# config.py
# Cấu hình tập trung cho toàn bộ RAG pipeline.
# Thay đổi tham số tại đây để ảnh hưởng đến toàn bộ hệ thống.

from dataclasses import dataclass, field
from typing import List, Literal


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
@dataclass
class ChunkingConfig:
    chunk_size: int = 800
    chunk_overlap: int = 150
    min_chunk_length: int = 50       # Loại bỏ chunk < N ký tự
    min_word_count: int = 5          # Loại bỏ chunk < N từ
    separators: List[str] = field(default_factory=lambda: [
        "\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " ", ""
    ])


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------
@dataclass
class EmbeddingConfig:
    provider: Literal["openai", "google"] = "openai"
    openai_model: str = "text-embedding-3-small"
    openai_dimensions: int = 1536
    google_model: str = "models/embedding-001"


# ---------------------------------------------------------------------------
# Vector Store / Retrieval
# ---------------------------------------------------------------------------
@dataclass
class RetrievalConfig:
    # Hybrid search weights: [vector, bm25]
    vector_weight: float = 0.7
    bm25_weight: float = 0.3

    # MMR (Maximal Marginal Relevance) params
    mmr_k: int = 4                   # Số docs trả về cuối cùng
    mmr_fetch_k: int = 15            # Số docs lấy trước khi áp dụng MMR
    mmr_lambda_mult: float = 0.8     # Cân bằng relevance vs diversity

    # BM25
    bm25_k: int = 4

    # Query Transform
    enable_query_transform: bool = True
    query_transform_strategy: Literal["hyde", "expansion", "none"] = "expansion"
    num_expanded_queries: int = 3    # Số câu hỏi mở rộng

    # Query Router
    enable_query_router: bool = True


# ---------------------------------------------------------------------------
# Post-Processing
# ---------------------------------------------------------------------------
@dataclass
class PostProcessingConfig:
    # Reranker
    enable_reranker: bool = True
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    reranker_top_k: int = 5          # Số docs giữ lại sau reranking

    # Context Compression
    enable_context_compression: bool = True
    compression_similarity_threshold: float = 0.76


# ---------------------------------------------------------------------------
# Generation / LLM
# ---------------------------------------------------------------------------
@dataclass
class GenerationConfig:
    # Chat agent
    chat_model: str = "gemini-2.5-flash"
    chat_temperature: float = 0.05
    chat_max_tokens: int = 4096
    chat_top_p: float = 0.7
    chat_max_retries: int = 3
    chat_timeout: int = 60

    # Essay / Content generation
    essay_model: str = "gemini-2.5-flash"
    essay_temperature: float = 0.2
    essay_max_tokens: int = 4096
    essay_top_p: float = 0.7
    essay_max_retries: int = 3
    essay_timeout: int = 90
    essay_max_context_chars: int = 12_000

    # Podcast / Script generation
    podcast_max_context_chars: int = 10_000


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------
@dataclass
class SessionConfig:
    # Giữ sessions in-memory (sẽ mất khi restart)
    # Set persist_vector_store=True để lưu FAISS xuống disk
    persist_vector_store: bool = False
    vector_store_base_path: str = "./vector_stores"


# ---------------------------------------------------------------------------
# Master Config — sử dụng object này ở khắp nơi
# ---------------------------------------------------------------------------
@dataclass
class RAGConfig:
    chunking: ChunkingConfig = field(default_factory=ChunkingConfig)
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    retrieval: RetrievalConfig = field(default_factory=RetrievalConfig)
    post_processing: PostProcessingConfig = field(default_factory=PostProcessingConfig)
    generation: GenerationConfig = field(default_factory=GenerationConfig)
    session: SessionConfig = field(default_factory=SessionConfig)


# Singleton — import và dùng trực tiếp trong toàn bộ project
rag_config = RAGConfig()
