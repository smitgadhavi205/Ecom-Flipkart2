import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get reviews for a product
export const getProductReviews = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(args.limit || 20);

    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        const imageUrls = review.images 
          ? await Promise.all(review.images.map(async (imageId) => await ctx.storage.getUrl(imageId)))
          : [];

        return {
          ...review,
          user: user ? { name: user.name, email: user.email } : null,
          imageUrls,
        };
      })
    );

    return reviewsWithUsers;
  },
});

// Add review
export const addReview = mutation({
  args: {
    productId: v.id("products"),
    orderId: v.id("orders"),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Verify user purchased this product
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) {
      throw new Error("Order not found");
    }

    const hasPurchased = order.items.some(item => item.productId === args.productId);
    if (!hasPurchased) {
      throw new Error("You can only review products you've purchased");
    }

    // Check if user already reviewed this product for this order
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .unique();

    if (existingReview) {
      throw new Error("You've already reviewed this product for this order");
    }

    // Add review
    const reviewId = await ctx.db.insert("reviews", {
      userId,
      productId: args.productId,
      orderId: args.orderId,
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      images: args.images || [],
      isVerifiedPurchase: true,
      helpfulVotes: 0,
    });

    // Update product rating
    await updateProductRating(ctx, args.productId);

    return reviewId;
  },
});

// Update product rating (internal helper)
async function updateProductRating(ctx: any, productId: string) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_product", (q: any) => q.eq("productId", productId))
    .collect();

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await ctx.db.patch(productId as any, {
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviewCount: reviews.length,
  });
}

// Vote helpful on review
export const voteHelpful = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    await ctx.db.patch(args.reviewId, {
      helpfulVotes: review.helpfulVotes + 1,
    });
  },
});
