import React, { useState } from 'react';
import { Plus, Users, CheckCircle, XCircle, User, Search, RefreshCw, PiggyBank, UserPlus } from 'lucide-react';
import { useCreateGroup, useGroups, useAddMemberToGroup } from '../hooks/useGroupApi';
import { useUsers } from '../hooks/useUserApi';
import LoadingSpinner from './LoadingSpinner';

const GroupManagement: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [addMemberGroupId, setAddMemberGroupId] = useState<number | null>(null);
  const [selectedNewMemberId, setSelectedNewMemberId] = useState('');
  
  const createGroupMutation = useCreateGroup();
  const addMemberMutation = useAddMemberToGroup();
  const { data: groups = [], isLoading: groupsLoading, refetch: refetchGroups } = useGroups();
  const { data: users = [] } = useUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    try {
      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        user_ids: selectedUserIds,
      });
      setGroupName('');
      setSelectedUserIds([]);
      setShowUserSelector(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleAddMember = async (groupId: number) => {
    if (!selectedNewMemberId) return;

    try {
      await addMemberMutation.mutateAsync({
        groupId,
        memberData: { user_id: parseInt(selectedNewMemberId) }
      });
      setAddMemberGroupId(null);
      setSelectedNewMemberId('');
    } catch (error) {
      console.error('Error adding member to group:', error);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getSelectedUserNames = () => {
    return users
      .filter(user => selectedUserIds.includes(user.id))
      .map(user => user.name)
      .join(', ');
  };

  const getAvailableUsersForGroup = (group: any) => {
    const memberIds = group.members?.map((member: any) => member.id) || [];
    return users.filter(user => !memberIds.includes(user.id));
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (createGroupMutation.isPending || addMemberMutation.isPending) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Create Group Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <div className="relative">
              <PiggyBank className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter group name (e.g., Goa Trip, Weekend Getaway)"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Members ({selectedUserIds.length} selected)
            </label>
            
            {!showUserSelector ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowUserSelector(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {selectedUserIds.length > 0 
                    ? `Selected: ${getSelectedUserNames()}`
                    : 'Click to select group members'
                  }
                </button>
                {selectedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {users
                      .filter(user => selectedUserIds.includes(user.id))
                      .map(user => (
                        <span
                          key={user.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {user.name}
                          <button
                            type="button"
                            onClick={() => toggleUserSelection(user.id)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    }
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Available Users</span>
                  <button
                    type="button"
                    onClick={() => setShowUserSelector(false)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Done
                  </button>
                </div>
                {users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-100 p-1 rounded-full">
                            <User className="h-3 w-3 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No users available. Create users first.
                  </p>
                )}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!groupName.trim() || selectedUserIds.length === 0 || createGroupMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
          >
            {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
          </button>
        </form>

        {createGroupMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">Failed to create group. Please check if all user IDs exist.</span>
          </div>
        )}

        {createGroupMutation.isSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">Group created successfully!</span>
          </div>
        )}
      </div>

      {/* All Groups List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">All Groups ({groups.length})</h3>
          </div>
          <button
            onClick={() => refetchGroups()}
            disabled={groupsLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${groupsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Search groups by name..."
            />
          </div>
        </div>

        {groupsLoading ? (
          <LoadingSpinner />
        ) : filteredGroups.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredGroups.map((group) => (
              <div key={group.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <PiggyBank className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{group.name}</p>
                      <p className="text-sm text-blue-600 font-medium">Group ID: {group.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAddMemberGroupId(group.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Member</span>
                  </button>
                </div>
                
                {/* Add Member Form */}
                {addMemberGroupId === group.id && (
                  <div className="mb-4 p-4 bg-white/60 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Member</h4>
                    <div className="flex space-x-2">
                      <select
                        value={selectedNewMemberId}
                        onChange={(e) => setSelectedNewMemberId(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a user...</option>
                        {getAvailableUsersForGroup(group).map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAddMember(group.id)}
                        disabled={!selectedNewMemberId || addMemberMutation.isPending}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setAddMemberGroupId(null);
                          setSelectedNewMemberId('');
                        }}
                        className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    {getAvailableUsersForGroup(group).length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">All users are already members of this group.</p>
                    )}
                  </div>
                )}
                
                {group.members && group.members.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Members ({group.members.length}):
                    </p>
                    <div className="grid gap-2">
                      {group.members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 bg-white/60 rounded-lg p-2">
                          <div className="bg-blue-100 p-1 rounded-full">
                            <User className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                            <p className="text-xs text-gray-600 truncate">{member.email}</p>
                          </div>
                          <span className="text-xs text-blue-600 font-medium">#{member.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No groups found' : 'No groups yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first group to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* Success/Error Messages for Add Member */}
      {addMemberMutation.isError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 shadow-lg">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Failed to add member to group.</span>
        </div>
      )}

      {addMemberMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 shadow-lg">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">Member added successfully!</span>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;