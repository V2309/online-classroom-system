# ingestion/chunkers.py
# Logic cắt đoạn văn bản (chunking).
# Tách từ agent_core.split_documents() — thêm SemanticChunker.

from typing import List
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from config import rag_config


class RecursiveChunker:
    """
    Cắt văn bản theo ký tự/câu với RecursiveCharacterTextSplitter.
    Đây là chiến lược mặc định, hoạt động tốt với hầu hết văn bản.
    """

    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None,
        separators: List[str] = None,
    ):
        cfg = rag_config.chunking
        self.chunk_size = chunk_size or cfg.chunk_size
        self.chunk_overlap = chunk_overlap or cfg.chunk_overlap
        self.separators = separators or cfg.separators
        self.min_chunk_length = cfg.min_chunk_length
        self.min_word_count = cfg.min_word_count

        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=self.separators,
            add_start_index=True,  # Thêm start_index vào metadata
        )

    def split(self, documents: List[Document]) -> List[Document]:
        """
        Cắt list Documents thành chunks.
        Tự động lọc bỏ chunks quá ngắn hoặc rỗng.
        """
        chunks = self._splitter.split_documents(documents)
        return self._filter_and_enrich(chunks)

    def _filter_and_enrich(self, chunks: List[Document]) -> List[Document]:
        """Lọc chunks xấu và thêm metadata chunk."""
        result = []
        for chunk in chunks:
            content = chunk.page_content.strip()
            word_count = len(content.split())

            if len(content) < self.min_chunk_length:
                continue
            if word_count < self.min_word_count:
                continue

            chunk.page_content = content
            chunk.metadata.update({
                "chunk_length": len(content),
                "word_count": word_count,
                "chunker": "recursive",
            })
            result.append(chunk)

        print(f"[Chunker] Recursive: {len(chunks)} raw → {len(result)} filtered chunks")
        return result


class SemanticChunker:
    """
    Cắt văn bản theo ngữ nghĩa — ghép các câu/đoạn gần nhau về ý nghĩa.
    Yêu cầu embedding model để tính similarity giữa các câu.

    Ưu điểm: Các chunk giữ trọn vẹn ý nghĩa ngữ nghĩa.
    Nhược điểm: Chậm hơn RecursiveChunker do phải gọi embedding.
    """

    def __init__(self, embedding_model=None, breakpoint_threshold: float = 0.85):
        """
        Args:
            embedding_model: LangChain Embeddings object (OpenAI/Google).
                             Nếu None, sẽ dùng embedding từ EmbeddingFactory.
            breakpoint_threshold: Ngưỡng cosine similarity để xác định điểm cắt.
                                  Giá trị cao hơn = chunk dài hơn, ít cắt hơn.
        """
        self._embedding_model = embedding_model
        self.breakpoint_threshold = breakpoint_threshold
        self.min_chunk_length = rag_config.chunking.min_chunk_length

    def _get_embeddings(self):
        if self._embedding_model is None:
            # Lazy import để tránh circular dependency
            from indexing.embeddings import EmbeddingFactory
            self._embedding_model = EmbeddingFactory().get_embeddings()
        return self._embedding_model

    def split(self, documents: List[Document]) -> List[Document]:
        """
        Cắt documents theo ngữ nghĩa.
        Sử dụng LangChain SemanticChunker (experimental).
        """
        try:
            from langchain_experimental.text_splitter import SemanticChunker as LCSemanticChunker
        except ImportError:
            print("[Chunker] langchain-experimental not installed. Falling back to RecursiveChunker.")
            return RecursiveChunker().split(documents)

        embeddings = self._get_embeddings()
        splitter = LCSemanticChunker(
            embeddings=embeddings,
            breakpoint_threshold_type="percentile",
            breakpoint_threshold_amount=self.breakpoint_threshold,
        )

        chunks = splitter.split_documents(documents)

        result = []
        for chunk in chunks:
            content = chunk.page_content.strip()
            if len(content) < self.min_chunk_length:
                continue
            chunk.metadata.update({
                "chunk_length": len(content),
                "word_count": len(content.split()),
                "chunker": "semantic",
            })
            result.append(chunk)

        print(f"[Chunker] Semantic: {len(chunks)} raw → {len(result)} filtered chunks")
        return result
