import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const response = await apiFetch('/contracts');
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      return response.json();
    },
  });
}

export function useContract(id) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const response = await apiFetch(`/contracts/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contract');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractData) => {
      const response = await apiFetch('/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
      });
      if (!response.ok) {
        throw new Error('Failed to create contract');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...contractData }: { id: string; [key: string]: unknown }) => {
      const response = await apiFetch(`/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contractData),
      });
      if (!response.ok) {
        throw new Error('Failed to update contract');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data._id] });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await apiFetch(`/contracts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete contract');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}