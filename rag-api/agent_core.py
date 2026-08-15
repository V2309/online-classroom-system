# agent_core.py — DEPRECATED
#
# File này đã được thay thế bởi kiến trúc RAG hiện đại tại:
#
#   config.py                      ← cấu hình tập trung
#   ingestion/loaders.py           ← load_documents()
#   ingestion/cleaners.py          ← preprocess_text()
#   ingestion/chunkers.py          ← split_documents()
#   indexing/embeddings.py         ← EmbeddingFactory
#   indexing/vector_store.py       ← create_vector_store()
#   retrieval/search_engine.py     ← create_hybrid_retriever()
#   retrieval/query_router.py      ← QueryRouter (mới)
#   retrieval/query_transform.py   ← QueryTransformer (mới)
#   post_processing/reranker.py    ← CrossEncoderReranker (mới)
#   post_processing/context_compress.py ← ContextCompressor (mới)
#   generation/llm_factory.py      ← get_generation_llm()
#   generation/output_parsers.py   ← extract_json / parse_json logic
#   pipelines/ingest_pipeline.py   ← IngestPipeline (load→clean→chunk→embed→index)
#   pipelines/qa_pipeline.py       ← QAPipeline + create_agent_executor() + generate_essay_questions_logic()
#
# File này chỉ còn để tham khảo và KHÔNG được import trực tiếp nữa.
# Xem index.py để biết cách sử dụng kiến trúc mới.

raise ImportError(
    "agent_core.py đã bị deprecated. "
    "Hãy import từ pipelines.ingest_pipeline và pipelines.qa_pipeline."
)