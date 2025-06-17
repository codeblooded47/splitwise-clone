from typing import Dict, Any, Optional
from app import schemas
from app.ai.base import BaseController
from app.ai.chat.model import ChatModel
from app.ai.chat.presenter import ChatPresenter

class ChatController:
    def __init__(self, db):
        self.model = ChatModel(db)
        self.presenter = ChatPresenter()

    async def handle_chat(self, request: schemas.ChatRequest) -> Dict[str, Any]:
        try:
            if not request.messages:
                raise ValueError("No messages provided in the request")

            if not request.user_id:
                raise ValueError("No user_id provided in the request")

            # Convert Pydantic model to dict for the model
            chat_data = {
                "messages": [{"role": msg.role.value, "content": str(msg.content) or ""}
                            for msg in request.messages],
                "user_id": request.user_id
            }

            # Process with model
            response = await self.model.process(chat_data)

            if not response or not isinstance(response, str):
                raise ValueError("Invalid response from the model")

            # Format response with metadata
            return {
                "success": True,
                "data": {
                    "message": response,
                    "metadata": {
                        "context_used": ["group_balance", "recent_expenses"],
                        "model": "gpt-3.5-turbo"
                    }
                }
            }

        except ValueError as ve:
            return {
                "success": False,
                "error": f"Validation error: {str(ve)}"
            }
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            return {
                "success": False,
                "error": f"Error processing chat: {str(e)}",
                "details": error_details
            }
