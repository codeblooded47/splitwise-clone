import React, { useState } from 'react';
import { BarChart3, Users, User, TrendingUp, TrendingDown, DollarSign, Search } from 'lucide-react';
import { useGroupBalances } from '../hooks/useGroupApi';
import { useUserBalances } from '../hooks/useUserApi';
import { useGroups } from '../hooks/useGroupApi';
import { useUsers } from '../hooks/useUserApi';
import LoadingSpinner from './LoadingSpinner';

const BalanceView: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [viewType, setViewType] = useState<'group' | 'user'>('group');

  const { data: groups = [] } = useGroups();
  const { data: users = [] } = useUsers();

  const { data: groupBalances, isLoading: groupLoading } = useGroupBalances(
    viewType === 'group' && selectedGroupId ? parseInt(selectedGroupId) : 0
  );
  
  const { data: userBalances, isLoading: userLoading } = useUserBalances(
    viewType === 'user' && selectedUserId ? parseInt(selectedUserId) : 0
  );

  const handleViewTypeChange = (type: 'group' | 'user') => {
    setViewType(type);
    setSelectedGroupId('');
    setSelectedUserId('');
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User ${userId}`;
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === parseInt(groupId));
    return group ? group.name : `Group ${groupId}`;
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-500 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Balance Overview</h2>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleViewTypeChange('group')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              viewType === 'group'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Group Balances</span>
          </button>
          <button
            onClick={() => handleViewTypeChange('user')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              viewType === 'user'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Personal Balances</span>
          </button>
        </div>

        {viewType === 'group' ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="groupSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Select Group
              </label>
              <select
                id="groupSelect"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              >
                <option value="">Choose a group to view balances...</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} (ID: {group.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                id="userSelect"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              >
                <option value="">Choose a user to view personal balances...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {(groupLoading || userLoading) && <LoadingSpinner />}

      {viewType === 'group' && selectedGroupId && groupBalances && groupBalances.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>{getGroupName(selectedGroupId)} - Balance Summary</span>
          </h3>
          <div className="grid gap-4">
            {groupBalances.map((balance, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getUserName(balance.from_user_id)} owes {getUserName(balance.to_user_id)}
                      </p>
                      <p className="text-sm text-gray-600">Settlement Required</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">${balance.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Amount Due</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewType === 'user' && selectedUserId && userBalances && userBalances.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="h-5 w-5 text-purple-600" />
            <span>{getUserName(parseInt(selectedUserId))} - Personal Balance Summary</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {userBalances.map((balance, index) => (
              <div key={index} className={`rounded-lg p-4 border ${
                balance.amount > 0 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      balance.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {balance.amount > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getUserName(balance.user_id)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {balance.amount > 0 ? 'You are owed' : 'You owe'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      balance.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(balance.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {balance.amount > 0 ? 'Credit' : 'Debt'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {viewType === 'group' && selectedGroupId && groupBalances && groupBalances.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Settled Up!</h3>
          <p className="text-gray-600">{getGroupName(selectedGroupId)} has no outstanding balances.</p>
        </div>
      )}

      {viewType === 'user' && selectedUserId && userBalances && userBalances.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Settled Up!</h3>
          <p className="text-gray-600">{getUserName(parseInt(selectedUserId))} has no outstanding balances.</p>
        </div>
      )}

      {/* No Selection State */}
      {viewType === 'group' && !selectedGroupId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Group</h3>
          <p className="text-gray-600">Choose a group from the dropdown to view its balance summary.</p>
        </div>
      )}

      {viewType === 'user' && !selectedUserId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
          <p className="text-gray-600">Choose a user from the dropdown to view their personal balance summary.</p>
        </div>
      )}
    </div>
  );
};

export default BalanceView;