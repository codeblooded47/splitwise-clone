from abc import ABC, abstractmethod
from typing import Any, Dict, TypeVar, Generic, Optional
from pydantic import BaseModel

T = TypeVar('T')

class BaseModelMCP(ABC):
    @abstractmethod
    async def process(self, data: Any) -> Any:
        pass

class BaseController(Generic[T]):
    def __init__(self, model: BaseModelMCP):
        self.model = model

    async def handle(self, data: T) -> Dict[str, Any]:
        try:
            result = await self.model.process(data)
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

class BasePresenter:
    @staticmethod
    def format_response(data: Any) -> Dict[str, Any]:
        return {"response": data}
