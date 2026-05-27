import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiFetch('/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
  });
}

/** Normalize API response — supports legacy array or full analytics object */
function normalizeRevenuePayload(data: unknown) {
  if (Array.isArray(data)) {
    const monthlyRevenue = data as { month: string; revenue: number }[];
    const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + (item.revenue || 0), 0);
    return {
      monthlyRevenue,
      kpis: { totalRevenue },
      cashFlow: monthlyRevenue.map((m) => ({
        month: m.month,
        revenue: m.revenue || 0,
        expenses: 0,
      })),
    };
  }
  return data as {
    monthlyRevenue?: { month: string; revenue: number }[];
    kpis?: { totalRevenue?: number };
    cashFlow?: { month: string; revenue: number; expenses: number }[];
  };
}

export function useRevenue(months = 12) {
  return useQuery({
    queryKey: ['revenue', months],
    queryFn: async () => {
      const response = await apiFetch(`/dashboard/revenue?months=${months}`);
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      const data = await response.json();
      return normalizeRevenuePayload(data);
    },
  });
}

export function useAnalytics(months = 12) {
  return useRevenue(months);
}