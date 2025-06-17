import {
  User,
  UserCreate,
  Group,
  GroupCreate,
  AddMemberToGroup,
  ExpenseCreate,
  Expense,
  GroupBalance,
  Balance,
} from "../types/api";

const API_BASE_URL = "http://localhost:8000";

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User API
  async createUser(userData: UserCreate): Promise<User> {
    return this.request<User>("/users/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>("/users/");
  }

  async getUser(userId: number): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async getUserBalances(userId: number): Promise<Balance[]> {
    return this.request<Balance[]>(`/users/${userId}/balances`);
  }

  // Group API
  async createGroup(groupData: GroupCreate): Promise<Group> {
    return this.request<Group>("/groups/", {
      method: "POST",
      body: JSON.stringify(groupData),
    });
  }

  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>("/groups/");
  }

  async getGroup(groupId: number): Promise<Group> {
    return this.request<Group>(`/groups/${groupId}`);
  }

  async addMemberToGroup(
    groupId: number,
    memberData: AddMemberToGroup
  ): Promise<Group> {
    return this.request<Group>(`/groups/${groupId}/add_member`, {
      method: "PUT",
      body: JSON.stringify(memberData),
    });
  }

  async getGroupBalances(groupId: number): Promise<GroupBalance[]> {
    return this.request<GroupBalance[]>(`/groups/${groupId}/balances`);
  }

  // Expense API
  async createExpense(
    groupId: number,
    expenseData: ExpenseCreate
  ): Promise<Expense> {
    return this.request<Expense>(`/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
  }
}

export const apiService = new ApiService();
