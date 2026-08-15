# generation/prompts.py
# Quản lý tất cả Prompt Templates của hệ thống.
# Re-export từ prompt_template.py (gốc) để duy trì backward compatibility,
# đồng thời là nơi tập trung để thêm prompt mới theo kiến trúc mới.

# Re-export từ file gốc để không phá vỡ code cũ
from prompt_template import (
    AGENT_SYSTEM_PROMPT,
    ESSAY_GENERATION_PROMPT_RAG,
    ESSAY_GENERATION_PROMPT_TOPIC,
)

# ---------------------------------------------------------------------------
# Prompt mới — Query Transformation
# ---------------------------------------------------------------------------

QUERY_EXPANSION_PROMPT = """Hãy tạo {n} cách diễn đạt khác nhau cho câu hỏi sau, \
giữ nguyên ý nghĩa nhưng dùng từ ngữ và cấu trúc câu khác nhau.

Câu hỏi gốc: {query}

Trả về {n} câu hỏi, mỗi câu trên một dòng, KHÔNG đánh số, KHÔNG giải thích:"""

HYDE_PROMPT = """Hãy viết một đoạn văn ngắn (2-3 câu) giả định là câu trả lời \
cho câu hỏi dưới đây. Đoạn văn phải chứa đủ từ khóa học thuật liên quan.

Câu hỏi: {query}

Đoạn văn trả lời giả định:"""

STEP_BACK_PROMPT = """Câu hỏi sau đây rất cụ thể và chi tiết. \
Hãy tạo một câu hỏi tổng quát hơn có thể giúp tìm context cần thiết để trả lời câu hỏi gốc.

Câu hỏi gốc: {query}

Câu hỏi tổng quát hơn (chỉ trả về 1 câu, không giải thích):"""

# ---------------------------------------------------------------------------
# Prompt mới — Query Router (LLM-based)
# ---------------------------------------------------------------------------

QUERY_ROUTER_PROMPT = """Phân loại câu hỏi sau vào một trong các nhóm:
- DOCUMENT: câu hỏi về nội dung tài liệu học thuật, khái niệm, định nghĩa, bài học
- WEB: câu hỏi về tin tức, sự kiện hiện tại, giá cả, thời tiết  
- DIRECT: câu hỏi toán học thuần túy, lập trình cơ bản, chào hỏi xã giao

Câu hỏi: "{query}"

Trả lời CHỈ một trong: DOCUMENT, WEB, DIRECT"""

# ---------------------------------------------------------------------------
# Tất cả prompts — để dễ iterate
# ---------------------------------------------------------------------------
ALL_PROMPTS = {
    "agent_system": AGENT_SYSTEM_PROMPT,
    "essay_rag": ESSAY_GENERATION_PROMPT_RAG,
    "essay_topic": ESSAY_GENERATION_PROMPT_TOPIC,
    "query_expansion": QUERY_EXPANSION_PROMPT,
    "hyde": HYDE_PROMPT,
    "step_back": STEP_BACK_PROMPT,
    "query_router": QUERY_ROUTER_PROMPT,
}

__all__ = [
    "AGENT_SYSTEM_PROMPT",
    "ESSAY_GENERATION_PROMPT_RAG",
    "ESSAY_GENERATION_PROMPT_TOPIC",
    "QUERY_EXPANSION_PROMPT",
    "HYDE_PROMPT",
    "STEP_BACK_PROMPT",
    "QUERY_ROUTER_PROMPT",
    "ALL_PROMPTS",
]
