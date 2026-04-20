import { db } from "@workspace/db";
import { categoriesTable, productsTable, couponsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const categories = [
  { name: "Móveis", slug: "moveis", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400" },
  { name: "Roupas & Confecções", slug: "roupas", imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400" },
  { name: "Calçados", slug: "calcados", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
  { name: "Novidades", slug: "novidades", imageUrl: "https://images.unsplash.com/photo-1586495777744-4e6232bf7946?w=400" },
  { name: "Ofertas", slug: "ofertas", imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400" },
  { name: "Eletrônicos", slug: "eletronicos", imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400" },
];

const products = [
  {
    name: "Sofá Retrátil 3 Lugares Veludo",
    description: "Sofá confortável com tecido veludo premium, sistema retrátil e reclinável. Ideal para sala de estar.",
    price: "2499.90",
    originalPrice: "3199.90",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
    categorySlug: "moveis",
    stock: 15,
    brand: "MóveisBR",
    isFeatured: true,
    specifications: { Material: "Veludo", Lugares: "3", "Cor": "Cinza", "Garantia": "1 ano" },
  },
  {
    name: "Cama Box Queen Size com Cabeceira",
    description: "Cama box queen size completa com colchão molas ensacadas e cabeceira estofada.",
    price: "1899.00",
    originalPrice: "2500.00",
    imageUrl: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600",
    categorySlug: "moveis",
    stock: 8,
    brand: "SomnoMax",
    isFeatured: true,
    specifications: { Tamanho: "Queen (158x198cm)", Colchão: "Molas ensacadas", Altura: "65cm" },
  },
  {
    name: "Mesa de Jantar Madeira Maciça 6 Lugares",
    description: "Mesa de jantar em madeira maciça de eucalipto com acabamento natural. Design moderno e durável.",
    price: "1299.00",
    imageUrl: "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600",
    categorySlug: "moveis",
    stock: 6,
    brand: "MóveisBR",
    specifications: { Material: "Eucalipto", Lugares: "6", Dimensões: "180x90cm" },
  },
  {
    name: "Vestido Floral Midi Verão",
    description: "Vestido midi estampado floral, tecido leve e respirável. Perfeito para o verão brasileiro.",
    price: "149.90",
    originalPrice: "199.90",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600",
    categorySlug: "roupas",
    stock: 45,
    brand: "ModaBR",
    isFeatured: true,
    specifications: { Tecido: "Viscose", Comprimento: "Midi", Estampa: "Floral" },
  },
  {
    name: "Camiseta Premium Algodão Pima",
    description: "Camiseta masculina em algodão pima premium, extra macia e durável. Fit regular.",
    price: "89.90",
    originalPrice: "120.00",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
    categorySlug: "roupas",
    stock: 120,
    brand: "ModaBR",
    specifications: { Tecido: "Algodão Pima 100%", Fit: "Regular", "Origem": "Brasil" },
  },
  {
    name: "Jeans Skinny Feminino",
    description: "Calça jeans skinny feminina com elastano para máximo conforto. Corte moderno e versátil.",
    price: "199.90",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
    categorySlug: "roupas",
    stock: 60,
    brand: "DenimBR",
    isFeatured: true,
    specifications: { Tecido: "Jeans com Elastano", Tipo: "Skinny", "Fechamento": "Botão + Zíper" },
  },
  {
    name: "Tênis Running Performance",
    description: "Tênis de corrida com tecnologia de amortecimento avançado. Solado antiderrapante e cabedal respirável.",
    price: "399.90",
    originalPrice: "549.90",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    categorySlug: "calcados",
    stock: 30,
    brand: "SportsBR",
    isFeatured: true,
    specifications: { "Amortecimento": "EVA Premium", "Solado": "Borracha antiderrapante", "Cabedal": "Mesh respirável" },
  },
  {
    name: "Sandália Salto Fino Couro",
    description: "Sandália feminina em couro legítimo com salto fino de 7cm. Elegante e confortável.",
    price: "249.90",
    originalPrice: "329.90",
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600",
    categorySlug: "calcados",
    stock: 25,
    brand: "CalçadoBR",
    specifications: { Material: "Couro legítimo", "Altura do salto": "7cm", "Cor": "Nude" },
  },
  {
    name: "Tênis Casual Couro Masculino",
    description: "Tênis casual masculino em couro genuíno com palmilha memory foam. Sofisticado e durável.",
    price: "329.90",
    imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600",
    categorySlug: "calcados",
    stock: 20,
    brand: "CalçadoBR",
    isFeatured: true,
    specifications: { Material: "Couro genuíno", Palmilha: "Memory foam", "Solado": "Borracha" },
  },
  {
    name: "Smartphone 5G 256GB",
    description: "Smartphone flagship com câmera tripla 108MP, processador octa-core e bateria de 5000mAh.",
    price: "2799.90",
    originalPrice: "3499.90",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
    categorySlug: "eletronicos",
    stock: 10,
    brand: "TechBR",
    isFeatured: true,
    specifications: { Tela: "6.7 AMOLED", Câmera: "108MP tripla", Bateria: "5000mAh", "5G": "Sim" },
  },
  {
    name: "Notebook Ultrafino 14\"",
    description: "Notebook ultrafino com processador Core i7, 16GB RAM e SSD 512GB. Ideal para trabalho e estudo.",
    price: "4599.00",
    originalPrice: "5999.00",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600",
    categorySlug: "eletronicos",
    stock: 5,
    brand: "TechBR",
    specifications: { Processador: "Intel Core i7", RAM: "16GB DDR4", SSD: "512GB NVMe", Tela: "14\" Full HD IPS" },
  },
  {
    name: "Bolsa Couro Feminina Transversal",
    description: "Bolsa transversal feminina em couro sintético premium. Vários compartimentos e alça regulável.",
    price: "189.90",
    originalPrice: "249.90",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
    categorySlug: "novidades",
    stock: 35,
    brand: "FashionBR",
    isFeatured: true,
    specifications: { Material: "Couro sintético", Alça: "Regulável", Compartimentos: "3 internos" },
  },
];

const coupons = [
  { code: "BEMVINDO10", discountType: "percentage", discountValue: "10", maxUses: 100 },
  { code: "FRETE0", discountType: "fixed", discountValue: "30", maxUses: 500 },
  { code: "BLACK50", discountType: "percentage", discountValue: "50", maxUses: 50, expiresAt: new Date("2026-12-31") },
];

async function seed() {
  console.log("Seeding database...");

  // Check if already seeded
  const existingCats = await db.select({ count: sql<number>`count(*)::int` }).from(categoriesTable);
  if (existingCats[0].count > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Insert categories
  const insertedCategories = await db.insert(categoriesTable).values(categories.map(({ name, slug, imageUrl }) => ({ name, slug, imageUrl }))).returning();
  console.log(`Inserted ${insertedCategories.length} categories`);

  const catMap = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  // Insert products
  const productValues = products.map((p) => ({
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    imageUrl: p.imageUrl,
    images: [],
    categoryId: catMap.get(p.categorySlug)!,
    stock: p.stock,
    brand: p.brand ?? null,
    isFeatured: p.isFeatured ?? false,
    isActive: true,
    specifications: p.specifications ?? null,
  }));

  const insertedProducts = await db.insert(productsTable).values(productValues).returning();
  console.log(`Inserted ${insertedProducts.length} products`);

  // Insert coupons
  const insertedCoupons = await db.insert(couponsTable).values(coupons.map(c => ({
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    maxUses: c.maxUses ?? null,
    expiresAt: c.expiresAt ?? null,
    isActive: true,
  }))).returning();
  console.log(`Inserted ${insertedCoupons.length} coupons`);

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
