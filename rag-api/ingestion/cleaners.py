# ingestion/cleaners.py
# Làm sạch dữ liệu văn bản: xóa ký tự lạ, HTML tags, khoảng trắng thừa,
# header/footer lặp lại, v.v.
# Tách từ agent_core.preprocess_text() — nay được mở rộng.

import re
from typing import List
from langchain_core.documents import Document


class TextCleaner:
    """
    Làm sạch và chuẩn hóa văn bản từ tài liệu trước khi chunking.
    """

    def clean_documents(self, documents: List[Document]) -> List[Document]:
        """Áp dụng pipeline làm sạch cho list Documents."""
        cleaned = []
        for doc in documents:
            cleaned_content = self.clean(doc.page_content)
            if cleaned_content.strip():  # Bỏ qua trang hoàn toàn rỗng
                doc.page_content = cleaned_content
                cleaned.append(doc)
        return cleaned

    def clean(self, text: str) -> str:
        """Pipeline làm sạch đầy đủ cho một đoạn text."""
        text = self._remove_html_tags(text)
        text = self._normalize_whitespace(text)
        text = self._remove_page_markers(text)
        text = self._normalize_punctuation(text)
        text = self._remove_repeated_chars(text)
        return text.strip()

    # ------------------------------------------------------------------
    # Các bước làm sạch
    # ------------------------------------------------------------------

    def _remove_html_tags(self, text: str) -> str:
        """Xóa HTML tags nếu có."""
        return re.sub(r"<[^>]+>", " ", text)

    def _normalize_whitespace(self, text: str) -> str:
        """Chuẩn hóa khoảng trắng và dòng trống."""
        text = re.sub(r"[ \t]+", " ", text)       # Nhiều space/tab → 1 space
        text = re.sub(r"\n{3,}", "\n\n", text)     # 3+ dòng trống → 2 dòng
        return text

    def _remove_page_markers(self, text: str) -> str:
        """Xóa các header/footer thường thấy trong PDF."""
        patterns = [
            r"Trang\s+\d+(\s*/\s*\d+)?",          # Trang 1, Trang 1/10
            r"Page\s+\d+(\s+of\s+\d+)?",           # Page 1, Page 1 of 10
            r"^\s*\d+\s*$",                          # Dòng chỉ có số trang
            r"-\s*\d+\s*-",                          # - 1 -
        ]
        for pat in patterns:
            text = re.sub(pat, "", text, flags=re.MULTILINE | re.IGNORECASE)
        return text

    def _normalize_punctuation(self, text: str) -> str:
        """Chuẩn hóa dấu câu: xóa khoảng trắng thừa trước dấu câu."""
        text = re.sub(r"\s+([.,;:!?])", r"\1", text)   # khoảng trắng trước dấu câu
        text = re.sub(r"([.,;:!?])\s*([.,;:!?])", r"\1\2", text)  # dấu câu liên tiếp
        return text

    def _remove_repeated_chars(self, text: str) -> str:
        """Xóa ký tự lặp lại bất thường (VD: từ OCR lỗi)."""
        # Xóa các dòng toàn dấu chấm, gạch ngang (separator lines)
        text = re.sub(r"^[\s.*\-_=]{10,}$", "", text, flags=re.MULTILINE)
        return text
