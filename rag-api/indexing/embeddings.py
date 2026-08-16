# indexing/embeddings.py
# Cấu hình và khởi tạo các mô hình nhúng (embedding models).
# Factory pattern: dễ swap provider mà không sửa code logic.

from config import rag_config


class EmbeddingFactory:
    """
    Factory để tạo embedding model theo provider.
    Hỗ trợ: OpenAI, Google Generative AI.

    Ví dụ sử dụng:
        factory = EmbeddingFactory()
        embeddings = factory.get_embeddings()           # Dùng config mặc định
        embeddings = factory.get_embeddings("google")   # Override provider
    """

    def get_embeddings(self, provider: str = None):
        """
        Trả về LangChain Embeddings object theo provider.

        Args:
            provider: "openai" hoặc "google". Nếu None, dùng giá trị trong config.
        """
        import os
        cfg = rag_config.embedding
        selected = provider or cfg.provider

        # Tự động chọn provider dựa theo API key có sẵn
        if selected == "openai" and not os.getenv("OPENAI_API_KEY"):
            if os.getenv("GOOGLE_API_KEY"):
                selected = "google"

        if selected == "openai":
            return self._get_openai_embeddings(cfg)
        elif selected == "google":
            return self._get_google_embeddings(cfg)
        else:
            raise ValueError(f"Unknown embedding provider: '{selected}'. Use 'openai' or 'google'.")

    # ------------------------------------------------------------------
    # Providers
    # ------------------------------------------------------------------

    def _get_openai_embeddings(self, cfg):
        from langchain_community.embeddings import OpenAIEmbeddings
        print(f"[Embeddings] Using OpenAI: {cfg.openai_model} (dim={cfg.openai_dimensions})")
        return OpenAIEmbeddings(
            model=cfg.openai_model,
            dimensions=cfg.openai_dimensions,
        )

    def _get_google_embeddings(self, cfg):
        import os
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        api_key = os.getenv("GOOGLE_API_KEY")
        print(f"[Embeddings] Using Google: {cfg.google_model}")
        return GoogleGenerativeAIEmbeddings(
            model=cfg.google_model,
            google_api_key=api_key,
        )
