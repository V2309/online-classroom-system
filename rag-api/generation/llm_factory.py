# generation/llm_factory.py
# Khởi tạo và quản lý các mô hình LLM.
# Factory pattern: thay đổi provider/model tại config.py — không cần sửa code logic.
#
# Hỗ trợ:
#   - Google Gemini (default)
#   - OpenAI GPT (nếu cần)

from typing import Literal
from config import rag_config


class LLMFactory:
    """
    Factory để tạo LLM theo task và provider.

    Ví dụ sử dụng:
        factory = LLMFactory()
        chat_llm = factory.get_llm(task="chat")
        essay_llm = factory.get_llm(task="essay")
        openai_llm = factory.get_llm(provider="openai", task="chat")
    """

    def get_llm(
        self,
        task: Literal["chat", "essay"] = "chat",
        provider: str = "google",
    ):
        """
        Trả về LangChain LLM object đã được cấu hình.

        Args:
            task: "chat" (low temp) hoặc "essay" (higher temp, longer context)
            provider: "google" (Gemini) hoặc "openai" (GPT)
        """
        if provider == "google":
            return self._get_google_llm(task)
        elif provider == "openai":
            return self._get_openai_llm(task)
        else:
            raise ValueError(f"Unknown LLM provider: '{provider}'. Use 'google' or 'openai'.")

    # ------------------------------------------------------------------
    # Providers
    # ------------------------------------------------------------------

    def _get_google_llm(self, task: str):
        from langchain_google_genai import ChatGoogleGenerativeAI

        cfg = rag_config.generation

        if task == "chat":
            params = dict(
                model=cfg.chat_model,
                temperature=cfg.chat_temperature,
                max_tokens=cfg.chat_max_tokens,
                top_p=cfg.chat_top_p,
                max_retries=cfg.chat_max_retries,
                request_timeout=cfg.chat_timeout,
            )
        elif task == "essay":
            params = dict(
                model=cfg.essay_model,
                temperature=cfg.essay_temperature,
                max_tokens=cfg.essay_max_tokens,
                top_p=cfg.essay_top_p,
                max_retries=cfg.essay_max_retries,
                timeout=cfg.essay_timeout,
            )
        else:
            raise ValueError(f"Unknown task: '{task}'. Use 'chat' or 'essay'.")

        import os
        params["google_api_key"] = os.getenv("GOOGLE_API_KEY")

        llm = ChatGoogleGenerativeAI(**params)
        print(f"[LLMFactory] Google Gemini '{params['model']}' initialized (task={task})")
        return llm

    def _get_openai_llm(self, task: str):
        from langchain_openai import ChatOpenAI

        cfg = rag_config.generation

        if task == "chat":
            params = dict(
                model="gpt-4o-mini",
                temperature=cfg.chat_temperature,
                max_tokens=cfg.chat_max_tokens,
                max_retries=cfg.chat_max_retries,
                timeout=cfg.chat_timeout,
            )
        elif task == "essay":
            params = dict(
                model="gpt-4o",
                temperature=cfg.essay_temperature,
                max_tokens=cfg.essay_max_tokens,
                max_retries=cfg.essay_max_retries,
                timeout=cfg.essay_timeout,
            )
        else:
            raise ValueError(f"Unknown task: '{task}'.")

        llm = ChatOpenAI(**params)
        print(f"[LLMFactory] OpenAI '{params['model']}' initialized (task={task})")
        return llm
