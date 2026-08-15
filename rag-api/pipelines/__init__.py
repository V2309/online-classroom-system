# pipelines/__init__.py
from .ingest_pipeline import IngestPipeline
from .qa_pipeline import QAPipeline

__all__ = ["IngestPipeline", "QAPipeline"]
