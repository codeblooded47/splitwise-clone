import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ExpenseCreate } from '../types/api';

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, expenseData }: { groupId: number; expenseData: ExpenseCreate }) =>
      apiService.createExpense(groupId, expenseData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groupBalances', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['userBalances'] });
    },
  });
};