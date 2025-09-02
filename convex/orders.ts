import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Create order
export const createOrder = mutation({
  args: {
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
    shippingAddress: v.object({
      fullName: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      phone: v.string(),
    }),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      
      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      // Update inventory
      await ctx.db.patch(item.productId, {
        inventory: product.inventory - item.quantity,
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId,
      orderNumber,
      items: orderItems,
      totalAmount,
      shippingAddress: args.shippingAddress,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
      estimatedDelivery: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // Clear cart after successful order
    await ctx.runMutation(api.cart.clearCart, {});

    return { orderId, orderNumber };
  },
});

// Get user orders
export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return orders;
  },
});

// Get order by ID
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) {
      throw new Error("Order not found");
    }

    return order;
  },
});

// Admin: Get all orders
export const getAllOrders = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("orderStatus", args.status as any))
        .order("desc")
        .take(args.limit || 50);
    } else {
      orders = await ctx.db
        .query("orders")
        .order("desc")
        .take(args.limit || 50);
    }

    // Get user details for each order
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        return {
          ...order,
          user: user ? { email: user.email, name: user.name } : null,
        };
      })
    );

    return ordersWithUsers;
  },
});

// Admin: Update order status
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { orderStatus: args.status };
    
    if (args.trackingNumber) {
      updates.trackingNumber = args.trackingNumber;
    }

    await ctx.db.patch(args.orderId, updates);
  },
});

// Create Stripe payment intent
export const createPaymentIntent = action({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(api.orders.getOrder, { orderId: args.orderId });
    if (!order) throw new Error("Order not found");

    // This would integrate with Stripe in a real app
    // For now, we'll simulate a successful payment
    const paymentIntentId = `pi_${Math.random().toString(36).substr(2, 24)}`;

    // Update payment status directly
    await ctx.runMutation(internal.orders.updatePaymentStatus, {
      orderId: args.orderId,
      paymentStatus: "paid",
      paymentIntentId,
    });

    return { paymentIntentId, clientSecret: `${paymentIntentId}_secret` };
  },
});

// Internal: Update payment status
export const updatePaymentStatus = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { paymentStatus: args.paymentStatus };
    
    if (args.paymentIntentId) {
      updates.stripePaymentIntentId = args.paymentIntentId;
    }

    // Auto-confirm order when payment is successful
    if (args.paymentStatus === "paid") {
      updates.orderStatus = "confirmed";
    }

    await ctx.db.patch(args.orderId, updates);
  },
});
