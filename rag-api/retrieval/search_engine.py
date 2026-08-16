# retrieval/search_engine.py
# Logic tìm kiếm cốt lõi — Hybrid Search kết hợp Vector + BM25 keyword search.
# Tách và mở rộng từ agent_core.create_hybrid_retriever().

from typing import List, Optional, Any
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_community.retrievers import BM25Retriever
from config import rag_config


class EnsembleRetriever(BaseRetriever):
    retrievers: List[Any]
    weights: Optional[List[float]] = None

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun = None
    ) -> List[Document]:
        all_docs = []
        for r in self.retrievers:
            docs = r.invoke(query) if hasattr(r, 'invoke') else r.get_relevant_documents(query)
            all_docs.extend(docs)
        seen = set()
        unique = []
        for d in all_docs:
            key = d.page_content[:200]
            if key not in seen:
                seen.add(key)
                unique.append(d)
        return unique



class HybridSearchEngine:
    """
    Hybrid Search Engine kết hợp:
        1. Vector Search (FAISS + MMR) — semantic similarity
        2. BM25 Keyword Search — exact keyword matching

    Kết quả được kết hợp với trọng số configurable.
    Hỗ trợ multi-query retrieval (chạy nhiều queries rồi dedup kết quả).
    """

    def __init__(
        self,
        vector_store=None,      # FAISSVectorStore object
        documents: List[Document] = None,  # Dùng để build BM25
    ):
        """
        Args:
            vector_store: FAISSVectorStore đã được build.
            documents: List chunks để tạo BM25 retriever.
        """
        self._vector_store = vector_store
        self._documents = documents or []
        self._retriever: Optional[EnsembleRetriever] = None

    def build(
        self,
        vector_store=None,
        documents: List[Document] = None,
    ) -> "HybridSearchEngine":
        """
        Khởi tạo ensemble retriever.
        Trả về self để hỗ trợ method chaining.
        """
        if vector_store is not None:
            self._vector_store = vector_store
        if documents is not None:
            self._documents = documents

        if self._vector_store is None:
            raise ValueError("vector_store is required to build HybridSearchEngine.")

        cfg = rag_config.retrieval

        # 1. Vector retriever với MMR
        vector_retriever = self._vector_store.as_retriever(
            search_type="mmr",
            k=cfg.mmr_k,
            fetch_k=cfg.mmr_fetch_k,
            lambda_mult=cfg.mmr_lambda_mult,
        )

        # 2. BM25 keyword retriever
        if self._documents:
            try:
                bm25_retriever = BM25Retriever.from_documents(
                    self._documents, k=cfg.bm25_k
                )
                # 3. Ensemble với weighted fusion
                self._retriever = EnsembleRetriever(
                    retrievers=[vector_retriever, bm25_retriever],
                    weights=[cfg.vector_weight, cfg.bm25_weight],
                )
                print(
                    f"[SearchEngine] Hybrid retriever built "
                    f"(vector={cfg.vector_weight}, bm25={cfg.bm25_weight})"
                )
            except ImportError:
                print("[SearchEngine] rank_bm25 not installed. Using vector-only retriever.")
                self._retriever = vector_retriever
        else:
            print("[SearchEngine] No documents for BM25. Using vector-only retriever.")
            self._retriever = vector_retriever

        return self

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, query: str) -> List[Document]:
        """
        Tìm kiếm với một query duy nhất.
        """
        self._assert_built()
        docs = self._retriever.invoke(query)
        print(f"[SearchEngine] Search '{query[:60]}...' -> {len(docs)} results")
        return docs

    def multi_query_search(self, queries: List[str]) -> List[Document]:
        """
        Tìm kiếm với nhiều queries (từ QueryTransformer), tổng hợp và dedup.
        Dùng khi đã áp dụng Query Expansion hoặc HyDE.
        """
        self._assert_built()

        if not queries:
            return []

        seen_contents = set()
        all_docs: List[Document] = []

        for q in queries:
            results = self._retriever.invoke(q)
            for doc in results:
                content_key = doc.page_content[:200]  # Dùng 200 ký tự đầu để dedup
                if content_key not in seen_contents:
                    seen_contents.add(content_key)
                    all_docs.append(doc)

        print(
            f"[SearchEngine] Multi-query ({len(queries)} queries) -> "
            f"{len(all_docs)} unique results"
        )
        return all_docs

    def as_langchain_retriever(self):
        """Trả về LangChain retriever object để dùng trong Agent/Chain."""
        self._assert_built()
        return self._retriever

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _assert_built(self):
        if self._retriever is None:
            raise RuntimeError(
                "SearchEngine not built. Call build() first."
            )
