import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AddToCartBody, AdminDashboard, Cart, Category, Coupon, CouponValidation, CreateCategoryBody, CreateCouponBody, CreateOrderBody, CreateProductBody, CreateReviewBody, ErrorEnvelope, HealthStatus, ListProducts200, ListProductsParams, Order, PixDiscountSetting, Product, ProductStats, Review, UpdateCartItemBody, UpdateCouponBody, UpdatePixDiscountBody, UpdateProductBody, UpdateUserProfileBody, UploadUrlRequest, UploadUrlResponse, UserProfile } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Request a presigned URL for file upload
 */
export declare const getRequestUploadUrlUrl: () => string;
export declare const requestUploadUrl: (uploadUrlRequest: UploadUrlRequest, options?: RequestInit) => Promise<UploadUrlResponse>;
export declare const getRequestUploadUrlMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
        data: BodyType<UploadUrlRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
    data: BodyType<UploadUrlRequest>;
}, TContext>;
export type RequestUploadUrlMutationResult = NonNullable<Awaited<ReturnType<typeof requestUploadUrl>>>;
export type RequestUploadUrlMutationBody = BodyType<UploadUrlRequest>;
export type RequestUploadUrlMutationError = ErrorType<ErrorEnvelope>;
/**
 * @summary Request a presigned URL for file upload
 */
export declare const useRequestUploadUrl: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
        data: BodyType<UploadUrlRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof requestUploadUrl>>, TError, {
    data: BodyType<UploadUrlRequest>;
}, TContext>;
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all products
 */
export declare const getListProductsUrl: (params?: ListProductsParams) => string;
export declare const listProducts: (params?: ListProductsParams, options?: RequestInit) => Promise<ListProducts200>;
export declare const getListProductsQueryKey: (params?: ListProductsParams) => readonly ["/api/products", ...ListProductsParams[]];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
/**
 * @summary List all products
 */
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new product (admin only)
 */
export declare const getCreateProductUrl: () => string;
export declare const createProduct: (createProductBody: CreateProductBody, options?: RequestInit) => Promise<Product>;
export declare const getCreateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductBody>;
}, TContext>;
export type CreateProductMutationResult = NonNullable<Awaited<ReturnType<typeof createProduct>>>;
export type CreateProductMutationBody = BodyType<CreateProductBody>;
export type CreateProductMutationError = ErrorType<unknown>;
/**
 * @summary Create a new product (admin only)
 */
export declare const useCreateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductBody>;
}, TContext>;
/**
 * @summary Get featured/highlighted products
 */
export declare const getGetFeaturedProductsUrl: () => string;
export declare const getFeaturedProducts: (options?: RequestInit) => Promise<Product[]>;
export declare const getGetFeaturedProductsQueryKey: () => readonly ["/api/products/featured"];
export declare const getGetFeaturedProductsQueryOptions: <TData = Awaited<ReturnType<typeof getFeaturedProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFeaturedProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFeaturedProductsQueryResult = NonNullable<Awaited<ReturnType<typeof getFeaturedProducts>>>;
export type GetFeaturedProductsQueryError = ErrorType<unknown>;
/**
 * @summary Get featured/highlighted products
 */
export declare function useGetFeaturedProducts<TData = Awaited<ReturnType<typeof getFeaturedProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFeaturedProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get product statistics (admin only)
 */
export declare const getGetProductStatsUrl: () => string;
export declare const getProductStats: (options?: RequestInit) => Promise<ProductStats>;
export declare const getGetProductStatsQueryKey: () => readonly ["/api/products/stats"];
export declare const getGetProductStatsQueryOptions: <TData = Awaited<ReturnType<typeof getProductStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProductStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getProductStats>>>;
export type GetProductStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get product statistics (admin only)
 */
export declare function useGetProductStats<TData = Awaited<ReturnType<typeof getProductStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProductStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get a product by ID
 */
export declare const getGetProductUrl: (id: number) => string;
export declare const getProduct: (id: number, options?: RequestInit) => Promise<Product>;
export declare const getGetProductQueryKey: (id: number) => readonly [`/api/products/${number}`];
export declare const getGetProductQueryOptions: <TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductQueryResult = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
export type GetProductQueryError = ErrorType<void>;
/**
 * @summary Get a product by ID
 */
export declare function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update a product (admin only)
 */
export declare const getUpdateProductUrl: (id: number) => string;
export declare const updateProduct: (id: number, updateProductBody: UpdateProductBody, options?: RequestInit) => Promise<Product>;
export declare const getUpdateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<UpdateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<UpdateProductBody>;
}, TContext>;
export type UpdateProductMutationResult = NonNullable<Awaited<ReturnType<typeof updateProduct>>>;
export type UpdateProductMutationBody = BodyType<UpdateProductBody>;
export type UpdateProductMutationError = ErrorType<unknown>;
/**
 * @summary Update a product (admin only)
 */
