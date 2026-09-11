from abc import ABC, abstractmethod
import fitz
from typing import Dict, Any, Optional

class BaseServiceHandler(ABC):
    """
    Abstract Base Class for DocuMorph Service Handlers.
    Enforces the Strategy Pattern: each feature is isolated with zero blast radius.
    """
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator

    @abstractmethod
    def process(
        self,
        doc: fitz.Document,
        config: Dict[str, Any],
        temp_dir: str,
        base_name: str,
        timestamp: int
    ) -> str:
        """
        Executes the feature service workflow.
        Returns the absolute path to the generated output file.
        """
        pass
