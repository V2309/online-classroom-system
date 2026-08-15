# ingestion/loaders.py
# Đọc dữ liệu từ nhiều nguồn: PDF, DOCX, URL
# Tách từ agent_core.load_documents() — nay được mở rộng và chuẩn hóa.

import os
import tempfile
from typing import List, Union
from pathlib import Path

from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader


class DocumentLoader:
    """
    Class tổng hợp để đọc tài liệu từ nhiều nguồn.
    Hỗ trợ: PDF (file/bytes), DOCX, URL.
    """

    def load_from_sources(self, sources: List) -> List[Document]:
        """
        Nhận list sources đa dạng (UploadFile, file path string, URL string).
        Trả về list LangChain Documents với metadata đầy đủ.
        """
        docs: List[Document] = []
        temp_files: List[str] = []

        try:
            for source in sources:
                if isinstance(source, str):
                    # URL hoặc file path
                    if source.startswith("http://") or source.startswith("https://"):
                        loaded = self._load_url(source)
                    else:
                        loaded = self._load_file_path(source)
                    docs.extend(loaded)
                else:
                    # UploadFile (FastAPI) — có .name và .getbuffer()
                    tmp_path, loaded = self._load_upload_file(source)
                    temp_files.append(tmp_path)
                    docs.extend(loaded)
        finally:
            for f in temp_files:
                if os.path.exists(f):
                    os.remove(f)

        return docs

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _load_url(self, url: str) -> List[Document]:
        """Tải trang web."""
        print(f"[Loader] Loading URL: {url}")
        loader = WebBaseLoader(url)
        docs = loader.load()
        for doc in docs:
            doc.metadata["source_type"] = "url"
            doc.metadata["source"] = url
        return docs

    def _load_file_path(self, path: str) -> List[Document]:
        """Tải file từ đường dẫn hệ thống."""
        ext = Path(path).suffix.lower()
        print(f"[Loader] Loading file path: {path} (ext={ext})")

        if ext == ".pdf":
            return self._load_pdf(path, filename=Path(path).name)
        elif ext in (".docx", ".doc"):
            return self._load_docx(path, filename=Path(path).name)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

    def _load_upload_file(self, upload_file) -> tuple:
        """Tải UploadFile (FastAPI) — lưu tạm rồi đọc."""
        filename = upload_file.name
        ext = Path(filename).suffix.lower()
        tmp_path = os.path.join(".", filename)

        print(f"[Loader] Saving UploadFile to temp: {tmp_path}")
        with open(tmp_path, "wb") as f:
            f.write(upload_file.getbuffer())

        if ext == ".pdf":
            docs = self._load_pdf(tmp_path, filename=filename)
        elif ext in (".docx", ".doc"):
            docs = self._load_docx(tmp_path, filename=filename)
        else:
            raise ValueError(f"Unsupported file type: {filename}")

        return tmp_path, docs

    def _load_pdf(self, path: str, filename: str) -> List[Document]:
        """Load PDF với PyPDFLoader, thêm metadata trang."""
        loader = PyPDFLoader(path, extract_images=False)
        pages = loader.load()

        for i, doc in enumerate(pages):
            doc.metadata.update({
                "source_type": "pdf",
                "source_file": filename,
                "page_number": i + 1,
                "total_pages": len(pages),
                "content_length": len(doc.page_content),
            })

        print(f"[Loader] PDF '{filename}': {len(pages)} pages loaded")
        return pages

    def _load_docx(self, path: str, filename: str) -> List[Document]:
        """Load DOCX với python-docx, trả về 1 document chứa toàn bộ text."""
        import docx as python_docx

        doc_obj = python_docx.Document(path)
        full_text = "\n\n".join(
            para.text for para in doc_obj.paragraphs if para.text.strip()
        )

        doc = Document(
            page_content=full_text,
            metadata={
                "source_type": "docx",
                "source_file": filename,
                "page_number": 1,
                "total_pages": 1,
                "content_length": len(full_text),
            }
        )
        print(f"[Loader] DOCX '{filename}': {len(full_text)} chars loaded")
        return [doc]
