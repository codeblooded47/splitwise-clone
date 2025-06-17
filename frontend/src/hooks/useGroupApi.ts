import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { GroupCreate, AddMemberToGroup } from '../types/api';

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(),
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupData: GroupCreate) => apiService.createGroup(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

export const useAddMemberToGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, memberData }: { groupId: number; memberData: AddMemberToGroup }) =>
      apiService.addMemberToGroup(groupId, memberData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

export const useGroup = (groupId: number) => {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => apiService.getGroup(groupId),
    enabled: !!groupId,
  });
};

export const useGroupBalances = (groupId: number) => {
  return useQuery({
    queryKey: ['groupBalances', groupId],
    queryFn: () => apiService.getGroupBalances(groupId),
    enabled: !!groupId,
  });
};