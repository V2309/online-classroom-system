# indexing/vector_store.py
# Interface chuẩn hóa để làm việc với Vector DB.
# Hiện tại wrap FAISS (in-memory).
# Thiết kế mở — dễ thêm Qdrant, pgvector, Chroma sau này.

import os
from typing import List, Optional
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from config import rag_config


class FAISSVectorStore:
    """
    Wrapper chuẩn hóa trên FAISS vector store.

    Cung cấp interface nhất quán:
        - add_documents()
        - similarity_search()
        - mmr_search()
        - as_retriever()
        - save() / load()
    """

    def __init__(self, embeddings=None):
        """
        Args:
            embeddings: LangChain Embeddings object.
                        Nếu None, tự khởi tạo qua EmbeddingFactory.
        """
        if embeddings is None:
            from indexing.embeddings import EmbeddingFactory
            embeddings = EmbeddingFactory().get_embeddings()

        self._embeddings = embeddings
        self._store: Optional[FAISS] = None

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def build_from_documents(self, documents: List[Document]) -> "FAISSVectorStore":
        """
        Tạo FAISS index mới từ list Documents.
        Trả về self để hỗ trợ method chaining.
        """
        if not documents:
            raise ValueError("Cannot build vector store from empty document list.")

        print(f"[VectorStore] Building FAISS index from {len(documents)} chunks...")
        self._store = FAISS.from_documents(
            documents=documents,
            embedding=self._embeddings,
        )
        print(f"[VectorStore] FAISS index built successfully.")

        # Tự động lưu xuống disk nếu config bật
        cfg = rag_config.session
        if cfg.persist_vector_store:
            self.save()

        return self

    def add_documents(self, documents: List[Document]) -> None:
        """Thêm documents mới vào index đã có."""
        if self._store is None:
            self.build_from_documents(documents)
        else:
            self._store.add_documents(documents)
            print(f"[VectorStore] Added {len(documents)} chunks to existing index.")

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Tìm kiếm theo cosine similarity."""
        self._assert_built()
        return self._store.similarity_search(query, k=k)

    def mmr_search(self, query: str) -> List[Document]:
        """Tìm kiếm với MMR (Maximal Marginal Relevance) — đa dạng hơn."""
        self._assert_built()
        cfg = rag_config.retrieval
        return self._store.max_marginal_relevance_search(
            query,
            k=cfg.mmr_k,
            fetch_k=cfg.mmr_fetch_k,
            lambda_mult=cfg.mmr_lambda_mult,
        )

    def as_retriever(self, search_type: str = "mmr", **kwargs):
        """
        Trả về LangChain Retriever object.
        search_type: "similarity" | "mmr" | "similarity_score_threshold"
        """
        self._assert_built()
        cfg = rag_config.retrieval
        default_kwargs = {
            "k": cfg.mmr_k,
            "fetch_k": cfg.mmr_fetch_k,
            "lambda_mult": cfg.mmr_lambda_mult,
        }
        default_kwargs.update(kwargs)

        return self._store.as_retriever(
            search_type=search_type,
            search_kwargs=default_kwargs,
        )

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: str = None) -> str:
        """Lưu FAISS index xuống disk."""
        self._assert_built()
        save_path = path or rag_config.session.vector_store_base_path
        os.makedirs(save_path, exist_ok=True)
        self._store.save_local(save_path)
        print(f"[VectorStore] Saved to: {save_path}")
        return save_path

    @classmethod
    def load(cls, path: str, embeddings=None) -> "FAISSVectorStore":
        """Tải FAISS index từ disk."""
        if embeddings is None:
            from indexing.embeddings import EmbeddingFactory
            embeddings = EmbeddingFactory().get_embeddings()

        instance = cls(embeddings=embeddings)
        instance._store = FAISS.load_local(
            path, embeddings, allow_dangerous_deserialization=True
        )
        print(f"[VectorStore] Loaded from: {path}")
        return instance

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _assert_built(self):
        if self._store is None:
            raise RuntimeError(
                "Vector store not built yet. Call build_from_documents() or load() first."
            )

    @property
    def store(self) -> FAISS:
        """Truy cập FAISS store gốc nếu cần."""
        self._assert_built()
        return self._store
