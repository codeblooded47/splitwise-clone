# Splitwise Clone

![image](https://github.com/user-attachments/assets/30ab8d46-0946-4dfd-8b79-1f55502c2e42)


A simplified clone of Splitwise built with FastAPI, PostgreSQL, and React.

## Features

### Backend (FastAPI)
- User management
- Group management
- Expense tracking with equal and percentage-based splits
- Balance tracking
- RESTful API
- AI-powered chat assistant

### Frontend (React)
- Modern, responsive UI
- Real-time updates
- Interactive expense management
- Group overview and management
- Chat interface with AI assistant

## Prerequisites

- Docker and Docker Compose
- OpenAI API key (for chat functionality)

## Getting Started

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd splitwise-clone
   ```

2. Start the services:

   ```bash
   docker-compose up --build
   ```

3. Create a `.env` file in the project root with your OpenAI API key:
   ```bash
   cp .env.example .env
   # Now edit .env and add your OpenAI API key
   ```

4. Start the application:
   ```bash
   docker-compose up --build
   ```

5. Access the application:
   - Backend API: `http://localhost:8000`
   - API documentation (Swagger UI): `http://localhost:8000/docs`
   - Frontend: `http://localhost`

   The frontend will automatically reload if you make changes to the source code.

## Development

### Frontend Development
- The frontend is built with React and runs on port 3000
- It's configured to proxy API requests to the backend
- Environment variables can be set in `.env` or `.env.local`

### Backend Development
- The backend runs on port 8000
- Uses PostgreSQL as the database
- Automatic reload is enabled for development

### Environment Variables
For security, sensitive configuration is managed through environment variables:
- `OPENAI_API_KEY`: Required for the AI chat functionality
- `DATABASE_URL`: Database connection string (default: postgresql://postgres:postgres@db:5432/splitwise)

Never commit the `.env` file to version control. A `.env.example` file is provided as a template.

## API Endpoints

### Users

- `POST /users/` - Create a new user
- `GET /users/{user_id}` - Get user details

### Groups

- `POST /groups/` - Create a new group
  ```json
  {
    "name": "Group Name",
    "user_ids": [1, 2, 3]
  }
  ```
- `GET /groups/{group_id}` - Get group details
- `GET /groups/` - List all groups
- `PUT /groups/{group_id}/add_member` - Add a user to a group
  ```json
  {
    "user_id": 4
  }
  ```

### Expenses

- `POST /groups/{group_id}/expenses` - Add a new expense

  ```json
  {
    "description": "Dinner",
    "amount": 100.0,
    "paid_by": 1,
    "split_type": "equal",
    "shares": [{ "user_id": 1 }, { "user_id": 2 }, { "user_id": 3 }]
  }
  ```

  For percentage split:

  ```json
  {
    "description": "Dinner",
    "amount": 100.0,
    "paid_by": 1,
    "split_type": "percentage",
    "shares": [
      { "user_id": 1, "percentage": 50.0 },
      { "user_id": 2, "percentage": 30.0 },
      { "user_id": 3, "percentage": 20.0 }
    ]
  }
  ```

### Balances

- `GET /groups/{group_id}/balances` - Get balances for a group
- `GET /users/{user_id}/balances` - Get balances for a user across all groups

### Chat

- `POST /api/chat` - Chat with the AI assistant about expenses and balances
  ```json
  {
      "user_id": 1,
      "messages": [
          {"role": "user", "content": "How much do I owe in group 1?"}
      ]
  }
  ```
  The AI can help with:
  - Checking balances and debts
  - Explaining expense splits
  - Finding specific expenses
  - Understanding group expenses

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── app/           # Application code
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── public/        # Static files
│   ├── src/           # React components
│   └── package.json
├── docker-compose.yml  # Docker configuration
├── .env.example       # Example environment variables
└── README.md          # This file
```

## Database Schema

The database schema is automatically created when the application starts. The main tables are:

- `users` - Stores user information
- `groups` - Stores group information
- `user_group_association` - Many-to-many relationship between users and groups
- `expenses` - Stores expense information
- `expense_shares` - Stores how much each user owes for each expense

## Development

To run the application in development mode with hot-reload:

```bash
docker-compose up --build
```

## License

This project is licensed under the MIT License.
