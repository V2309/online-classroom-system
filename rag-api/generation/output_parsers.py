# generation/output_parsers.py
# Ép kiểu dữ liệu trả về từ LLM — đặc biệt là parsing JSON.
# Tách toàn bộ JSON parsing logic từ agent_core.py và chuẩn hóa.

import re
import json
from typing import Any, Dict, List, Optional


class JSONOutputParser:
    """
    Parser để trích xuất và parse JSON từ LLM response.
    Xử lý được JSON trong markdown code blocks, JSON thô, và JSON bị cắt cụt.

    Ví dụ sử dụng:
        parser = JSONOutputParser()
        result = parser.parse(llm_response_text)
    """

    def parse(self, raw_response: str) -> Dict[str, Any]:
        """
        Parse JSON từ raw LLM response.
        Tự động thử nhiều phương pháp trích xuất và sửa chữa.

        Raises:
            ValueError: Nếu không thể parse JSON sau tất cả các phương pháp.
        """
        json_str = self._extract_json_string(raw_response)

        if not json_str:
            raise ValueError(
                f"No valid JSON found in LLM response. "
                f"Preview: {raw_response[:300]}..."
            )

        return self._parse_with_repair(json_str)

    def parse_questions(self, raw_response: str, expected_count: int = None) -> List[Dict]:
        """
        Convenience method: parse JSON và trả về list questions.
        Dùng cho essay generation.
        """
        parsed = self.parse(raw_response)

        if "questions" not in parsed or not isinstance(parsed["questions"], list):
            raise ValueError(
                "JSON output is missing 'questions' list. "
                f"Got keys: {list(parsed.keys())}"
            )

        questions = parsed["questions"]

        if expected_count and len(questions) != expected_count:
            print(f"[Parser] Warning: expected {expected_count} questions, got {len(questions)}")

        return questions

    # ------------------------------------------------------------------
    # Extraction methods
    # ------------------------------------------------------------------

    def _extract_json_string(self, text: str) -> Optional[str]:
        """Thử nhiều phương pháp để tìm JSON string trong text."""

        # Phương pháp 1: JSON trong ```json ... ``` block
        match = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", text, re.DOTALL)
        if match:
            json_str = match.group(1).strip()
            print(f"[Parser] Found JSON in ```json block ({len(json_str)} chars)")
            return json_str

        # Phương pháp 2: JSON trong ``` ... ``` block (không có language tag)
        match = re.search(r"```\s*(\{[\s\S]*?\})\s*```", text, re.DOTALL)
        if match:
            json_str = match.group(1).strip()
            print(f"[Parser] Found JSON in ``` block ({len(json_str)} chars)")
            return json_str

        # Phương pháp 3: Balanced bracket extraction
        json_str = self._extract_balanced_json(text)
        if json_str:
            print(f"[Parser] Found balanced JSON ({len(json_str)} chars)")
            return json_str

        # Phương pháp 4: Tìm từ { đầu tiên đến } cuối cùng
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and start < end:
            json_str = text[start : end + 1].strip()
            print(f"[Parser] Found basic JSON ({len(json_str)} chars)")
            return json_str

        return None

    def _extract_balanced_json(self, text: str) -> Optional[str]:
        """Trích xuất JSON bằng cách cân bằng dấu ngoặc nhọn."""
        start_idx = text.find("{")
        if start_idx == -1:
            return None

        bracket_count = 0
        in_string = False
        escape_next = False

        for i, char in enumerate(text[start_idx:], start_idx):
            if escape_next:
                escape_next = False
                continue
            if char == "\\" and in_string:
                escape_next = True
                continue
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            if not in_string:
                if char == "{":
                    bracket_count += 1
                elif char == "}":
                    bracket_count -= 1
                    if bracket_count == 0:
                        return text[start_idx : i + 1].strip()

        # JSON bị cắt cụt — trả về phần còn lại để sửa
        if bracket_count > 0:
            return text[start_idx:].strip()

        return None

    # ------------------------------------------------------------------
    # Repair methods
    # ------------------------------------------------------------------

    def _parse_with_repair(self, json_str: str) -> Dict[str, Any]:
        """Parse JSON, tự động sửa chữa nếu bị lỗi."""
        # Thử parse trực tiếp
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"[Parser] Initial parse failed: {e}. Attempting repair...")

        # Thử sửa chữa
        repaired = self._repair(json_str)
        try:
            result = json.loads(repaired)
            print(f"[Parser] JSON repaired successfully")
            return result
        except json.JSONDecodeError as e:
            raise ValueError(f"Cannot parse JSON even after repair: {e}")

    def _repair(self, json_str: str) -> str:
        """Cố gắng sửa chữa JSON bị lỗi phổ biến."""
        original_len = len(json_str)
        json_str = json_str.strip()

        # Bước 1: Đóng string chưa kết thúc
        quote_count = json_str.count('"') - json_str.count('\\"')
        if quote_count % 2 == 1:
            json_str += '"'
            print(f"[Parser] Closed unterminated string")

        # Bước 2: Đóng mảng chưa kết thúc
        open_brackets = json_str.count("[") - json_str.count("]")
        if open_brackets > 0:
            json_str += "]" * open_brackets
            print(f"[Parser] Added {open_brackets} missing closing brackets ']'")

        # Bước 3: Đóng object chưa kết thúc
        open_braces = json_str.count("{") - json_str.count("}")
        if open_braces > 0:
            json_str += "}" * open_braces
            print(f"[Parser] Added {open_braces} missing closing braces '}}'")

        # Bước 4: Xóa trailing commas
        json_str = re.sub(r",(\s*[}\]])", r"\1", json_str)

        if len(json_str) != original_len:
            print(f"[Parser] Repaired: {original_len} → {len(json_str)} chars")

        return json_str

    def create_fallback_questions(self, num: int = 1) -> Dict:
        """Tạo JSON fallback khi không thể parse — tránh crash hoàn toàn."""
        return {
            "questions": [
                {
                    "question_number": i + 1,
                    "question_text": f"Câu hỏi {i + 1} không thể tạo do lỗi parsing. Vui lòng thử lại.",
                    "suggested_answer": "Xin lỗi, đã có lỗi trong quá trình tạo câu hỏi.",
                }
                for i in range(num)
            ]
        }
