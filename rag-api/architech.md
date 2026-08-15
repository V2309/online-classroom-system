rag/
├── pipelines/               # Nơi "lắp ráp" các module lại thành luồng hoàn chỉnh
│   ├── ingest_pipeline.py   # Luồng xử lý file thô -> Cắt chunk -> Nhúng vector -> Lưu DB
│   └── qa_pipeline.py       # Luồng nhận câu hỏi -> Tìm kiếm -> Rerank -> Trả lời
│
├── ingestion/               # (Pre-Retrieval) Xử lý đầu vào
│   ├── loaders.py           # Các class đọc dữ liệu từ PDF, Word, URL, Notion...
│   ├── cleaners.py          # Làm sạch dữ liệu: xóa ký tự lạ, HTML tags, khoảng trắng thừa
│   └── chunkers.py          # Logic cắt đoạn văn bản (Recursive, Semantic chunking)
│
├── indexing/                # Nhúng và lưu trữ
│   ├── embeddings.py        # Cấu hình gọi các mô hình nhúng (OpenAI, BGE, HuggingFace)
│   └── vector_store.py      # Interface chuẩn hóa để kết nối với Vector DB (pgvector, Qdrant...)
│
├── retrieval/               # (Advanced Retrieval) Tìm kiếm và truy xuất
│   ├── query_router.py      # Phân loại câu hỏi để chọn đúng nguồn dữ liệu/chỉ mục
│   ├── query_transform.py   # Viết lại câu hỏi, phân tách câu hỏi (Query Expansion, HyDE)
│   └── search_engine.py     # Logic tìm kiếm cốt lõi (như Hybrid Search kết hợp Vector + Keyword)
│
├── post_processing/         # (Post-Retrieval) Xử lý ngữ cảnh sau khi tìm
│   ├── reranker.py          # Chấm điểm lại kết quả tìm kiếm (VD: dùng Cross-encoder)
│   └── context_compress.py  # Lọc nhiễu, cắt bỏ các đoạn thừa trong kết quả tìm được
│
├── generation/              # (Generation) Sinh câu trả lời
│   ├── llm_factory.py       # Khởi tạo và quản lý các mô hình LLM (GPT, Claude, Gemini...)
│   ├── prompts.py           # Quản lý các Prompt Templates (System prompt, Few-shot prompt)
│   └── output_parsers.py    # Ép kiểu dữ liệu trả về từ LLM (VD: bắt buộc trả về JSON)
│
└── config.py                # Cấu hình riêng cho RAG (chunk_size, top_k, ngưỡng similarity...)