export declare const useUpdateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<UpdateProductBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<UpdateProductBody>;
}, TContext>;
/**
 * @summary Delete a product (admin only)
 */
export declare const getDeleteProductUrl: (id: number) => string;
export declare const deleteProduct: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export type DeleteProductMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProduct>>>;
export type DeleteProductMutationError = ErrorType<unknown>;
/**
 * @summary Delete a product (admin only)
 */
export declare const useDeleteProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List all categories
 */
export declare const getListCategoriesUrl: () => string;
export declare const listCategories: (options?: RequestInit) => Promise<Category[]>;
export declare const getListCategoriesQueryKey: () => readonly ["/api/categories"];
export declare const getListCategoriesQueryOptions: <TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCategories>>>;
export type ListCategoriesQueryError = ErrorType<unknown>;
/**
 * @summary List all categories
 */
export declare function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a category (admin only)
 */
export declare const getCreateCategoryUrl: () => string;
export declare const createCategory: (createCategoryBody: CreateCategoryBody, options?: RequestInit) => Promise<Category>;
export declare const getCreateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryBody>;
}, TContext>;
export type CreateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof createCategory>>>;
export type CreateCategoryMutationBody = BodyType<CreateCategoryBody>;
export type CreateCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Create a category (admin only)
 */
export declare const useCreateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryBody>;
}, TContext>;
/**
 * @summary Get current user's cart
 */
export declare const getGetCartUrl: () => string;
export declare const getCart: (options?: RequestInit) => Promise<Cart>;
export declare const getGetCartQueryKey: () => readonly ["/api/cart"];
export declare const getGetCartQueryOptions: <TData = Awaited<ReturnType<typeof getCart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCart>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCartQueryResult = NonNullable<Awaited<ReturnType<typeof getCart>>>;
export type GetCartQueryError = ErrorType<unknown>;
/**
 * @summary Get current user's cart
 */
export declare function useGetCart<TData = Awaited<ReturnType<typeof getCart>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCart>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Add item to cart
 */
