# pipelines/qa_pipeline.py
# Luồng hỏi-đáp (RAG QA) hoàn chỉnh:
#   Query → QueryRouter → QueryTransform → HybridSearch → Reranker → ContextCompress → LLM → Answer
#
# Cũng cung cấp method để tạo LangChain Agent (dùng cho chat endpoint).

from typing import List, Optional, Tuple
from langchain_core.documents import Document

from retrieval.query_router import QueryRouter, QueryRoute
from retrieval.query_transform import QueryTransformer
from retrieval.search_engine import HybridSearchEngine
from post_processing.reranker import CrossEncoderReranker
from post_processing.context_compress import ContextCompressor
from generation.llm_factory import LLMFactory
from generation.prompts import AGENT_SYSTEM_PROMPT
from config import rag_config

# LangChain Agent imports
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools.retriever import create_retriever_tool
from langchain_core.prompts import ChatPromptTemplate


class QAPipeline:
    """
    Pipeline hỏi-đáp RAG hoàn chỉnh.

    Cung cấp 2 mode:
        1. build_agent()  → LangChain AgentExecutor (dùng cho /chat endpoint, có tool calling)
        2. answer()       → Trả lời trực tiếp không qua agent (đơn giản hơn, nhanh hơn)

    Luồng của build_agent():
        Query → QueryRouter → [document_search tool / web_search tool] → LLM Agent → Answer

    Luồng của answer():
        Query → QueryTransform → HybridSearch → Reranker → ContextCompress → LLM → Answer
    """

    def __init__(
        self,
        ingest_result=None,   # IngestResult từ IngestPipeline
        system_prompt: str = None,
    ):
        """
        Args:
            ingest_result: Kết quả từ IngestPipeline (chứa vector_store, chunks).
            system_prompt: Override system prompt. Mặc định dùng AGENT_SYSTEM_PROMPT.
        """
        self._ingest_result = ingest_result
        self._system_prompt = system_prompt or AGENT_SYSTEM_PROMPT

        # Lazy-initialized components
        self._search_engine: Optional[HybridSearchEngine] = None
        self._reranker: Optional[CrossEncoderReranker] = None
        self._compressor: Optional[ContextCompressor] = None
        self._llm = None
        self._agent_executor: Optional[AgentExecutor] = None

    # ------------------------------------------------------------------
    # Mode 1: LangChain Agent (recommended for /chat endpoint)
    # ------------------------------------------------------------------

    def build_agent(self, ingest_result=None) -> AgentExecutor:
        """
        Tạo LangChain AgentExecutor với:
            - document_search tool (hybrid retriever)
            - web_search tool (Tavily)

        Args:
            ingest_result: Override ingest_result nếu muốn. Nếu None, dùng từ __init__.

        Returns:
            AgentExecutor đã được compile và sẵn sàng invoke.
        """
        if ingest_result is not None:
            self._ingest_result = ingest_result

        if self._ingest_result is None:
            raise ValueError("ingest_result is required to build agent.")

        # 1. Tạo Hybrid Search Engine
        search_engine = self._get_search_engine()
        retriever = search_engine.as_langchain_retriever()

        # 2. Tạo document_search tool
        document_tool = create_retriever_tool(
            retriever,
            "document_search",
            """⭐ CÔNG CỤ QUAN TRỌNG NHẤT - LUÔN DÙNG TRƯỚC TIÊN ⭐
            
Tìm kiếm thông tin trong tài liệu học thuật đã được tải lên (PDF, slide, giáo trình).

🚨 QUY TẮC BẮT BUỘC:
- PHẢI sử dụng TRƯỚC TIÊN cho MỌI câu hỏi về kiến thức, khái niệm, định nghĩa
- KHÔNG ĐƯỢC bỏ qua công cụ này với bất kỳ lý do gì

Công cụ sử dụng Hybrid Search (vector + keyword) để tìm kiếm chính xác nhất.""",
        )

        # 3. Tạo web_search tool
        web_tool = TavilySearchResults(
            k=3,
            name="web_search",
            description="""🚫 CHỈ SỬ DỤNG SAU KHI DOCUMENT_SEARCH THẤT BẠI 🚫
            
⚠️ KHÔNG ĐƯỢC dùng làm công cụ đầu tiên cho câu hỏi học thuật
⚠️ CHỈ dùng KHI document_search không tìm thấy thông tin liên quan

Hữu ích cho:
- Tin tức mới, cập nhật gần đây
- Thông tin ngoài phạm vi tài liệu đã tải""",
        )

        tools = [document_tool, web_tool]

        # 4. LLM
        llm = self._get_llm()

        # 5. Prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", self._system_prompt),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])

        # 6. Tạo agent
        agent = create_tool_calling_agent(llm, tools, prompt)

        self._agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=10,
            max_execution_time=90,
            return_intermediate_steps=False,
            early_stopping_method="force",
        )

        print(f"[QAPipeline] Agent built with {len(tools)} tools")
        return self._agent_executor

    # ------------------------------------------------------------------
    # Mode 2: Direct RAG answer (không dùng Agent)
    # ------------------------------------------------------------------

    async def answer(self, query: str, chat_history: List = None) -> Tuple[str, List[Document]]:
        """
        Trả lời câu hỏi bằng RAG pipeline trực tiếp (không qua Agent).
        Nhanh hơn Agent nhưng không có tool-calling flexibility.

        Returns:
            (answer_text, source_documents)
        """
        # 1. Query Transform
        transformer = QueryTransformer(llm=self._get_llm())
        queries = transformer.transform(query)

        # 2. Hybrid Search (multi-query nếu có expand)
        search_engine = self._get_search_engine()
        if len(queries) > 1:
            docs = search_engine.multi_query_search(queries)
        else:
            docs = search_engine.search(query)

        # 3. Rerank
        reranker = self._get_reranker()
        docs = reranker.rerank(query, docs)

        # 4. Context Compression
        compressor = self._get_compressor()
        docs = compressor.filter_by_similarity(query, docs)

        # 5. Format context
        context = compressor.format_context(docs)

        # 6. Generate answer
        llm = self._get_llm()
        response = await llm.ainvoke(
            f"Dựa vào context sau, hãy trả lời câu hỏi:\n\nContext:\n{context}\n\nCâu hỏi: {query}"
        )

        return response.content, docs

    # ------------------------------------------------------------------
    # Essay Generation
    # ------------------------------------------------------------------

    async def generate_essay_questions(
        self,
        num_questions: int,
        context: str = None,
        topic: str = None,
    ) -> List[dict]:
        """
        Tạo câu hỏi tự luận — tích hợp logic từ agent_core.generate_essay_questions_logic().

        Args:
            num_questions: Số câu hỏi cần tạo.
            context: Nội dung tài liệu (RAG mode).
            topic: Chủ đề (Topic mode).

        Returns:
            List các câu hỏi dạng dict.
        """
        from generation.prompts import ESSAY_GENERATION_PROMPT_RAG, ESSAY_GENERATION_PROMPT_TOPIC
        from generation.output_parsers import JSONOutputParser
        from config import rag_config

        cfg = rag_config.generation
        max_retries = cfg.essay_max_retries
        llm = LLMFactory().get_llm(task="essay")
        parser = JSONOutputParser()

        # Chọn prompt theo mode
        if topic:
            prompt_str = ESSAY_GENERATION_PROMPT_TOPIC.format(
                num_questions=num_questions, topic=topic
            )
        elif context:
            if len(context) > cfg.essay_max_context_chars:
                context = context[:cfg.essay_max_context_chars] + "\n... (Nội dung đã được rút gọn)"
                print(f"[QAPipeline] Context truncated to {cfg.essay_max_context_chars} chars")
            prompt_str = ESSAY_GENERATION_PROMPT_RAG.format(
                num_questions=num_questions, context=context
            )
        else:
            raise ValueError("Must provide either 'context' or 'topic'.")

        # Retry loop
        for attempt in range(1, max_retries + 1):
            try:
                print(f"[QAPipeline] Essay generation attempt {attempt}/{max_retries}...")
                response = await llm.ainvoke(prompt_str)
                raw = response.content if hasattr(response, "content") else str(response)
                questions = parser.parse_questions(raw, expected_count=num_questions)
                print(f"[QAPipeline] ✅ Generated {len(questions)} essay questions")
                return questions
            except Exception as e:
                print(f"[QAPipeline] Attempt {attempt} failed: {e}")
                if attempt >= max_retries:
                    raise ValueError(
                        f"Cannot generate essay questions after {max_retries} attempts: {e}"
                    )

    # ------------------------------------------------------------------
    # Lazy loaders
    # ------------------------------------------------------------------

    def _get_search_engine(self) -> HybridSearchEngine:
        if self._search_engine is None:
            if self._ingest_result is None:
                raise RuntimeError("No ingest_result. Run IngestPipeline first.")
            self._search_engine = HybridSearchEngine().build(
                vector_store=self._ingest_result.vector_store,
                documents=self._ingest_result.chunks,
            )
        return self._search_engine

    def _get_reranker(self) -> CrossEncoderReranker:
        if self._reranker is None:
            self._reranker = CrossEncoderReranker()
        return self._reranker

    def _get_compressor(self) -> ContextCompressor:
        if self._compressor is None:
            self._compressor = ContextCompressor()
        return self._compressor

    def _get_llm(self):
        if self._llm is None:
            self._llm = LLMFactory().get_llm(task="chat")
        return self._llm
