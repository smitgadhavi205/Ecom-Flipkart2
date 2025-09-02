import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if user is admin
async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Must be logged in");

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();

  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required");
  }

  return userId;
}

// Get all categories with product counts
export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const categories = await ctx.db.query("categories").order("asc").collect();
    
    // Get product count for each category and image URLs
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const products = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", category.name))
          .collect();
        
        const imageUrl = category.image 
          ? await ctx.storage.getUrl(category.image)
          : null;

        return {
          ...category,
          productCount: products.length,
          imageUrl,
        };
      })
    );

    return categoriesWithStats;
  },
});

// Get single category
export const getCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) return null;

    const imageUrl = category.image 
      ? await ctx.storage.getUrl(category.image)
      : null;

    return {
      ...category,
      imageUrl,
    };
  },
});

// Create new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    image: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check if category name already exists
    const existingCategory = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingCategory) {
      throw new Error("Category with this name already exists");
    }

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      image: args.image,
      isActive: true,
    });

    return categoryId;
  },
});

// Update category
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.string(),
    image: v.optional(v.id("_storage")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { categoryId, ...updateData } = args;
    
    // Check if category name already exists (excluding current category)
    const existingCategory = await ctx.db
      .query("categories")
      .filter((q) => 
        q.and(
          q.eq(q.field("name"), args.name),
          q.neq(q.field("_id"), categoryId)
        )
      )
      .first();

    if (existingCategory) {
      throw new Error("Category with this name already exists");
    }

    // Get the old category to check if name is changing
    const oldCategory = await ctx.db.get(categoryId);
    if (!oldCategory) throw new Error("Category not found");

    await ctx.db.patch(categoryId, updateData);

    // If category name changed, update all products using this category
    if (oldCategory.name !== args.name) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", oldCategory.name))
        .collect();

      for (const product of products) {
        await ctx.db.patch(product._id, { category: args.name });
      }
    }
  },
});

// Delete category
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    // Check if any products are using this category
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", category.name))
      .collect();

    if (products.length > 0) {
      throw new Error(`Cannot delete category. ${products.length} products are using this category.`);
    }

    await ctx.db.delete(args.categoryId);
  },
});

// Toggle category active status
export const toggleCategoryStatus = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    await ctx.db.patch(args.categoryId, {
      isActive: !category.isActive,
    });
  },
});

// Generate upload URL for category images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Get category statistics
export const getCategoryStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const categories = await ctx.db.query("categories").collect();
    const products = await ctx.db.query("products").collect();

    const stats = {
      totalCategories: categories.length,
      activeCategories: categories.filter(c => c.isActive).length,
      totalProducts: products.length,
      categoriesWithProducts: 0,
      topCategories: [] as Array<{ name: string; productCount: number }>,
    };

    // Calculate category product counts
    const categoryProductCounts: Record<string, number> = {};
    
    for (const product of products) {
      if (!categoryProductCounts[product.category]) {
        categoryProductCounts[product.category] = 0;
      }
      categoryProductCounts[product.category]++;
    }

    stats.categoriesWithProducts = Object.keys(categoryProductCounts).length;

    // Get top 5 categories by product count
    stats.topCategories = Object.entries(categoryProductCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, productCount: count }));

    return stats;
  },
});

// Seed default categories
export const seedDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const defaultCategories = [
      {
        name: "Electronics",
        description: "Smartphones, laptops, tablets, and electronic gadgets",
      },
      {
        name: "Fashion",
        description: "Clothing, shoes, accessories, and fashion items",
      },
      {
        name: "Furniture & Home",
        description: "Furniture, home decor, and interior design items",
      },
      {
        name: "Food & Grocery",
        description: "Food items, beverages, and grocery essentials",
      },
      {
        name: "Health & Personal Care",
        description: "Healthcare products, beauty, and personal care items",
      },
      {
        name: "Sports & Outdoors",
        description: "Sports equipment, outdoor gear, and fitness products",
      },
      {
        name: "Books & Stationery",
        description: "Books, magazines, office supplies, and stationery",
      },
      {
        name: "Toys & Baby Products",
        description: "Toys, games, baby care, and children's products",
      },
      {
        name: "Automotive",
        description: "Car accessories, parts, and automotive products",
      },
      {
        name: "Home Essentials & Appliances",
        description: "Kitchen appliances, home essentials, and household items",
      },
    ];

    let createdCount = 0;
    
    for (const categoryData of defaultCategories) {
      // Check if category already exists
      const existing = await ctx.db
        .query("categories")
        .filter((q) => q.eq(q.field("name"), categoryData.name))
        .first();

      if (!existing) {
        await ctx.db.insert("categories", {
          ...categoryData,
          isActive: true,
        });
        createdCount++;
      }
    }

    return `Created ${createdCount} new categories`;
  },
});
