from typing import Dict, List, Optional
import os
from openai import OpenAI
from sqlalchemy.orm import Session
from app.models import User, Group, Expense, UserGroupAssociation
from app.ai.base import BaseModelMCP

class ChatModel(BaseModelMCP):
    def __init__(self, db: Session):
        self.db = db
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.system_prompt = """
       You are a helpful assistant for a Splitwise-like expense sharing app.

You can help users with:
- Checking balances and debts
- Explaining expense splits
- Finding specific expenses
- Understanding group expenses

You must **only** respond to queries related to the expense sharing app.
Do **not** answer or engage in any questions or conversations outside of this scope, including but not limited to:
- General knowledge or trivia
- Personal advice or opinions
- Programming, technical help, or math problems
- Entertainment, politics, or current events

If a query is not related to expense sharing, respond with:
"I'm only able to assist with expense sharing-related questions like balances, splits, and group expenses."

        """

    async def _get_user_context(self, user_id: int) -> str:
        """Get relevant context about the user for the LLM"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return ""

        context = f"User: {user.name} (ID: {user_id})\n"

        # Get user's groups
        groups = self.db.query(Group).join(UserGroupAssociation).filter(
            UserGroupAssociation.user_id == user_id
        ).all()

        if groups:
            context += "\nUser's Groups:\n"
            for group in groups:
                # Get group members (filter out the current user)
                members = [user.name for user in group.members if user.id != user_id]
                context += f"- {group.name} (ID: {group.id}): {', '.join(members)}\n"

                # Get group expenses summary
                expenses = self.db.query(Expense).filter(
                    Expense.group_id == group.id
                ).order_by(Expense.created_at.desc()).limit(3).all()

                if expenses:
                    context += f"  Recent Expenses:\n"
                    for exp in expenses:
                        paid_by = self.db.query(User).filter(
                            User.id == exp.paid_by
                        ).first()
                        paid_by_name = paid_by.name if paid_by else f"User {exp.paid_by}"
                        context += f"  - {exp.description}: ${exp.amount:.2f} by {paid_by_name}\n"

        return context

    async def process(self, data: Dict) -> str:
        """Process chat message with OpenAI API"""
        try:
            messages = data.get("messages", [])
            user_id = data.get("user_id")

            if not messages or not user_id:
                raise ValueError("Missing required fields: messages or user_id")

            # Get user context
            context = await self._get_user_context(user_id)

            # Prepare system message with context
            system_message = {
                "role": "system",
                "content": self.system_prompt + "\n\nUser Context:\n" + context
            }

            # Prepare messages for OpenAI
            openai_messages = [system_message] + messages

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=openai_messages,
                temperature=0.7,
                max_tokens=500,
                n=1
            )

            return response.choices[0].message.content

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            return f"Sorry, I encountered an error. Please try again later.\n\nError details:\n{str(e)}\n\n{error_details}"
