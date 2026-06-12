import type { Order } from "./generated/api.schemas";
export type AdminOrder = Order & {
    customerName: string | null;
    customerEmail: string | null;
};
export declare function getAdminOrderQueryKey(id: number): readonly [`/api/orders/all/${number}`];
export declare function useGetAdminOrder(id: number): import("@tanstack/react-query").UseQueryResult<AdminOrder, Error>;
//# sourceMappingURL=orders-admin.d.ts.map