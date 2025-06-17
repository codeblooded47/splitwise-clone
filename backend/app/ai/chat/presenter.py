from typing import Dict, Any
from app.schemas import ChatResponse
from app.ai.base import BasePresenter

class ChatPresenter(BasePresenter):
    @staticmethod
    def format_response(data: Any) -> Dict[str, Any]:
        if isinstance(data, dict) and "success" in data:
            return data

        return {
            "success": True,
            "data": {
                "message": data,
                "type": "ai_response"
            }
        }

    @staticmethod
    def format_error(error: str) -> Dict[str, Any]:
        return {
            "success": False,
            "error": error
        }
