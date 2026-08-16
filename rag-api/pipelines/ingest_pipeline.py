# pipelines/ingest_pipeline.py
# Luồng xử lý đầu vào hoàn chỉnh:
#   File thô → Loaders → Cleaners → Chunkers → Embeddings → VectorStore
#
# Đây là "lắp ráp" các module lại — không chứa logic phức tạp.

from typing import List, Optional
from langchain_core.documents import Document

from ingestion.loaders import DocumentLoader
from ingestion.cleaners import TextCleaner
from ingestion.chunkers import RecursiveChunker, SemanticChunker
from indexing.embeddings import EmbeddingFactory
from indexing.vector_store import FAISSVectorStore
from config import rag_config


class IngestPipeline:
    """
    Pipeline xử lý tài liệu từ đầu đến cuối.

    Luồng:
        sources (PDF/DOCX/URL) 
        → DocumentLoader    (đọc file)
        → TextCleaner       (làm sạch text)
        → RecursiveChunker  (cắt thành chunks)
        → EmbeddingFactory  (tạo vector)
        → FAISSVectorStore  (lưu index)

    Ví dụ sử dụng:
        pipeline = IngestPipeline()
        result = pipeline.run(sources=[upload_file_1, upload_file_2])
        # result.vector_store  → để tạo retriever
        # result.chunks        → để tạo BM25
        # result.raw_text      → để tạo podcast/essay
    """

    def __init__(self, chunker_type: str = "recursive"):
        """
        Args:
            chunker_type: "recursive" (mặc định, nhanh) hoặc "semantic" (chậm hơn, chính xác hơn)
        """
        self.loader = DocumentLoader()
        self.cleaner = TextCleaner()
        self.chunker_type = chunker_type

        # Embeddings và vector store được khởi tạo trong run() để lazy load
        self._embeddings = None

    def run(self, sources: List) -> "IngestResult":
        """
        Chạy toàn bộ ingestion pipeline.

        Args:
            sources: List các UploadFile, file paths, hoặc URLs.

        Returns:
            IngestResult object chứa vector_store, chunks, và raw_text.
        """
        print(f"[IngestPipeline] Starting ingestion for {len(sources)} source(s)...")

        # Step 1: Load
        documents = self.loader.load_from_sources(sources)
        print(f"[IngestPipeline] Loaded {len(documents)} pages/docs")

        # Step 2: Clean
        documents = self.cleaner.clean_documents(documents)
        print(f"[IngestPipeline] Cleaned -> {len(documents)} docs remaining")

        # Step 3: Extract raw text (dùng cho podcast/essay, trước khi chunk)
        raw_text = self._extract_raw_text(documents)

        # Step 4: Chunk
        chunker = self._get_chunker()
        chunks = chunker.split(documents)
        print(f"[IngestPipeline] Chunked -> {len(chunks)} chunks")

        if not chunks:
            raise ValueError("No text chunks were created. The documents may be empty or unsupported.")

        # Step 5: Embed + Build Vector Store
        embeddings = self._get_embeddings()
        vector_store = FAISSVectorStore(embeddings=embeddings)
        vector_store.build_from_documents(chunks)

        print(f"[IngestPipeline] [OK] Ingestion complete: {len(chunks)} chunks indexed")

        return IngestResult(
            vector_store=vector_store,
            chunks=chunks,
            raw_text=raw_text,
            num_documents=len(documents),
            num_chunks=len(chunks),
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _get_chunker(self):
        if self.chunker_type == "semantic":
            return SemanticChunker(embedding_model=self._get_embeddings())
        return RecursiveChunker()

    def _get_embeddings(self):
        if self._embeddings is None:
            self._embeddings = EmbeddingFactory().get_embeddings()
        return self._embeddings

    def _extract_raw_text(self, documents: List[Document]) -> str:
        """Ghép toàn bộ text từ documents (dùng cho podcast/essay)."""
        return "\n\n".join(
            doc.page_content for doc in documents if doc.page_content.strip()
        )


class IngestResult:
    """Kết quả từ IngestPipeline — container object."""

    def __init__(
        self,
        vector_store: FAISSVectorStore,
        chunks: List[Document],
        raw_text: str,
        num_documents: int,
        num_chunks: int,
    ):
        self.vector_store = vector_store    # Để tạo retriever
        self.chunks = chunks                # Để tạo BM25 retriever
        self.raw_text = raw_text            # Để tạo podcast/essay
        self.num_documents = num_documents
        self.num_chunks = num_chunks

    def __repr__(self):
        return (
            f"<IngestResult: {self.num_documents} docs, "
            f"{self.num_chunks} chunks>"
        )
