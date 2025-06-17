from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum

class SplitType(str, enum.Enum):
    EQUAL = "equal"
    PERCENTAGE = "percentage"

class UserGroupAssociation(Base):
    __tablename__ = "user_group_association"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    groups = relationship("Group", secondary="user_group_association", back_populates="members")
    expenses_paid = relationship("Expense", back_populates="paid_by_user")
    expense_shares = relationship("ExpenseShare", back_populates="user")

class Group(Base):
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    members = relationship("User", secondary="user_group_association", back_populates="groups")
    expenses = relationship("Expense", back_populates="group")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    group_id = Column(Integer, ForeignKey("groups.id"))
    paid_by = Column(Integer, ForeignKey("users.id"))
    split_type = Column(Enum(SplitType))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    group = relationship("Group", back_populates="expenses")
    paid_by_user = relationship("User", back_populates="expenses_paid")
    shares = relationship("ExpenseShare", back_populates="expense")

class ExpenseShare(Base):
    __tablename__ = "expense_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    percentage = Column(Float, nullable=True)
    
    expense = relationship("Expense", back_populates="shares")
    user = relationship("User", back_populates="expense_shares")
