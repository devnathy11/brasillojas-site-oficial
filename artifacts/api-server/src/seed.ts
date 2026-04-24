import { db } from "@workspace/db";
import { categoriesTable, productsTable, couponsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const categories = [
  { name: "Móveis", slug: "moveis", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400" },
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

  // Step 1: Normalize existing categories — ensure all known slugs have correct names
  // This fixes any stale or incorrectly named categories (e.g. "S" → "Eletrônicos")
  for (const { slug, name } of categories) {
    await db.update(categoriesTable)
      .set({ name })
      .where(eq(categoriesTable.slug, slug));
  }
  // Also fix any row with literal name "S" that was not caught by slug matching
  await db.update(categoriesTable)
    .set({ name: "Eletrônicos" })
    .where(eq(categoriesTable.name, "S"));

  // Step 2: Upsert canonical categories — insert any that are missing by slug
  const existingCats = await db.query.categoriesTable.findMany();
  const existingSlugs = new Set(existingCats.map((c) => c.slug));
  const missingCats = categories.filter(({ slug }) => !existingSlugs.has(slug));

  let catMap = new Map(existingCats.map((c) => [c.slug, c.id]));

  if (missingCats.length > 0) {
    const inserted = await db.insert(categoriesTable)
      .values(missingCats.map(({ name, slug, imageUrl }) => ({ name, slug, imageUrl })))
      .returning();
    console.log(`Inserted ${inserted.length} missing categories: ${inserted.map((c) => c.slug).join(", ")}`);
    for (const c of inserted) catMap.set(c.slug, c.id);
  } else {
    console.log("All canonical categories already present, skipping category insert.");
  }

  // Only insert products if the table is empty (fresh install)
  const existingProducts = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable);
  if (existingProducts[0].count > 0) {
    console.log("Products already exist, skipping product seed.");
  } else {
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
  }

  // Insert coupons only if table is empty
  const existingCoupons = await db.select({ count: sql<number>`count(*)::int` }).from(couponsTable);
  if (existingCoupons[0].count > 0) {
    console.log("Coupons already exist, skipping coupon seed.");
  } else {
    const insertedCoupons = await db.insert(couponsTable).values(coupons.map((c) => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxUses: c.maxUses ?? null,
      expiresAt: c.expiresAt ?? null,
      isActive: true,
    }))).returning();
    console.log(`Inserted ${insertedCoupons.length} coupons`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
