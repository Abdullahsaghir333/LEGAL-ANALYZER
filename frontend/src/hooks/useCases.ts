import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const response = await apiFetch('/cases');
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      return response.json();
    },
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const response = await apiFetch(`/cases/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: Record<string, unknown>) => {
      const response = await apiFetch('/cases', {
        method: 'POST',
        body: JSON.stringify(caseData),
      });
      if (!response.ok) {
        throw new Error('Failed to create case');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...caseData }: { id: string; [key: string]: unknown }) => {
      const response = await apiFetch(`/cases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(caseData),
      });
      if (!response.ok) {
        throw new Error('Failed to update case');
      }
      return response.json();
    },
    onSuccess: (data: { _id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case', data._id] });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/cases/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete case');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
