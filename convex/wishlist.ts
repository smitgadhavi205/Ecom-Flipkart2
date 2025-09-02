import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's wishlist
export const getWishlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const wishlistItems = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const itemsWithProducts = await Promise.all(
      wishlistItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        if (!product) return null;

        const imageUrls = await Promise.all(
          product.images.map(async (imageId) => await ctx.storage.getUrl(imageId))
        );

        return {
          ...item,
          product: {
            ...product,
            imageUrls,
          },
        };
      })
    );

    return itemsWithProducts.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});

// Add to wishlist
export const addToWishlist = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Check if already in wishlist
    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_product", (q) => q.eq("userId", userId).eq("productId", args.productId))
      .unique();

    if (existing) {
      throw new Error("Product already in wishlist");
    }

    return await ctx.db.insert("wishlistItems", {
      userId,
      productId: args.productId,
    });
  },
});

// Remove from wishlist
export const removeFromWishlist = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const item = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_product", (q) => q.eq("userId", userId).eq("productId", args.productId))
      .unique();

    if (!item) throw new Error("Product not in wishlist");

    await ctx.db.delete(item._id);
  },
});

// Check if product is in wishlist
export const isInWishlist = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const item = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_product", (q) => q.eq("userId", userId).eq("productId", args.productId))
      .unique();

    return !!item;
  },
});
