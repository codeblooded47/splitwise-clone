export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserCreate {
  name: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  members: User[];
}

export interface GroupCreate {
  name: string;
  user_ids: number[];
}

export interface AddMemberToGroup {
  user_id: number;
}

export interface ExpenseShareCreate {
  user_id: number;
  amount?: number;
  percentage?: number;
}

export interface ExpenseCreate {
  description: string;
  amount: number;
  paid_by: number;
  split_type: 'equal' | 'percentage';
  shares: ExpenseShareCreate[];
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  split_type: 'equal' | 'percentage';
  shares: ExpenseShareCreate[];
  group_id: number;
  paid_by: number;
  created_at: string;
}

export interface GroupBalance {
  from_user_id: number;
  to_user_id: number;
  amount: number;
}

export interface Balance {
  user_id: number;
  amount: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatbotContext {
  users: User[];
  groups: Group[];
  groupBalances: { [groupId: number]: GroupBalance[] };
  userBalances: { [userId: number]: Balance[] };
}