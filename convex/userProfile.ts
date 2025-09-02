import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user profile
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, args);
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        ...args,
        addresses: [],
        role: "customer",
      });
    }
  },
});

// Add address
export const addAddress = mutation({
  args: {
    fullName: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    phone: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    let profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      const profileId = await ctx.db.insert("userProfiles", {
        userId,
        addresses: [],
        role: "customer",
      });
      profile = await ctx.db.get(profileId);
    }

    const newAddress = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: args.fullName,
      addressLine1: args.addressLine1,
      addressLine2: args.addressLine2,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      country: args.country,
      phone: args.phone,
      isDefault: args.isDefault,
    };

    if (!profile) return;

    let addresses = [...profile.addresses];

    // If this is set as default, unset others
    if (args.isDefault) {
      addresses = addresses.map(addr => ({ ...addr, isDefault: false }));
    }

    addresses.push(newAddress);

    await ctx.db.patch(profile._id, { addresses });
  },
});

// Update address
export const updateAddress = mutation({
  args: {
    addressId: v.string(),
    fullName: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    let addresses = [...profile.addresses];
    const addressIndex = addresses.findIndex(addr => addr.id === args.addressId);
    
    if (addressIndex === -1) throw new Error("Address not found");

    // If setting as default, unset others
    if (args.isDefault) {
      addresses = addresses.map(addr => ({ ...addr, isDefault: false }));
    }

    // Update the address
    addresses[addressIndex] = { ...addresses[addressIndex], ...args };

    await ctx.db.patch(profile._id, { addresses });
  },
});

// Delete address
export const deleteAddress = mutation({
  args: { addressId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const addresses = profile.addresses.filter(addr => addr.id !== args.addressId);
    await ctx.db.patch(profile._id, { addresses });
  },
});
