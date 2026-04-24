import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShoppingCart, Star, ChevronLeft, ChevronRight, Heart, Share2, Minus, Plus, Zap } from "lucide-react";
import { useGetProduct, useListProductReviews, useAddToCart, useCreateReview } from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { useUser, Show } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatBRL, formatDate } from "@/lib/utils";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={star <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}
        />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            size={24}
            className={star <= (hover || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id ?? "0");
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: product, isLoading } = useGetProduct(productId, { query: { enabled: !!productId } });
  const { data: reviews } = useListProductReviews(productId, { query: { enabled: !!productId } });
  const addToCart = useAddToCart();
  const createReview = useCreateReview();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="skeleton aspect-square rounded-lg" />
            <div className="space-y-4">
              <div className="skeleton h-8 rounded w-3/4" />
              <div className="skeleton h-4 rounded w-1/2" />
              <div className="skeleton h-12 rounded w-1/3" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Produto não encontrado</h1>
          <Link href="/products" className="mt-4 inline-block text-[#1B5E20] hover:underline">
            Voltar para produtos
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = [product.imageUrl, ...(product.images ?? [])].filter(Boolean);
  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)
    : 0;

  const avgRating = reviews?.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : product.rating;

  function handleBuyNow() {
    addToCart.mutate(
      { data: { productId: product!.id, quantity: qty } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          setLocation("/cart");
        },
      }
    );
  }

  function handleAddToCart() {
    addToCart.mutate(
      { data: { productId: product!.id, quantity: qty } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        },
      }
    );
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    createReview.mutate(
      { data: { productId: product!.id, rating: reviewRating, comment: reviewComment } },
      {
        onSuccess: () => {
          setReviewComment("");
          setReviewRating(5);
          setShowReviewForm(false);
          queryClient.invalidateQueries();
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#1B5E20]">Home</Link>
          <span className="mx-2">&rsaquo;</span>
          <Link href="/products" className="hover:text-[#1B5E20]">Produtos</Link>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-gray-800 line-clamp-1">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[activeImage] ?? product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              {product.isFeatured && (
                <span className="absolute top-3 left-3 bg-[#C62828] text-white text-xs font-bold px-2.5 py-1 rounded">
                  MAIS VENDIDO
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-colors ${
                      i === activeImage ? "border-[#1B5E20]" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.brand && (
              <p className="text-sm text-[#1B5E20] font-medium mb-1">{product.brand}</p>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <StarDisplay rating={avgRating} />
              <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({reviews?.length ?? product.reviewCount} avaliações)</span>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {hasDiscount && (
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-gray-400 line-through text-sm">{formatBRL(product.originalPrice)}</p>
                  <span className="bg-[#C62828] text-white text-xs font-bold px-2 py-0.5 rounded">
                    -{discountPercent}%
                  </span>
                </div>
              )}
              <p className="text-3xl font-extrabold text-[#C62828]">{formatBRL(product.price)}</p>
              <p className="text-sm text-gray-500 mt-1">
                ou 12x de {formatBRL(Number(product.price) / 12)} sem juros
              </p>
              <p className="text-sm text-green-700 font-medium mt-2">
                5% de desconto no Pix
              </p>
            </div>

            {/* Stock */}
            {product.stock > 0 ? (
              <p className="text-sm text-green-700 mb-4">
                Em estoque: {product.stock} {product.stock === 1 ? "unidade" : "unidades"}
              </p>
            ) : (
              <p className="text-sm text-red-600 mb-4 font-semibold">Esgotado</p>
            )}

            {/* Qty + Add to cart */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending}
                  className="flex-1 py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                >
                  <ShoppingCart size={18} />
                  {addToCart.isPending ? "Adicionando..." : "Adicionar ao Carrinho"}
                </button>
              </div>
            )}

            <button
              onClick={handleBuyNow}
              disabled={addToCart.isPending || product.stock === 0}
              className="w-full py-3 border-2 border-[#C62828] text-[#C62828] hover:bg-[#C62828] hover:text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors mb-4 disabled:opacity-60"
            >
              <Zap size={18} />
              Comprar Agora
            </button>

            {/* Description */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-800 mb-2">Descrição</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Specs */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Especificações Técnicas</h3>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex py-2 px-3 text-sm">
                      <span className="text-gray-500 w-1/3 flex-shrink-0 font-medium">{key}</span>
                      <span className="text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Comentários dos Clientes ({reviews?.length ?? 0})
            </h2>
            <Show when="signed-in">
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-[#1B5E20] text-white text-sm font-semibold rounded-md hover:bg-[#2E7D32] transition-colors"
              >
                Avaliar Produto
              </button>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in" className="px-4 py-2 border border-[#1B5E20] text-[#1B5E20] text-sm font-semibold rounded-md hover:bg-[#1B5E20] hover:text-white transition-colors">
                Entre para avaliar
              </Link>
            </Show>
          </div>

          {/* Overall rating */}
          {(reviews?.length ?? 0) > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 flex items-center gap-8">
              <div className="text-center">
                <p className="text-5xl font-extrabold text-gray-800">{avgRating.toFixed(1)}</p>
                <StarDisplay rating={avgRating} />
                <p className="text-xs text-gray-500 mt-1">{reviews?.length} avaliações</p>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = (reviews ?? []).filter((r) => r.rating === star).length;
                  const pct = reviews?.length ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 w-4">{star}</span>
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-6">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review form */}
          {showReviewForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleSubmitReview}
              className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
            >
              <h3 className="font-bold text-gray-800 mb-4">Sua avaliação</h3>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600 block mb-2">Nota</label>
                <StarInput value={reviewRating} onChange={setReviewRating} />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600 block mb-2">Comentário</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  rows={3}
                  placeholder="Conte sua experiência com o produto..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#1B5E20] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createReview.isPending}
                  className="px-6 py-2 bg-[#1B5E20] text-white font-semibold rounded-md hover:bg-[#2E7D32] disabled:opacity-70 transition-colors text-sm"
                >
                  {createReview.isPending ? "Enviando..." : "Enviar Avaliação"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.form>
          )}

          {/* Reviews list */}
          <div className="space-y-4">
            {(reviews ?? []).map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-gray-200 rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1B5E20] flex items-center justify-center text-white text-xs font-bold">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-gray-800">{review.userName}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <StarDisplay rating={review.rating} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
              </motion.div>
            ))}

            {(!reviews || reviews.length === 0) && (
              <div className="text-center py-10 text-gray-500">
                <p>Nenhuma avaliação ainda. Seja o primeiro!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