export declare const getAddToCartUrl: () => string;
export declare const addToCart: (addToCartBody: AddToCartBody, options?: RequestInit) => Promise<Cart>;
export declare const getAddToCartMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addToCart>>, TError, {
        data: BodyType<AddToCartBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addToCart>>, TError, {
    data: BodyType<AddToCartBody>;
}, TContext>;
export type AddToCartMutationResult = NonNullable<Awaited<ReturnType<typeof addToCart>>>;
export type AddToCartMutationBody = BodyType<AddToCartBody>;
export type AddToCartMutationError = ErrorType<unknown>;
/**
 * @summary Add item to cart
 */
export declare const useAddToCart: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addToCart>>, TError, {
        data: BodyType<AddToCartBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addToCart>>, TError, {
    data: BodyType<AddToCartBody>;
}, TContext>;
/**
 * @summary Clear cart
 */
export declare const getClearCartUrl: () => string;
export declare const clearCart: (options?: RequestInit) => Promise<void>;
export declare const getClearCartMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof clearCart>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof clearCart>>, TError, void, TContext>;
export type ClearCartMutationResult = NonNullable<Awaited<ReturnType<typeof clearCart>>>;
export type ClearCartMutationError = ErrorType<unknown>;
/**
 * @summary Clear cart
 */
export declare const useClearCart: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof clearCart>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof clearCart>>, TError, void, TContext>;
/**
 * @summary Update cart item quantity
 */
export declare const getUpdateCartItemUrl: (productId: number) => string;
export declare const updateCartItem: (productId: number, updateCartItemBody: UpdateCartItemBody, options?: RequestInit) => Promise<Cart>;
export declare const getUpdateCartItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCartItem>>, TError, {
        productId: number;
        data: BodyType<UpdateCartItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCartItem>>, TError, {
    productId: number;
    data: BodyType<UpdateCartItemBody>;
}, TContext>;
export type UpdateCartItemMutationResult = NonNullable<Awaited<ReturnType<typeof updateCartItem>>>;
export type UpdateCartItemMutationBody = BodyType<UpdateCartItemBody>;
export type UpdateCartItemMutationError = ErrorType<unknown>;
/**
 * @summary Update cart item quantity
 */
export declare const useUpdateCartItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCartItem>>, TError, {
        productId: number;
        data: BodyType<UpdateCartItemBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCartItem>>, TError, {
    productId: number;
    data: BodyType<UpdateCartItemBody>;
}, TContext>;
/**
 * @summary Remove item from cart
 */
export declare const getRemoveFromCartUrl: (productId: number) => string;
export declare const removeFromCart: (productId: number, options?: RequestInit) => Promise<Cart>;
export declare const getRemoveFromCartMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof removeFromCart>>, TError, {
        productId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof removeFromCart>>, TError, {
    productId: number;
}, TContext>;
export type RemoveFromCartMutationResult = NonNullable<Awaited<ReturnType<typeof removeFromCart>>>;
export type RemoveFromCartMutationError = ErrorType<unknown>;
/**
 * @summary Remove item from cart
 */
export declare const useRemoveFromCart: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof removeFromCart>>, TError, {
        productId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof removeFromCart>>, TError, {
    productId: number;
}, TContext>;
/**
 * @summary List user orders
 */
export declare const getListOrdersUrl: () => string;
export declare const listOrders: (options?: RequestInit) => Promise<Order[]>;
export declare const getListOrdersQueryKey: () => readonly ["/api/orders"];
export declare const getListOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listOrders>>>;
export type ListOrdersQueryError = ErrorType<unknown>;
/**
 * @summary List user orders
 */
export declare function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Place an order
 */
export declare const getCreateOrderUrl: () => string;
export declare const createOrder: (createOrderBody: CreateOrderBody, options?: RequestInit) => Promise<Order>;
export declare const getCreateOrderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, {
        data: BodyType<CreateOrderBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, {
    data: BodyType<CreateOrderBody>;
}, TContext>;
export type CreateOrderMutationResult = NonNullable<Awaited<ReturnType<typeof createOrder>>>;
export type CreateOrderMutationBody = BodyType<CreateOrderBody>;
export type CreateOrderMutationError = ErrorType<unknown>;
/**
 * @summary Place an order
 */
export declare const useCreateOrder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, {
        data: BodyType<CreateOrderBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createOrder>>, TError, {
    data: BodyType<CreateOrderBody>;
}, TContext>;
/**
 * @summary List all orders (admin only)
 */
export declare const getListAllOrdersUrl: () => string;
export declare const listAllOrders: (options?: RequestInit) => Promise<Order[]>;
export declare const getListAllOrdersQueryKey: () => readonly ["/api/orders/all"];
export declare const getListAllOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listAllOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAllOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAllOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listAllOrders>>>;
export type ListAllOrdersQueryError = ErrorType<unknown>;
/**
 * @summary List all orders (admin only)
 */
export declare function useListAllOrders<TData = Awaited<ReturnType<typeof listAllOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get order by ID
 */
export declare const getGetOrderUrl: (id: number) => string;
export declare const getOrder: (id: number, options?: RequestInit) => Promise<Order>;
export declare const getGetOrderQueryKey: (id: number) => readonly [`/api/orders/${number}`];
export declare const getGetOrderQueryOptions: <TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOrderQueryResult = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
export type GetOrderQueryError = ErrorType<unknown>;
/**
 * @summary Get order by ID
 */
export declare function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Advance order status (admin only)
 */
export declare const getUpdateOrderStatusUrl: (id: number) => string;
export declare const updateOrderStatus: (id: number, options?: RequestInit) => Promise<Order>;
export declare const getUpdateOrderStatusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
    id: number;
}, TContext>;
export type UpdateOrderStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateOrderStatus>>>;
export type UpdateOrderStatusMutationError = ErrorType<unknown>;
/**
 * @summary Advance order status (admin only)
 */
export declare const useUpdateOrderStatus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Confirm delivery (customer only)
 */
export declare const getConfirmDeliveryUrl: (id: number) => string;
export declare const confirmDelivery: (id: number, options?: RequestInit) => Promise<Order>;
export declare const getConfirmDeliveryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmDelivery>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof confirmDelivery>>, TError, {
    id: number;
}, TContext>;
export type ConfirmDeliveryMutationResult = NonNullable<Awaited<ReturnType<typeof confirmDelivery>>>;
export type ConfirmDeliveryMutationError = ErrorType<unknown>;
/**
 * @summary Confirm delivery (customer only)
 */
export declare const useConfirmDelivery: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmDelivery>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof confirmDelivery>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Create a product review
 */
export declare const getCreateReviewUrl: () => string;
export declare const createReview: (createReviewBody: CreateReviewBody, options?: RequestInit) => Promise<Review>;
export declare const getCreateReviewMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError, {
        data: BodyType<CreateReviewBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError, {
    data: BodyType<CreateReviewBody>;
}, TContext>;
export type CreateReviewMutationResult = NonNullable<Awaited<ReturnType<typeof createReview>>>;
export type CreateReviewMutationBody = BodyType<CreateReviewBody>;
export type CreateReviewMutationError = ErrorType<unknown>;
/**
 * @summary Create a product review
 */
export declare const useCreateReview: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError, {
        data: BodyType<CreateReviewBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createReview>>, TError, {
    data: BodyType<CreateReviewBody>;
}, TContext>;
/**
 * @summary List reviews for a product
 */
export declare const getListProductReviewsUrl: (productId: number) => string;
export declare const listProductReviews: (productId: number, options?: RequestInit) => Promise<Review[]>;
export declare const getListProductReviewsQueryKey: (productId: number) => readonly [`/api/reviews/${number}`];
export declare const getListProductReviewsQueryOptions: <TData = Awaited<ReturnType<typeof listProductReviews>>, TError = ErrorType<unknown>>(productId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProductReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProductReviews>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductReviewsQueryResult = NonNullable<Awaited<ReturnType<typeof listProductReviews>>>;
export type ListProductReviewsQueryError = ErrorType<unknown>;
/**
 * @summary List reviews for a product
 */
export declare function useListProductReviews<TData = Awaited<ReturnType<typeof listProductReviews>>, TError = ErrorType<unknown>>(productId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProductReviews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get current user profile
 */
export declare const getGetUserProfileUrl: () => string;
export declare const getUserProfile: (options?: RequestInit) => Promise<UserProfile>;
export declare const getGetUserProfileQueryKey: () => readonly ["/api/users/profile"];
export declare const getGetUserProfileQueryOptions: <TData = Awaited<ReturnType<typeof getUserProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUserProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;
export type GetUserProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get current user profile
 */
export declare function useGetUserProfile<TData = Awaited<ReturnType<typeof getUserProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update user profile
 */
export declare const getUpdateUserProfileUrl: () => string;
export declare const updateUserProfile: (updateUserProfileBody: UpdateUserProfileBody, options?: RequestInit) => Promise<UserProfile>;
export declare const getUpdateUserProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
        data: BodyType<UpdateUserProfileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
    data: BodyType<UpdateUserProfileBody>;
}, TContext>;
export type UpdateUserProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateUserProfile>>>;
export type UpdateUserProfileMutationBody = BodyType<UpdateUserProfileBody>;
export type UpdateUserProfileMutationError = ErrorType<unknown>;
/**
 * @summary Update user profile
 */
export declare const useUpdateUserProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
        data: BodyType<UpdateUserProfileBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUserProfile>>, TError, {
    data: BodyType<UpdateUserProfileBody>;
}, TContext>;
/**
 * @summary List all coupons (admin only)
 */
export declare const getListCouponsUrl: () => string;
export declare const listCoupons: (options?: RequestInit) => Promise<Coupon[]>;
export declare const getListCouponsQueryKey: () => readonly ["/api/coupons"];
export declare const getListCouponsQueryOptions: <TData = Awaited<ReturnType<typeof listCoupons>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCoupons>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCoupons>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCouponsQueryResult = NonNullable<Awaited<ReturnType<typeof listCoupons>>>;
export type ListCouponsQueryError = ErrorType<unknown>;
/**
 * @summary List all coupons (admin only)
 */
export declare function useListCoupons<TData = Awaited<ReturnType<typeof listCoupons>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCoupons>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a coupon (admin only)
 */
export declare const getCreateCouponUrl: () => string;
export declare const createCoupon: (createCouponBody: CreateCouponBody, options?: RequestInit) => Promise<Coupon>;
export declare const getCreateCouponMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCoupon>>, TError, {
        data: BodyType<CreateCouponBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCoupon>>, TError, {
    data: BodyType<CreateCouponBody>;
}, TContext>;
export type CreateCouponMutationResult = NonNullable<Awaited<ReturnType<typeof createCoupon>>>;
export type CreateCouponMutationBody = BodyType<CreateCouponBody>;
export type CreateCouponMutationError = ErrorType<unknown>;
/**
 * @summary Create a coupon (admin only)
 */
export declare const useCreateCoupon: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCoupon>>, TError, {
        data: BodyType<CreateCouponBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCoupon>>, TError, {
    data: BodyType<CreateCouponBody>;
}, TContext>;
/**
 * @summary Update a coupon (admin only)
 */
export declare const getUpdateCouponUrl: (id: number) => string;
export declare const updateCoupon: (id: number, updateCouponBody: UpdateCouponBody, options?: RequestInit) => Promise<Coupon>;
export declare const getUpdateCouponMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCoupon>>, TError, {
        id: number;
        data: BodyType<UpdateCouponBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCoupon>>, TError, {
    id: number;
    data: BodyType<UpdateCouponBody>;
}, TContext>;
export type UpdateCouponMutationResult = NonNullable<Awaited<ReturnType<typeof updateCoupon>>>;
export type UpdateCouponMutationBody = BodyType<UpdateCouponBody>;
export type UpdateCouponMutationError = ErrorType<unknown>;
/**
 * @summary Update a coupon (admin only)
 */
export declare const useUpdateCoupon: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCoupon>>, TError, {
        id: number;
        data: BodyType<UpdateCouponBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCoupon>>, TError, {
    id: number;
    data: BodyType<UpdateCouponBody>;
}, TContext>;
/**
 * @summary Delete a coupon (admin only)
 */
export declare const getDeleteCouponUrl: (id: number) => string;
export declare const deleteCoupon: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCouponMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCoupon>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCoupon>>, TError, {
    id: number;
}, TContext>;
export type DeleteCouponMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCoupon>>>;
export type DeleteCouponMutationError = ErrorType<unknown>;
/**
 * @summary Delete a coupon (admin only)
 */
export declare const useDeleteCoupon: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCoupon>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCoupon>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Validate a coupon code
 */
export declare const getValidateCouponUrl: (code: string) => string;
export declare const validateCoupon: (code: string, options?: RequestInit) => Promise<CouponValidation>;
export declare const getValidateCouponQueryKey: (code: string) => readonly [`/api/coupons/validate/${string}`];
export declare const getValidateCouponQueryOptions: <TData = Awaited<ReturnType<typeof validateCoupon>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof validateCoupon>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof validateCoupon>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ValidateCouponQueryResult = NonNullable<Awaited<ReturnType<typeof validateCoupon>>>;
export type ValidateCouponQueryError = ErrorType<unknown>;
/**
 * @summary Validate a coupon code
 */
export declare function useValidateCoupon<TData = Awaited<ReturnType<typeof validateCoupon>>, TError = ErrorType<unknown>>(code: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof validateCoupon>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get admin dashboard stats
 */
export declare const getGetAdminDashboardUrl: () => string;
export declare const getAdminDashboard: (options?: RequestInit) => Promise<AdminDashboard>;
export declare const getGetAdminDashboardQueryKey: () => readonly ["/api/admin/dashboard"];
export declare const getGetAdminDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getAdminDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminDashboard>>>;
export type GetAdminDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Get admin dashboard stats
 */
export declare function useGetAdminDashboard<TData = Awaited<ReturnType<typeof getAdminDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get the current PIX discount percentage
 */
export declare const getGetSettingsPixDiscountUrl: () => string;
export declare const getSettingsPixDiscount: (options?: RequestInit) => Promise<PixDiscountSetting>;
export declare const getGetSettingsPixDiscountQueryKey: () => readonly ["/api/settings/pix-discount"];
export declare const getGetSettingsPixDiscountQueryOptions: <TData = Awaited<ReturnType<typeof getSettingsPixDiscount>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettingsPixDiscount>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettingsPixDiscount>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsPixDiscountQueryResult = NonNullable<Awaited<ReturnType<typeof getSettingsPixDiscount>>>;
export type GetSettingsPixDiscountQueryError = ErrorType<unknown>;
/**
 * @summary Get the current PIX discount percentage
 */
export declare function useGetSettingsPixDiscount<TData = Awaited<ReturnType<typeof getSettingsPixDiscount>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettingsPixDiscount>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update the PIX discount percentage (admin only)
 */
export declare const getUpdateSettingsPixDiscountUrl: () => string;
export declare const updateSettingsPixDiscount: (updatePixDiscountBody: UpdatePixDiscountBody, options?: RequestInit) => Promise<PixDiscountSetting>;
export declare const getUpdateSettingsPixDiscountMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettingsPixDiscount>>, TError, {
        data: BodyType<UpdatePixDiscountBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettingsPixDiscount>>, TError, {
    data: BodyType<UpdatePixDiscountBody>;
}, TContext>;
export type UpdateSettingsPixDiscountMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettingsPixDiscount>>>;
export type UpdateSettingsPixDiscountMutationBody = BodyType<UpdatePixDiscountBody>;
export type UpdateSettingsPixDiscountMutationError = ErrorType<unknown>;
/**
 * @summary Update the PIX discount percentage (admin only)
 */
export declare const useUpdateSettingsPixDiscount: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettingsPixDiscount>>, TError, {
        data: BodyType<UpdatePixDiscountBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettingsPixDiscount>>, TError, {
    data: BodyType<UpdatePixDiscountBody>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map