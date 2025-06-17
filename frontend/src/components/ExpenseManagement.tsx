import React, { useState } from 'react';
import { Plus, Receipt, DollarSign, Users, Percent, CheckCircle, XCircle, Search, User } from 'lucide-react';
import { useCreateExpense } from '../hooks/useExpenseApi';
import { useGroups } from '../hooks/useGroupApi';
import { useUsers } from '../hooks/useUserApi';
import LoadingSpinner from './LoadingSpinner';

const ExpenseManagement: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'percentage'>('equal');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [percentages, setPercentages] = useState<{ [key: number]: string }>({});
  const [createdExpenses, setCreatedExpenses] = useState<Array<any>>([]);
  
  const createExpenseMutation = useCreateExpense();
  const { data: groups = [] } = useGroups();
  const { data: users = [] } = useUsers();

  const selectedGroup = groups.find(g => g.id === parseInt(selectedGroupId));
  const availableUsers = selectedGroup?.members || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId.trim() || !description.trim() || !amount.trim() || !paidBy.trim() || selectedUserIds.length === 0) return;

    try {
      const parsedAmount = parseFloat(amount);
      const parsedGroupId = parseInt(selectedGroupId);
      const parsedPaidBy = parseInt(paidBy);
      
      if (isNaN(parsedAmount) || isNaN(parsedGroupId) || isNaN(parsedPaidBy)) return;

      let sharesArray: Array<{ user_id: number; amount?: number; percentage?: number }> = [];
      
      if (splitType === 'equal') {
        sharesArray = selectedUserIds.map(user_id => ({ user_id }));
      } else {
        // Percentage split
        sharesArray = selectedUserIds.map(user_id => ({
          user_id,
          percentage: parseFloat(percentages[user_id] || '0')
        })).filter(share => !isNaN(share.percentage!) && share.percentage! > 0);
      }

      if (sharesArray.length === 0) return;

      // Validate percentages add up to 100% for percentage split
      if (splitType === 'percentage') {
        const totalPercentage = sharesArray.reduce((sum, share) => sum + (share.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          alert('Percentages must add up to 100%');
          return;
        }
      }

      const newExpense = await createExpenseMutation.mutateAsync({
        groupId: parsedGroupId,
        expenseData: {
          description: description.trim(),
          amount: parsedAmount,
          paid_by: parsedPaidBy,
          split_type: splitType,
          shares: sharesArray,
        },
      });
      
      setCreatedExpenses(prev => [...prev, newExpense]);
      setSelectedGroupId('');
      setDescription('');
      setAmount('');
      setPaidBy('');
      setSelectedUserIds([]);
      setPercentages({});
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      // Reset percentages when users change
      if (splitType === 'percentage') {
        const newPercentages = { ...percentages };
        if (!prev.includes(userId)) {
          // User was added, set default percentage
          const remainingUsers = newSelection.length;
          const defaultPercentage = remainingUsers > 0 ? (100 / remainingUsers).toFixed(1) : '0';
          newSelection.forEach(id => {
            newPercentages[id] = defaultPercentage;
          });
        } else {
          // User was removed, delete their percentage
          delete newPercentages[userId];
          // Redistribute remaining percentage
          const remainingUsers = newSelection.length;
          if (remainingUsers > 0) {
            const defaultPercentage = (100 / remainingUsers).toFixed(1);
            newSelection.forEach(id => {
              newPercentages[id] = defaultPercentage;
            });
          }
        }
        setPercentages(newPercentages);
      }
      
      return newSelection;
    });
  };

  const handlePercentageChange = (userId: number, value: string) => {
    setPercentages(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const getTotalPercentage = () => {
    return selectedUserIds.reduce((sum, userId) => {
      return sum + (parseFloat(percentages[userId] || '0') || 0);
    }, 0);
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
  };

  if (createExpenseMutation.isPending) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-orange-500 p-2 rounded-lg">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="groupSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Group
            </label>
            <select
              id="groupSelect"
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setSelectedUserIds([]);
                setPercentages({});
                setPaidBy('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="">Choose a group...</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.members?.length || 0} members)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Expense Description
            </label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="Enter expense description (e.g., Dinner at restaurant)"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="Enter amount"
              />
            </div>
          </div>

          {selectedGroupId && availableUsers.length > 0 && (
            <div>
              <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
                Paid By
              </label>
              <select
                id="paidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              >
                <option value="">Choose who paid...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setSplitType('equal');
                  setPercentages({});
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  splitType === 'equal'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Equal Split</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSplitType('percentage');
                  // Set default percentages
                  if (selectedUserIds.length > 0) {
                    const defaultPercentage = (100 / selectedUserIds.length).toFixed(1);
                    const newPercentages: { [key: number]: string } = {};
                    selectedUserIds.forEach(id => {
                      newPercentages[id] = defaultPercentage;
                    });
                    setPercentages(newPercentages);
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  splitType === 'percentage'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Percent className="h-4 w-4" />
                <span>Percentage Split</span>
              </button>
            </div>
          </div>

          {selectedGroupId && availableUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members to Split With ({selectedUserIds.length} selected)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-3">
                  {availableUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1 flex items-center space-x-2">
                        <div className="bg-gray-100 p-1 rounded-full">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {splitType === 'percentage' && selectedUserIds.includes(user.id) && (
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={percentages[user.id] || ''}
                            onChange={(e) => handlePercentageChange(user.id, e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {splitType === 'percentage' && selectedUserIds.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className={`font-medium ${
                    Math.abs(getTotalPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Total: {getTotalPercentage().toFixed(1)}%
                  </span>
                  {Math.abs(getTotalPercentage() - 100) >= 0.01 && (
                    <span className="text-red-600 ml-2">
                      (Must equal 100%)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          <button
            type="submit"
            disabled={
              !selectedGroupId.trim() || 
              !description.trim() || 
              !amount.trim() || 
              !paidBy.trim() ||
              selectedUserIds.length === 0 ||
              (splitType === 'percentage' && Math.abs(getTotalPercentage() - 100) >= 0.01) ||
              createExpenseMutation.isPending
            }
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
          >
            {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
          </button>
        </form>

        {createExpenseMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">Failed to add expense. Please check your input.</span>
          </div>
        )}

        {createExpenseMutation.isSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">Expense added successfully!</span>
          </div>
        )}
      </div>

      {createdExpenses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h3>
          <div className="space-y-4">
            {createdExpenses.map((expense) => (
              <div key={expense.id} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-600">
                      Amount: ${expense.amount} • Split: {expense.split_type}
                    </p>
                    <p className="text-sm text-gray-600">
                      Paid by: {getUserName(expense.paid_by)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Group ID: {expense.group_id} • Expense ID: {expense.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-orange-600">${expense.amount}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;