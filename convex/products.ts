import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// Get all products with pagination and filters
export const getProducts = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    brand: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("products").withIndex("by_active", (q) => q.eq("isActive", true));

    if (args.category && args.brand) {
      // If both category and brand are specified, use category index and filter by brand
      query = ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", args.category!));
    } else if (args.category) {
      query = ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", args.category!));
    } else if (args.brand) {
      query = ctx.db.query("products").withIndex("by_brand", (q) => q.eq("brand", args.brand!));
    }

    let products = await query.collect();

    // Apply brand filter if category was used for index
    if (args.category && args.brand) {
      products = products.filter(product => product.brand === args.brand);
    }

    // Apply price filters
    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      products = products.filter(product => {
        if (args.minPrice !== undefined && product.price < args.minPrice) return false;
        if (args.maxPrice !== undefined && product.price > args.maxPrice) return false;
        return true;
      });
    }

    // Apply sorting
    if (args.sortBy) {
      switch (args.sortBy) {
        case "price_low":
          products.sort((a, b) => a.price - b.price);
          break;
        case "price_high":
          products.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          products.sort((a, b) => b.rating - a.rating);
          break;
        case "newest":
          products.sort((a, b) => b._creationTime - a._creationTime);
          break;
      }
    }

    // Get image URLs for products
    const productsWithImages = await Promise.all(
      products.map(async (product) => ({
        ...product,
        imageUrls: await Promise.all(
          product.images.map(async (imageId) => await ctx.storage.getUrl(imageId))
        ),
      }))
    );

    // Manual pagination
    const startIndex = (args.paginationOpts.cursor ? parseInt(args.paginationOpts.cursor) : 0);
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedProducts = productsWithImages.slice(startIndex, endIndex);

    return {
      page: paginatedProducts,
      isDone: endIndex >= productsWithImages.length,
      continueCursor: endIndex >= productsWithImages.length ? null : endIndex.toString(),
    };
  },
});

// Search products
export const searchProducts = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_products", (q) => {
        let search = q.search("name", args.searchTerm);
        if (args.category) {
          search = search.eq("category", args.category);
        }
        return search.eq("isActive", true);
      })
      .paginate(args.paginationOpts);

    const productsWithImages = await Promise.all(
      results.page.map(async (product) => ({
        ...product,
        imageUrls: await Promise.all(
          product.images.map(async (imageId) => await ctx.storage.getUrl(imageId))
        ),
      }))
    );

    return {
      ...results,
      page: productsWithImages,
    };
  },
});

// Get single product by ID
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;

    const imageUrls = await Promise.all(
      product.images.map(async (imageId) => await ctx.storage.getUrl(imageId))
    );

    return {
      ...product,
      imageUrls,
    };
  },
});

// Get categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return Promise.all(
      categories.map(async (category) => ({
        ...category,
        imageUrl: category.image ? await ctx.storage.getUrl(category.image) : null,
      }))
    );
  },
});

// Admin: Add product
export const addProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    category: v.string(),
    subcategory: v.optional(v.string()),
    brand: v.string(),
    images: v.array(v.id("_storage")),
    specifications: v.object({
      weight: v.optional(v.string()),
      dimensions: v.optional(v.string()),
      color: v.optional(v.string()),
      material: v.optional(v.string()),
    }),
    inventory: v.number(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      isActive: true,
      rating: 0,
      reviewCount: 0,
    });
  },
});

// Admin: Update product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      price: v.optional(v.number()),
      originalPrice: v.optional(v.number()),
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      brand: v.optional(v.string()),
      inventory: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, args.updates);
  },
});

// Generate upload URL for product images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
