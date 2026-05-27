import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await apiFetch('/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await apiFetch(`/clients/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Record<string, unknown>) => {
      const response = await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        throw new Error('Failed to create client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...clientData }: { id: string; [key: string]: unknown }) => {
      const response = await apiFetch(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        throw new Error('Failed to update client');
      }
      return response.json();
    },
    onSuccess: (data: { _id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', data._id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/clients/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
