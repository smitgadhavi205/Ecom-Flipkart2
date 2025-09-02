import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Products table
  products: defineTable({
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
      size: v.optional(v.string()),
      brand_model: v.optional(v.string()),
      care_instructions: v.optional(v.string()),
      fabric_type: v.optional(v.string()),
      fit_type: v.optional(v.string()),
      fit: v.optional(v.string()),
      care: v.optional(v.string()),
      fabric_weight: v.optional(v.string()),
      collar_type: v.optional(v.string()),
      display_size: v.optional(v.string()),
      battery_life: v.optional(v.string()),
      connectivity: v.optional(v.array(v.string())),
      warranty: v.optional(v.string()),
      power_consumption: v.optional(v.string()),
      origin_country: v.optional(v.string()),
      warranty_period: v.optional(v.string()),
    }),
    inventory: v.number(),
    isActive: v.boolean(),
    tags: v.array(v.string()),
    rating: v.number(),
    reviewCount: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_brand", ["brand"])
    .index("by_active", ["isActive"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["category", "brand", "isActive"],
    }),

  // Categories table
  categories: defineTable({
    name: v.string(),
    description: v.string(),
    image: v.optional(v.id("_storage")),
    parentCategory: v.optional(v.id("categories")),
    isActive: v.boolean(),
  }).index("by_parent", ["parentCategory"]),

  // Shopping cart
  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

  // Wishlist
  wishlistItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),

  // Orders
  orders: defineTable({
    userId: v.id("users"),
    orderNumber: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      price: v.number(),
      quantity: v.number(),
    })),
    totalAmount: v.number(),
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
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    orderStatus: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
    estimatedDelivery: v.optional(v.number()),
    stripePaymentIntentId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_order_number", ["orderNumber"])
    .index("by_status", ["orderStatus"]),

  // Reviews
  reviews: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    orderId: v.id("orders"),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    images: v.optional(v.array(v.id("_storage"))),
    isVerifiedPurchase: v.boolean(),
    helpfulVotes: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_order", ["orderId"]),

  // User profiles (extends auth users)
  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    addresses: v.array(v.object({
      id: v.string(),
      fullName: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      phone: v.string(),
      isDefault: v.boolean(),
    })),
    role: v.union(v.literal("customer"), v.literal("admin")),
  }).index("by_user", ["userId"]),

  // Admin analytics
  analytics: defineTable({
    date: v.string(), // YYYY-MM-DD format
    totalSales: v.number(),
    totalOrders: v.number(),
    totalCustomers: v.number(),
    topProducts: v.array(v.object({
      productId: v.id("products"),
      sales: v.number(),
    })),
    categoryBreakdown: v.array(v.object({
      category: v.string(),
      sales: v.number(),
    })),
  }).index("by_date", ["date"]),

  // Support tickets
  supportTickets: defineTable({
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")),
    subject: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    assignedTo: v.optional(v.id("users")),
    messages: v.array(v.object({
      senderId: v.id("users"),
      message: v.string(),
      timestamp: v.number(),
      isAdmin: v.boolean(),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
