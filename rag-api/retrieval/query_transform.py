# retrieval/query_transform.py
# Viết lại và mở rộng câu hỏi để cải thiện chất lượng retrieval.
#
# Các kỹ thuật:
#   - Query Expansion: Sinh nhiều cách diễn đạt khác nhau cho cùng 1 câu hỏi
#   - HyDE (Hypothetical Document Embeddings): Sinh câu trả lời giả định rồi embed
#   - Step-Back Prompting: Đặt lại câu hỏi ở mức tổng quát hơn

from typing import List
from config import rag_config


class QueryTransformer:
    """
    Biến đổi query trước khi đưa vào search engine để tăng recall.

    Ví dụ:
        Query gốc: "số tiết lý thuyết là bao nhiêu?"
        → Expansion: ["thời lượng lý thuyết", "lý thuyết tiết học", "tổng tiết lý thuyết"]
        → HyDE: "Môn học có 20 tiết lý thuyết và 10 tiết thực hành..."
    """

    def __init__(self, llm=None):
        """
        Args:
            llm: LangChain LLM object. Nếu None, sẽ lazy-load qua LLMFactory.
        """
        self._llm = llm

    def _get_llm(self):
        if self._llm is None:
            from generation.llm_factory import LLMFactory
            self._llm = LLMFactory().get_llm(task="chat")
        return self._llm

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def transform(self, query: str) -> List[str]:
        """
        Áp dụng chiến lược transform theo config.
        Trả về list queries (bao gồm query gốc ở vị trí đầu tiên).
        """
        cfg = rag_config.retrieval

        if not cfg.enable_query_transform:
            return [query]

        strategy = cfg.query_transform_strategy

        if strategy == "expansion":
            return self.expand_query(query)
        elif strategy == "hyde":
            return self.hyde(query)
        else:
            return [query]

    def expand_query(self, query: str) -> List[str]:
        """
        Query Expansion: Sinh các cách diễn đạt thay thế cho câu hỏi.
        Giúp tìm thấy thông tin dù dùng từ ngữ khác nhau.
        """
        cfg = rag_config.retrieval
        n = cfg.num_expanded_queries

        prompt = f"""Hãy tạo {n} cách diễn đạt khác nhau cho câu hỏi sau, \
giữ nguyên ý nghĩa nhưng dùng từ ngữ và cấu trúc câu khác nhau.

Câu hỏi gốc: {query}

Trả về {n} câu hỏi, mỗi câu trên một dòng, KHÔNG đánh số, KHÔNG giải thích:"""

        try:
            llm = self._get_llm()
            response = llm.invoke(prompt)
            raw = response.content.strip()
            expanded = [line.strip() for line in raw.split("\n") if line.strip()][:n]
            result = [query] + expanded  # Query gốc luôn ở đầu
            print(f"[QueryTransform] Expanded to {len(result)} queries")
            return result
        except Exception as e:
            print(f"[QueryTransform] Expansion failed: {e}. Using original query.")
            return [query]

    def hyde(self, query: str) -> List[str]:
        """
        HyDE (Hypothetical Document Embeddings):
        LLM sinh một đoạn văn giả định có thể là câu trả lời,
        sau đó dùng đoạn văn đó để tìm kiếm embedding thay vì query gốc.
        Hiệu quả hơn cho câu hỏi ngắn, trừu tượng.
        """
        prompt = f"""Hãy viết một đoạn văn ngắn (2-3 câu) giả định là câu trả lời \
cho câu hỏi dưới đây. Đoạn văn phải chứa đủ từ khóa học thuật liên quan.

Câu hỏi: {query}

Đoạn văn trả lời giả định:"""

        try:
            llm = self._get_llm()
            response = llm.invoke(prompt)
            hypothetical_doc = response.content.strip()
            result = [query, hypothetical_doc]  # Dùng cả query gốc lẫn doc giả định
            print(f"[QueryTransform] HyDE generated hypothetical doc ({len(hypothetical_doc)} chars)")
            return result
        except Exception as e:
            print(f"[QueryTransform] HyDE failed: {e}. Using original query.")
            return [query]

    def step_back(self, query: str) -> List[str]:
        """
        Step-Back Prompting: Đặt lại câu hỏi ở mức tổng quát hơn.
        Hữu ích khi câu hỏi quá chi tiết, cần context tổng quan trước.

        Ví dụ: "Kết quả thực nghiệm trên dataset CIFAR-10 là gì?"
             → "Phương pháp được đề xuất trong nghiên cứu này là gì?"
        """
        prompt = f"""Câu hỏi sau đây rất cụ thể và chi tiết. \
Hãy tạo một câu hỏi tổng quát hơn có thể giúp tìm context cần thiết để trả lời câu hỏi gốc.

Câu hỏi gốc: {query}

Câu hỏi tổng quát hơn (chỉ trả về 1 câu, không giải thích):"""

        try:
            llm = self._get_llm()
            response = llm.invoke(prompt)
            step_back_query = response.content.strip()
            result = [query, step_back_query]
            print(f"[QueryTransform] Step-back query: '{step_back_query}'")
            return result
        except Exception as e:
            print(f"[QueryTransform] Step-back failed: {e}. Using original query.")
            return [query]
