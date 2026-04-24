import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { Order } from "./generated/api.schemas";

export type AdminOrder = Order & {
  customerName: string | null;
  customerEmail: string | null;
};

export function getAdminOrderQueryKey(id: number) {
  return [`/api/orders/all/${id}`] as const;
}

export function useGetAdminOrder(id: number) {
  return useQuery<AdminOrder>({
    queryKey: getAdminOrderQueryKey(id),
    queryFn: () => customFetch<AdminOrder>(`/api/orders/all/${id}`),
    enabled: !isNaN(id) && id > 0,
  });
}
