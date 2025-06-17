from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ChatMessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class ChatMessage(BaseModel):
    role: ChatMessageRole = Field(..., description="The role of the message sender")
    content: str = Field(..., description="The content of the message")

class ChatRequest(BaseModel):
    user_id: int = Field(..., description="The ID of the user sending the message")
    messages: List[ChatMessage] = Field(..., description="List of messages in the conversation")

class ChatResponse(BaseModel):
    message: str = Field(..., description="The AI's response message")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata about the response")

class SplitType(str, Enum):
    EQUAL = "equal"
    PERCENTAGE = "percentage"

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    user_ids: List[int]

class GroupUpdate(BaseModel):
    user_id: int  # The user ID to add to the group

class Group(GroupBase):
    id: int
    members: List[User] = []

    class Config:
        orm_mode = True

class ExpenseShareBase(BaseModel):
    user_id: int
    amount: Optional[float] = None
    percentage: Optional[float] = None

class ExpenseShareCreate(ExpenseShareBase):
    pass

class ExpenseShare(ExpenseShareBase):
    id: int

    class Config:
        orm_mode = True

class ExpenseBase(BaseModel):
    description: str
    amount: float
    paid_by: int
    split_type: SplitType
    shares: List[ExpenseShareCreate]

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    group_id: int
    paid_by: int
    created_at: Optional[datetime] = None
    paid_by_user: Optional[User] = None
    shares: List[ExpenseShare] = []

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class Balance(BaseModel):
    user_id: int
    amount: float

    class Config:
        orm_mode = True

class GroupBalance(BaseModel):
    from_user_id: int
    to_user_id: int
    amount: float

    class Config:
        orm_mode = True
