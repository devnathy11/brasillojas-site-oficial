import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";
import { useAddToCart } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { formatBRL } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCartQueryKey } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addToCart = useAddToCart();
  const queryClient = useQueryClient();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        },
      }
    );
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/products/${product.id}`}>
        <div className="product-card bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer group">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.isFeatured && (
              <span className="absolute top-2 left-2 bg-[#C62828] text-white text-xs font-bold px-2 py-0.5 rounded">
                MAIS VENDIDO
              </span>
            )}
            {hasDiscount && (
              <span className="absolute top-2 right-2 bg-[#F57F17] text-white text-xs font-bold px-2 py-0.5 rounded">
                -{discountPercent}%
              </span>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Esgotado</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            {product.brand && (
              <p className="text-xs text-gray-500 mb-0.5">{product.brand}</p>
            )}
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-2">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={11}
                  className={star <= Math.round(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
            </div>

            {/* Price */}
            <div className="mb-3">
              {hasDiscount && (
                <p className="price-original text-xs">
                  {formatBRL(product.originalPrice)}
                </p>
              )}
              <p className="price-current text-[#C62828] font-bold text-lg">
                {formatBRL(product.price)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                ou 12x de {formatBRL(product.price / 12)}
              </p>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCart.isPending}
              className="w-full py-2 px-3 bg-[#1B5E20] hover:bg-[#2E7D32] disabled:bg-gray-300 text-white text-sm font-semibold rounded flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart size={14} />
              {addToCart.isPending ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
