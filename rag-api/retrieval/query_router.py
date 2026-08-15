# retrieval/query_router.py
# Phân loại câu hỏi để chọn đúng nguồn dữ liệu / chiến lược tìm kiếm.
# Ví dụ: câu hỏi về tài liệu → document_search
#         câu hỏi tin tức thời sự → web_search
#         câu hỏi toán, code → direct LLM answer

from enum import Enum
from typing import Tuple
from config import rag_config


class QueryRoute(str, Enum):
    DOCUMENT = "document"       # Tìm trong tài liệu đã upload
    WEB = "web"                 # Tìm kiếm web (Tavily)
    DIRECT = "direct"           # Trả lời thẳng bằng LLM (không cần retrieval)


class QueryRouter:
    """
    Phân loại query để chọn đúng routing strategy.

    Hiện tại hỗ trợ 2 chế độ:
        - rule_based: nhanh, không tốn API call, dựa vào keyword patterns
        - llm_based  : chính xác hơn, dùng LLM để phân loại (tốn thêm latency)
    """

    # ------------------------------------------------------------------
    # Keyword patterns cho rule-based routing
    # ------------------------------------------------------------------

    # Từ khóa gợi ý câu hỏi về thời sự / ngoài tài liệu → web search
    _WEB_KEYWORDS = [
        "tin tức", "mới nhất", "gần đây", "hôm nay", "năm nay",
        "hiện tại", "vừa ra", "update", "news", "latest", "recent",
        "giá", "tỷ giá", "chứng khoán", "thời tiết",
    ]

    # Từ khóa gợi ý câu trả lời có thể sinh thẳng (toán, code chung)
    _DIRECT_KEYWORDS = [
        "tính", "giải phương trình", "viết code", "code ví dụ",
        "translate", "dịch câu", "chào", "xin chào", "hello",
    ]

    def route(self, query: str, has_documents: bool = True) -> Tuple[QueryRoute, str]:
        """
        Phân loại query và trả về route + lý do.

        Args:
            query: Câu hỏi của người dùng.
            has_documents: Có session với tài liệu đã upload không.

        Returns:
            (QueryRoute, reason_string)
        """
        if not rag_config.retrieval.enable_query_router:
            # Router bị tắt → mặc định dùng document search
            return (QueryRoute.DOCUMENT, "Router disabled, defaulting to document search")

        q_lower = query.lower()

        # Nếu không có tài liệu → không thể document search
        if not has_documents:
            if any(kw in q_lower for kw in self._WEB_KEYWORDS):
                return (QueryRoute.WEB, "No documents + web keyword detected")
            return (QueryRoute.DIRECT, "No documents available")

        # Có tài liệu → ưu tiên document search trừ khi rõ ràng là web query
        if any(kw in q_lower for kw in self._WEB_KEYWORDS):
            return (QueryRoute.WEB, f"Web keyword detected in query")

        if any(kw in q_lower for kw in self._DIRECT_KEYWORDS):
            return (QueryRoute.DIRECT, f"Direct answer keyword detected")

        # Mặc định: document search
        return (QueryRoute.DOCUMENT, "Default route: document search")

    def route_with_llm(self, query: str, llm, has_documents: bool = True) -> Tuple[QueryRoute, str]:
        """
        Phân loại query dùng LLM — chính xác hơn rule-based.
        Chỉ gọi khi cần độ chính xác cao (latency +500ms).
        """
        prompt = f"""Phân loại câu hỏi sau vào một trong các nhóm:
- DOCUMENT: câu hỏi về nội dung tài liệu học thuật, khái niệm, định nghĩa, bài học
- WEB: câu hỏi về tin tức, sự kiện hiện tại, giá cả, thời tiết
- DIRECT: câu hỏi toán học thuần túy, lập trình cơ bản, chào hỏi xã giao

Câu hỏi: "{query}"

Trả lời CHỈ một trong: DOCUMENT, WEB, DIRECT"""

        try:
            response = llm.invoke(prompt)
            answer = response.content.strip().upper()
            if "DOCUMENT" in answer:
                return (QueryRoute.DOCUMENT, "LLM classified as DOCUMENT")
            elif "WEB" in answer:
                return (QueryRoute.WEB, "LLM classified as WEB")
            elif "DIRECT" in answer:
                return (QueryRoute.DIRECT, "LLM classified as DIRECT")
        except Exception as e:
            print(f"[QueryRouter] LLM routing failed: {e}. Falling back to rule-based.")

        # Fallback về rule-based
        return self.route(query, has_documents)
