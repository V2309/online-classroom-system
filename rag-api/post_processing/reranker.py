# post_processing/reranker.py
# Chấm điểm lại kết quả tìm kiếm để chọn ra những đoạn text thực sự liên quan nhất.
#
# Cross-encoder cho điểm mỗi cặp (query, document) — chính xác hơn bi-encoder (FAISS)
# nhưng chậm hơn, nên chỉ dùng trên tập nhỏ (top-20 từ retrieval).
#
# Model mặc định: cross-encoder/ms-marco-MiniLM-L-6-v2 (nhẹ, nhanh, tốt)
# Thay thế bằng Cohere Rerank API nếu muốn không cài thư viện nặng.

from typing import List
from langchain_core.documents import Document
from config import rag_config


class CrossEncoderReranker:
    """
    Reranker dùng Cross-Encoder model để chấm điểm lại danh sách documents.

    Pipeline:
        Retrieval (top-20) → CrossEncoderReranker → top-5 docs chất lượng cao

    Yêu cầu: sentence-transformers (đã có trong requirements.txt dạng transformers)
    """

    def __init__(self, model_name: str = None, top_k: int = None):
        cfg = rag_config.post_processing
        self.model_name = model_name or cfg.reranker_model
        self.top_k = top_k or cfg.reranker_top_k
        self._model = None  # Lazy load

    def _load_model(self):
        """Lazy load model khi lần đầu sử dụng."""
        if self._model is None:
            try:
                from sentence_transformers import CrossEncoder
                print(f"[Reranker] Loading cross-encoder model: {self.model_name}")
                self._model = CrossEncoder(self.model_name)
                print(f"[Reranker] Model loaded successfully.")
            except ImportError:
                raise ImportError(
                    "sentence-transformers is required for CrossEncoderReranker. "
                    "Install with: pip install sentence-transformers"
                )

    def rerank(self, query: str, documents: List[Document]) -> List[Document]:
        """
        Chấm điểm lại và sắp xếp documents theo mức độ liên quan với query.

        Args:
            query: Câu hỏi của người dùng.
            documents: Danh sách docs từ retrieval (thường 10-20 docs).

        Returns:
            Top-K docs được sắp xếp lại theo relevance score, cao nhất trước.
        """
        if not rag_config.post_processing.enable_reranker:
            return documents[:self.top_k]

        if not documents:
            return []

        try:
            self._load_model()

            # Tạo cặp (query, document_content) cho cross-encoder
            pairs = [(query, doc.page_content) for doc in documents]

            # Chấm điểm
            scores = self._model.predict(pairs)

            # Gắn score vào metadata và sắp xếp
            for doc, score in zip(documents, scores):
                doc.metadata["rerank_score"] = float(score)

            ranked = sorted(documents, key=lambda d: d.metadata["rerank_score"], reverse=True)
            result = ranked[:self.top_k]

            print(
                f"[Reranker] {len(documents)} docs → top-{len(result)} after reranking. "
                f"Best score: {result[0].metadata['rerank_score']:.4f}"
            )
            return result

        except Exception as e:
            print(f"[Reranker] Reranking failed: {e}. Returning original order.")
            return documents[:self.top_k]


class CohereReranker:
    """
    Reranker sử dụng Cohere Rerank API (thay thế cho CrossEncoder nếu không muốn cài model local).
    Yêu cầu: COHERE_API_KEY trong .env
    """

    def __init__(self, top_k: int = None, model: str = "rerank-multilingual-v3.0"):
        self.top_k = top_k or rag_config.post_processing.reranker_top_k
        self.model = model
        self._client = None

    def _get_client(self):
        if self._client is None:
            import os
            import cohere
            api_key = os.getenv("COHERE_API_KEY")
            if not api_key:
                raise ValueError("COHERE_API_KEY not found in environment variables.")
            self._client = cohere.Client(api_key)
        return self._client

    def rerank(self, query: str, documents: List[Document]) -> List[Document]:
        """Rerank using Cohere API."""
        if not documents:
            return []

        try:
            client = self._get_client()
            doc_texts = [doc.page_content for doc in documents]

            results = client.rerank(
                query=query,
                documents=doc_texts,
                top_n=self.top_k,
                model=self.model,
            )

            reranked = []
            for r in results.results:
                doc = documents[r.index]
                doc.metadata["rerank_score"] = r.relevance_score
                reranked.append(doc)

            print(f"[CohereReranker] {len(documents)} → top-{len(reranked)} reranked")
            return reranked

        except Exception as e:
            print(f"[CohereReranker] Failed: {e}. Returning original order.")
            return documents[:self.top_k]
