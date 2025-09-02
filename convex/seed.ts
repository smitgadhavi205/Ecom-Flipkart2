import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Seed categories
export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const categories = [
      {
        name: "Electronics",
        description: "Latest gadgets and electronic devices",
        isActive: true,
      },
      {
        name: "Clothing",
        description: "Fashion and apparel for all occasions",
        isActive: true,
      },
      {
        name: "Footwear",
        description: "Shoes, sneakers, and athletic footwear",
        isActive: true,
      },
      {
        name: "Home & Garden",
        description: "Everything for your home and garden",
        isActive: true,
      },
      {
        name: "Sports & Outdoors",
        description: "Sports equipment and outdoor gear",
        isActive: true,
      },
      {
        name: "Books",
        description: "Books, magazines, and educational materials",
        isActive: true,
      },
    ];

    for (const category of categories) {
      await ctx.db.insert("categories", category);
    }

    return "Categories seeded successfully";
  },
});

// Seed sample products
export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const products = [
      {
        name: "iPhone 15 Pro",
        description: "The latest iPhone with advanced camera system and A17 Pro chip",
        price: 999,
        originalPrice: 1099,
        category: "Electronics",
        brand: "Apple",
        images: [],
        specifications: {
          weight: "187g",
          dimensions: "6.1 inches",
          color: "Natural Titanium",
          material: "Titanium",
        },
        inventory: 50,
        isActive: true,
        tags: ["smartphone", "apple", "premium"],
        rating: 4.8,
        reviewCount: 245,
      },
      {
        name: "Samsung Galaxy S24 Ultra",
        description: "Premium Android smartphone with S Pen and advanced AI features",
        price: 1199,
        originalPrice: 1299,
        category: "Electronics",
        brand: "Samsung",
        images: [],
        specifications: {
          weight: "232g",
          dimensions: "6.8 inches",
          color: "Titanium Black",
          material: "Titanium",
        },
        inventory: 35,
        isActive: true,
        tags: ["smartphone", "samsung", "android"],
        rating: 4.7,
        reviewCount: 189,
      },
      {
        name: "MacBook Air M3",
        description: "Ultra-thin laptop with M3 chip and all-day battery life",
        price: 1299,
        originalPrice: 1399,
        category: "Electronics",
        brand: "Apple",
        images: [],
        specifications: {
          weight: "1.24kg",
          dimensions: "13.6 inches",
          color: "Space Gray",
          material: "Aluminum",
        },
        inventory: 25,
        isActive: true,
        tags: ["laptop", "apple", "ultrabook"],
        rating: 4.9,
        reviewCount: 156,
      },
      {
        name: "Air Max Revolution",
        description: "Premium running shoes with advanced cushioning technology and breathable mesh upper",
        price: 129.99,
        originalPrice: 149.99,
        category: "Footwear",
        brand: "Nike",
        images: [],
        specifications: {
          weight: "285g",
          material: "Mesh and synthetic leather",
          color: "Black/White",
          sole: "Rubber with Air Max cushioning",
        },
        inventory: 45,
        isActive: true,
        tags: ["running", "athletic", "comfort", "breathable", "cushioned"],
        rating: 4.6,
        reviewCount: 342,
      },
      {
        name: "Levi's 501 Original Jeans",
        description: "Classic straight-leg jeans with authentic fit and feel",
        price: 89,
        originalPrice: 110,
        category: "Clothing",
        brand: "Levi's",
        images: [],
        specifications: {
          weight: "500g",
          dimensions: "32x32",
          color: "Dark Blue",
          material: "100% Cotton",
        },
        inventory: 75,
        isActive: true,
        tags: ["jeans", "denim", "classic"],
        rating: 4.6,
        reviewCount: 234,
      },
      {
        name: "KitchenAid Stand Mixer",
        description: "Professional-grade stand mixer for all your baking needs",
        price: 379,
        originalPrice: 429,
        category: "Home & Garden",
        brand: "KitchenAid",
        images: [],
        specifications: {
          weight: "10.9kg",
          dimensions: "14.2 x 8.7 x 14 inches",
          color: "Empire Red",
          material: "Die-cast Metal",
        },
        inventory: 20,
        isActive: true,
        tags: ["kitchen", "mixer", "baking"],
        rating: 4.8,
        reviewCount: 167,
      },
      {
        name: "The Great Gatsby",
        description: "Classic American novel by F. Scott Fitzgerald",
        price: 12,
        originalPrice: 15,
        category: "Books",
        brand: "Scribner",
        images: [],
        specifications: {
          weight: "200g",
          dimensions: "5.5 x 8.2 inches",
          color: "Multi",
          material: "Paper",
        },
        inventory: 200,
        isActive: true,
        tags: ["book", "classic", "literature"],
        rating: 4.4,
        reviewCount: 1205,
      },
      {
        name: "Sony WH-1000XM5 Headphones",
        description: "Industry-leading noise canceling wireless headphones",
        price: 399,
        originalPrice: 449,
        category: "Electronics",
        brand: "Sony",
        images: [],
        specifications: {
          weight: "250g",
          dimensions: "Over-ear",
          color: "Black",
          material: "Plastic/Metal",
        },
        inventory: 45,
        isActive: true,
        tags: ["headphones", "wireless", "noise-canceling"],
        rating: 4.7,
        reviewCount: 312,
      },
      {
        name: "Adidas Ultraboost 22",
        description: "High-performance running shoes with responsive Boost midsole",
        price: 189.99,
        originalPrice: 220,
        category: "Footwear",
        brand: "Adidas",
        images: [],
        specifications: {
          weight: "320g",
          material: "Primeknit textile",
          color: "Core Black",
          sole: "Continental rubber with Boost",
        },
        inventory: 38,
        isActive: true,
        tags: ["running", "boost", "performance", "lightweight"],
        rating: 4.7,
        reviewCount: 256,
      },
      {
        name: "Converse Chuck Taylor All Star",
        description: "Classic canvas sneakers with timeless design",
        price: 65,
        originalPrice: 75,
        category: "Footwear",
        brand: "Converse",
        images: [],
        specifications: {
          weight: "400g",
          material: "Canvas",
          color: "White",
          sole: "Rubber",
        },
        inventory: 120,
        isActive: true,
        tags: ["casual", "classic", "canvas", "lifestyle"],
        rating: 4.3,
        reviewCount: 189,
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }

    return "Products seeded successfully";
  },
});

// Create admin user
export const createAdminUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, { role: "admin" });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        role: "admin",
        addresses: [],
      });
    }

    return "Admin user created successfully";
  },
});

// Seed all data
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(api.seed.seedCategories, {});
    await ctx.runMutation(api.seed.seedProducts, {});
    return "All data seeded successfully";
  },
});
