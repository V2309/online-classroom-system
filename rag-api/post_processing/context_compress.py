# post_processing/context_compress.py
# Lọc nhiễu, cắt bỏ các đoạn thừa trong kết quả tìm được trước khi đưa vào LLM.
#
# Mục tiêu: Giảm token context (giảm chi phí API + tăng chính xác câu trả lời)
# bằng cách loại bỏ các đoạn text không liên quan đến câu hỏi.

from typing import List
from langchain_core.documents import Document
from config import rag_config


class ContextCompressor:
    """
    Nén và lọc context sau retrieval/reranking.

    Hỗ trợ 2 chiến lược:
        1. EmbeddingsFilter: Dùng embedding similarity để lọc docs không liên quan
        2. LLMFilter: Dùng LLM để quyết định doc nào có ích (tốn API call)
    """

    def __init__(self, embeddings=None, llm=None):
        self._embeddings = embeddings
        self._llm = llm

    def _get_embeddings(self):
        if self._embeddings is None:
            from indexing.embeddings import EmbeddingFactory
            self._embeddings = EmbeddingFactory().get_embeddings()
        return self._embeddings

    def _get_llm(self):
        if self._llm is None:
            from generation.llm_factory import LLMFactory
            self._llm = LLMFactory().get_llm(task="chat")
        return self._llm

    # ------------------------------------------------------------------
    # Chiến lược 1: Embedding similarity filter (nhanh, không tốn LLM call)
    # ------------------------------------------------------------------

    def filter_by_similarity(
        self, query: str, documents: List[Document]
    ) -> List[Document]:
        """
        Lọc bỏ documents có embedding similarity với query dưới threshold.
        Nhanh và không tốn thêm API call LLM.
        """
        if not rag_config.post_processing.enable_context_compression:
            return documents

        if not documents:
            return []

        try:
            from langchain.retrievers.document_compressors import EmbeddingsFilter
            from langchain.retrievers import ContextualCompressionRetriever

            threshold = rag_config.post_processing.compression_similarity_threshold
            embeddings = self._get_embeddings()

            compressor = EmbeddingsFilter(
                embeddings=embeddings,
                similarity_threshold=threshold,
            )

            filtered = compressor.compress_documents(documents, query)
            print(
                f"[ContextCompress] EmbeddingsFilter: "
                f"{len(documents)} → {len(filtered)} docs "
                f"(threshold={threshold})"
            )
            return filtered if filtered else documents  # Fallback nếu lọc hết

        except Exception as e:
            print(f"[ContextCompress] EmbeddingsFilter failed: {e}. Returning original docs.")
            return documents

    # ------------------------------------------------------------------
    # Chiến lược 2: LLM-based extraction filter (chậm, chính xác nhất)
    # ------------------------------------------------------------------

    def extract_relevant_parts(
        self, query: str, documents: List[Document]
    ) -> List[Document]:
        """
        Dùng LLM để chiết xuất phần liên quan từ mỗi document.
        Phương pháp LLMChainExtractor — từng doc được xử lý riêng.
        Chỉ nên dùng khi chất lượng context là ưu tiên tối cao.
        """
        if not documents:
            return []

        try:
            from langchain.retrievers.document_compressors import LLMChainExtractor

            llm = self._get_llm()
            compressor = LLMChainExtractor.from_llm(llm)
            filtered = compressor.compress_documents(documents, query)

            print(
                f"[ContextCompress] LLMExtractor: "
                f"{len(documents)} → {len(filtered)} docs"
            )
            return filtered if filtered else documents

        except Exception as e:
            print(f"[ContextCompress] LLMExtractor failed: {e}. Returning original docs.")
            return documents

    # ------------------------------------------------------------------
    # Utility: Format context string cho LLM
    # ------------------------------------------------------------------

    def format_context(self, documents: List[Document], max_chars: int = None) -> str:
        """
        Kết hợp các documents thành một chuỗi context cho LLM.
        Thêm separator và metadata source/page nếu có.
        """
        if not documents:
            return ""

        parts = []
        total_chars = 0

        for i, doc in enumerate(documents):
            # Lấy metadata source
            source = doc.metadata.get("source_file", doc.metadata.get("source", "Tài liệu"))
            page = doc.metadata.get("page_number", "")
            page_str = f", trang {page}" if page else ""

            header = f"[{i+1}] Nguồn: {source}{page_str}"
            block = f"{header}\n{doc.page_content}\n"

            if max_chars and (total_chars + len(block)) > max_chars:
                print(f"[ContextCompress] Context truncated at doc {i+1}/{len(documents)}")
                break

            parts.append(block)
            total_chars += len(block)

        return "\n---\n".join(parts)
