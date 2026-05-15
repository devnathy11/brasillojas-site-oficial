import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Search, Package, ImagePlus, X, Upload } from "lucide-react";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useListCategories,
  deleteProduct as deleteProductApi,
} from "@workspace/api-client-react";
import type { Product, CreateProductBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatBRL } from "@/lib/utils";
import { useUpload } from "@workspace/object-storage-web";

type ProductForm = CreateProductBody & { isActive?: boolean };

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: 0,
  originalPrice: undefined,
  imageUrl: "",
  images: [],
  categoryId: 0,
  stock: 0,
  brand: undefined,
  sku: undefined,
  barcode: undefined,
  isFeatured: false,
  isActive: true,
  specifications: undefined,
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState<number | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const pendingGalleryIdxRef = useRef<number | null>(null);

  const { uploadFile } = useUpload();

  const { data, isLoading } = useListProducts({ search: search || undefined });
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();

  const products = data?.products ?? [];

  function openCreate() {
    setEditProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice ?? undefined,
      imageUrl: product.imageUrl,
      images: product.images ?? [],
      categoryId: product.categoryId,
      stock: product.stock,
      brand: product.brand ?? undefined,
      sku: product.sku ?? undefined,
      barcode: product.barcode ?? undefined,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      specifications: product.specifications ?? undefined,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanImages = (form.images ?? []).filter((url) => url.trim() !== "");
    const formData = { ...form, images: cleanImages };
    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, data: formData }, {
        onSuccess: () => { queryClient.invalidateQueries(); setShowForm(false); },
      });
    } else {
      createProduct.mutate({ data: formData }, {
        onSuccess: () => { queryClient.invalidateQueries(); setShowForm(false); },
      });
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    deleteProduct.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries() });
  }

  function toggleSelectProduct(id: number) {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllProducts() {
    if (products.every((p) => selectedProducts.has(p.id))) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Tem certeza que deseja excluir ${selectedProducts.size} produto(s)?`)) return;
    const ids = Array.from(selectedProducts);
    setSelectedProducts(new Set());
    setBulkDeleting(true);
    try {
      await Promise.allSettled(ids.map((id) => deleteProductApi(id)));
    } finally {
      setBulkDeleting(false);
      queryClient.invalidateQueries();
    }
  }

  async function handleMainImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    const result = await uploadFile(file);
    setUploadingMain(false);
    if (result) {
      setForm({ ...form, imageUrl: `/api/storage${result.objectPath}` });
    }
    e.target.value = "";
  }

  async function handleGalleryImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const idx = pendingGalleryIdxRef.current;
    if (!file || idx === null) return;
    setUploadingGalleryIdx(idx);
    const result = await uploadFile(file);
    setUploadingGalleryIdx(null);
    if (result) {
      updateImageUrl(idx, `/api/storage${result.objectPath}`);
    }
    e.target.value = "";
    pendingGalleryIdxRef.current = null;
  }

  function addImageUrl() {
    if ((form.images ?? []).length >= 10) return;
    setForm({ ...form, images: [...(form.images ?? []), ""] });
  }

  function updateImageUrl(idx: number, value: string) {
    const updated = [...(form.images ?? [])];
    updated[idx] = value;
    setForm({ ...form, images: updated });
  }

  function removeImageUrl(idx: number) {
    const updated = (form.images ?? []).filter((_, i) => i !== idx);
    setForm({ ...form, images: updated });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
        <div className="flex items-center gap-3">
          {selectedProducts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Trash2 size={16} /> {bulkDeleting ? "Excluindo..." : `Excluir selecionados (${selectedProducts.size})`}
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#1B5E20] bg-white"
        />
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && products.every((p) => selectedProducts.has(p.id))}
                      onChange={toggleSelectAllProducts}
                      className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                    />
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Produto</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Categoria</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Preco</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Estoque</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${selectedProducts.has(product.id) ? "bg-green-50" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4 accent-[#1B5E20] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded object-cover border border-gray-100 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate max-w-48">{product.name}</p>
                          {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                          {product.barcode && <p className="text-xs text-gray-400">Cód: {product.barcode}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.categoryName}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm text-gray-800">{formatBRL(product.price)}</p>
                      {product.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">{formatBRL(product.originalPrice)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${product.stock < 10 ? "text-orange-600" : "text-gray-800"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {product.isActive ? "Ativo" : "Inativo"}
                      </span>
                      {product.isFeatured && (
                        <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          Destaque
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-gray-500 hover:text-[#1B5E20] hover:bg-green-50 rounded transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">{editProduct ? "Editar Produto" : "Novo Produto"}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-800">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">

                {/* Basic fields */}
                {[
                  { key: "name", label: "Nome", type: "text", required: true },
                  { key: "brand", label: "Marca", type: "text" },
                  { key: "sku", label: "Código de Fabricação", type: "text" },
                  { key: "barcode", label: "Código de Barras (EAN)", type: "text" },
                  { key: "price", label: "Preco (R$)", type: "number", required: true },
                  { key: "originalPrice", label: "Preco Original (R$)", type: "number" },
                  { key: "stock", label: "Estoque", type: "number", required: true },
                ].map(({ key, label, type, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(form[key as keyof typeof form] as string | number | undefined) ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                      required={required}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                    />
                  </div>
                ))}

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value, 10) })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                  >
                    <option value={0}>Selecione uma categoria</option>
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Imagem principal */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Imagem Principal *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      required
                      placeholder="URL da imagem ou faça upload..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                    />
                    <button
                      type="button"
                      onClick={() => mainImageInputRef.current?.click()}
                      disabled={uploadingMain}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
                    >
                      <Upload size={13} />
                      {uploadingMain ? "Enviando..." : "Upload"}
                    </button>
                    <input ref={mainImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
                  </div>
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" className="mt-2 h-20 w-20 rounded object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                </div>

                {/* Galeria de imagens (até 10) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <ImagePlus size={13} /> Galeria de Imagens ({(form.images ?? []).length}/10)
                  </label>
                  <input ref={galleryImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryImageUpload} />
                  <div className="space-y-2">
                    {(form.images ?? []).map((url, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => updateImageUrl(idx, e.target.value)}
                          placeholder={`URL da imagem ${idx + 1} ou faça upload`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20]"
                        />
                        <button
                          type="button"
                          disabled={uploadingGalleryIdx === idx}
                          onClick={() => { pendingGalleryIdxRef.current = idx; galleryImageInputRef.current?.click(); }}
                          className="p-1.5 text-[#1B5E20] hover:bg-green-50 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                          title="Upload imagem"
                        >
                          {uploadingGalleryIdx === idx ? <span className="text-[10px]">...</span> : <Upload size={14} />}
                        </button>
                        {url && (
                          <img src={url} alt="" className="h-9 w-9 rounded object-cover border border-gray-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageUrl(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {(form.images ?? []).length < 10 && (
                      <button
                        type="button"
                        onClick={addImageUrl}
                        className="flex items-center gap-1.5 text-xs text-[#1B5E20] hover:text-[#2E7D32] font-medium py-1"
                      >
                        <Plus size={13} /> Adicionar imagem
                      </button>
                    )}
                  </div>
                </div>

                {/* Descricao */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Descricao</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1B5E20] resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded border-gray-300 text-[#1B5E20]" />
                    <span className="text-sm text-gray-700">Produto em destaque</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300 text-[#1B5E20]" />
                    <span className="text-sm text-gray-700">Produto ativo</span>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={createProduct.isPending || updateProduct.isPending}
                    className="flex-1 py-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-semibold rounded-lg transition-colors disabled:opacity-70"
                  >
                    {editProduct ? "Salvar Alteracoes" : "Criar Produto"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
