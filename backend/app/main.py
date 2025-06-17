from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app import models, schemas
from app.database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
from app.ai.chat.controller import ChatController

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Users
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Groups
@app.get("/groups/", response_model=List[schemas.Group])
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    groups = db.query(models.Group).offset(skip).limit(limit).all()
    return groups

@app.put("/groups/{group_id}/add_member", response_model=schemas.Group)
def add_group_member(
    group_id: int,
    user_data: schemas.GroupUpdate,
    db: Session = Depends(get_db)
):
    # Check if group exists
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check if user exists
    db_user = db.query(models.User).filter(models.User.id == user_data.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is already in the group
    if db_user in db_group.members:
        raise HTTPException(status_code=400, detail="User is already a member of this group")

    # Add user to group
    db_group.members.append(db_user)
    db.commit()
    db.refresh(db_group)

    # Return the updated group with members loaded
    return db.query(models.Group)\
        .options(joinedload(models.Group.members))\
        .filter(models.Group.id == group_id)\
        .first()
@app.post("/groups/", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    # Check if all users exist
    users = db.query(models.User).filter(models.User.id.in_(group.user_ids)).all()
    if len(users) != len(group.user_ids):
        raise HTTPException(status_code=400, detail="One or more users not found")

    # Create group
    db_group = models.Group(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)

    # Add users to group
    for user in users:
        db_group.members.append(user)
    db.commit()
    db.refresh(db_group)

    return db_group

@app.get("/groups/{group_id}", response_model=schemas.Group)
def read_group(group_id: int, db: Session = Depends(get_db)):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group

# Expenses
@app.post("/groups/{group_id}/expenses", response_model=schemas.Expense)
def create_expense(
    group_id: int,
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db)
):
    # Check if group exists
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check if paid_by user is in the group
    paid_by_user = db.query(models.User).filter(
        models.User.id == expense.paid_by,
        models.User.groups.any(id=group_id)
    ).first()
    if not paid_by_user:
        raise HTTPException(status_code=400, detail="Payer is not a member of the group")

    # Create expense
    from datetime import datetime

    # Create the expense
    db_expense = models.Expense(
        description=expense.description,
        amount=expense.amount,
        group_id=group_id,
        paid_by=expense.paid_by,
        split_type=expense.split_type
    )
    db.add(db_expense)
    db.commit()

    # Load the expense with relationships
    db_expense = db.query(models.Expense)\
        .options(
            joinedload(models.Expense.paid_by_user),
            joinedload(models.Expense.shares).joinedload(models.ExpenseShare.user)
        )\
        .filter(models.Expense.id == db_expense.id)\
        .first()

    # Process shares
    if expense.split_type == schemas.SplitType.EQUAL:
        share_amount = round(expense.amount / len(db_group.members), 2)
        for member in db_group.members:
            share = models.ExpenseShare(
                expense_id=db_expense.id,
                user_id=member.id,
                amount=share_amount
            )
            db.add(share)
    else:  # PERCENTAGE
        total_percentage = sum(share.percentage for share in expense.shares)
        if abs(total_percentage - 100.0) > 0.01:  # Allow for floating point imprecision
            raise HTTPException(status_code=400, detail="Percentages must sum to 100")

        for share in expense.shares:
            share_amount = round(expense.amount * (share.percentage / 100), 2)
            db_share = models.ExpenseShare(
                expense_id=db_expense.id,
                user_id=share.user_id,
                amount=share_amount,
                percentage=share.percentage
            )
            db.add(db_share)

    db.commit()
    db.refresh(db_expense)
    return db_expense

# Balances
@app.get("/groups/{group_id}/balances", response_model=List[schemas.GroupBalance])
def get_group_balances(group_id: int, db: Session = Depends(get_db)):
    # Get all expenses for the group
    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()

    # Calculate net balances for each user
    balances = {}
    for expense in expenses:
        # Add to the paid_by user's balance
        if expense.paid_by not in balances:
            balances[expense.paid_by] = 0
        balances[expense.paid_by] += expense.amount

        # Subtract each share from the respective users
        for share in expense.shares:
            if share.user_id not in balances:
                balances[share.user_id] = 0
            balances[share.user_id] -= share.amount

    # Convert to list of GroupBalance objects
    result = []
    users = list(balances.keys())
    for i in range(len(users)):
        for j in range(i + 1, len(users)):
            user1 = users[i]
            user2 = users[j]
            net = balances[user1] - balances[user2]

            if net > 0.01:  # user2 owes user1
                result.append(schemas.GroupBalance(
                    from_user_id=user2,
                    to_user_id=user1,
                    amount=abs(net)
                ))
            elif net < -0.01:  # user1 owes user2
                result.append(schemas.GroupBalance(
                    from_user_id=user1,
                    to_user_id=user2,
                    amount=abs(net)
                ))

    return result

@app.get("/users/{user_id}/balances", response_model=List[schemas.Balance])
def get_user_balances(user_id: int, db: Session = Depends(get_db)):
    # Get all expenses where user is involved (either paid or has a share)
    expenses = db.query(models.Expense).join(models.Expense.shares).filter(
        (models.Expense.paid_by == user_id) |
        (models.ExpenseShare.user_id == user_id)
    ).distinct().all()

    # Calculate net balance for each group
    group_balances = {}
    for expense in expenses:
        if expense.group_id not in group_balances:
            group_balances[expense.group_id] = 0

        if expense.paid_by == user_id:
            group_balances[expense.group_id] += expense.amount

        # Find user's share in this expense
        for share in expense.shares:
            if share.user_id == user_id:
                group_balances[expense.group_id] -= share.amount

    # Convert to list of Balance objects
    return [schemas.Balance(user_id=group_id, amount=amount)
            for group_id, amount in group_balances.items()]

# Chat Endpoint
@app.post(
    "/api/chat",
    response_model=schemas.ChatResponse,
    summary="Chat with AI Assistant",
    responses={
        200: {"description": "Successful response from the AI assistant"},
        400: {"description": "Invalid request format or missing required fields"},
        500: {"description": "Internal server error"}
    },
    description="""
    Chat with the AI assistant to get information about your expenses, groups, and balances.

    Example request:
    ```json
    {
        "user_id": 1,
        "messages": [
            {"role": "user", "content": "How much do I owe in group 1?"}
        ]
    }
    """
)
async def chat_with_ai(
    chat_request: schemas.ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Process a chat message and return an AI-generated response.

    - **user_id**: The ID of the user sending the message (required)
    - **messages**: List of messages in the conversation (at least one message required)
    """
    try:
        # Initialize chat controller
        chat_controller = ChatController(db)

        # Process the chat request
        response = await chat_controller.handle_chat(chat_request)

        if not response.get("success"):
            error_detail = response.get("error", "Unknown error occurred")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )

        # Ensure we have the expected response structure
        if "data" not in response or "message" not in response["data"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid response format from the chat service"
            )

        return schemas.ChatResponse(
            message=response["data"]["message"],
            metadata=response["data"].get("metadata", {})
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
