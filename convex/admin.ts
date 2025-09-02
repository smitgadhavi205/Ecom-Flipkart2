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

// Get analytics data
export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Get total sales from all orders
    const orders = await ctx.db.query("orders").collect();
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;

    // Get total customers
    const customers = await ctx.db.query("users").collect();
    const totalCustomers = customers.length;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get top products by sales
    const productSales: Record<string, { sales: number; name: string }> = {};
    
    for (const order of orders) {
      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { sales: 0, name: item.productName };
        }
        productSales[item.productId].sales += item.quantity * item.price;
      }
    }

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b.sales - a.sales)
      .slice(0, 5)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        sales: data.sales,
      }));

    // Get category breakdown
    const categoryBreakdown: Record<string, number> = {};
    
    for (const order of orders) {
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          if (!categoryBreakdown[product.category]) {
            categoryBreakdown[product.category] = 0;
          }
          categoryBreakdown[product.category] += item.quantity * item.price;
        }
      }
    }

    const categoryData = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([category, sales]) => ({ category, sales }));

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      topProducts,
      categoryBreakdown: categoryData,
    };
  },
});

// Get all products for admin
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const products = await ctx.db.query("products").order("desc").collect();
    
    // Get image URLs for each product
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const imageUrls = await Promise.all(
          product.images.map(async (imageId) => {
            return await ctx.storage.getUrl(imageId);
          })
        );
        return { ...product, imageUrls: imageUrls.filter(Boolean) };
      })
    );

    return productsWithImages;
  },
});

// Get all orders for admin
export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const orders = await ctx.db.query("orders").order("desc").collect();
    
    // Get user details for each order
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        return {
          ...order,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return ordersWithUsers;
  },
});

// Get recent orders
export const getRecentOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .take(args.limit || 10);
    
    // Get user details for each order
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        return {
          ...order,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return ordersWithUsers;
  },
});

// Get all customers
export const getAllCustomers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    
    // Get order statistics for each customer
    const customersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        return {
          ...user,
          orderCount: orders.length,
          totalSpent,
        };
      })
    );

    return customersWithStats;
  },
});

// Create new product
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    category: v.string(),
    brand: v.string(),
    images: v.array(v.id("_storage")),
    specifications: v.object({
      weight: v.optional(v.string()),
      dimensions: v.optional(v.string()),
      color: v.optional(v.string()),
      material: v.optional(v.string()),
    }),
    inventory: v.number(),
    isActive: v.boolean(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const productId = await ctx.db.insert("products", {
      ...args,
      rating: 0,
      reviewCount: 0,
    });

    return productId;
  },
});

// Update product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    category: v.string(),
    brand: v.string(),
    images: v.array(v.id("_storage")),
    specifications: v.object({
      weight: v.optional(v.string()),
      dimensions: v.optional(v.string()),
      color: v.optional(v.string()),
      material: v.optional(v.string()),
    }),
    inventory: v.number(),
    isActive: v.boolean(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { productId, ...updateData } = args;
    await ctx.db.patch(productId, updateData);
  },
});

// Delete product
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.delete(args.productId);
  },
});

// Update order status
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.orderId, {
      orderStatus: args.status,
    });
  },
});

// Generate upload URL for product images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Toggle product active status
export const toggleProductStatus = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    await ctx.db.patch(args.productId, {
      isActive: !product.isActive,
    });
  },
});

// Get low stock products
export const getLowStockProducts = query({
  args: { threshold: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const threshold = args.threshold || 10;
    const products = await ctx.db.query("products").collect();
    
    return products.filter(product => 
      product.inventory <= threshold && product.isActive
    );
  },
});

// Get sales by date range
export const getSalesByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const orders = await ctx.db.query("orders").collect();
    
    const filteredOrders = orders.filter(order => 
      order._creationTime >= args.startDate && 
      order._creationTime <= args.endDate
    );

    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = filteredOrders.length;

    return {
      totalSales,
      totalOrders,
      orders: filteredOrders,
    };
  },
});
