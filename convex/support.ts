import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's support tickets
export const getUserTickets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return tickets;
  },
});

// Create support ticket
export const createTicket = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    orderId: v.optional(v.id("orders")),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Verify order belongs to user if provided
    if (args.orderId) {
      const order = await ctx.db.get(args.orderId);
      if (!order || order.userId !== userId) {
        throw new Error("Order not found or doesn't belong to user");
      }
    }

    const ticketId = await ctx.db.insert("supportTickets", {
      userId,
      orderId: args.orderId,
      subject: args.subject,
      description: args.description,
      status: "open",
      priority: args.priority,
      messages: [
        {
          senderId: userId,
          message: args.description,
          timestamp: Date.now(),
          isAdmin: false,
        },
      ],
    });

    return ticketId;
  },
});

// Add message to ticket
export const addMessage = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.userId !== userId) {
      throw new Error("Ticket not found or access denied");
    }

    const newMessage = {
      senderId: userId,
      message: args.message,
      timestamp: Date.now(),
      isAdmin: false,
    };

    await ctx.db.patch(args.ticketId, {
      messages: [...ticket.messages, newMessage],
    });
  },
});

// Admin: Get all tickets
export const getAllTickets = query({
  args: {
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check admin access
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const tickets = args.status
      ? await ctx.db
          .query("supportTickets")
          .withIndex("by_status", (q) => q.eq("status", args.status as any))
          .order("desc")
          .take(args.limit || 50)
      : await ctx.db
          .query("supportTickets")
          .order("desc")
          .take(args.limit || 50);

    // Get user details for each ticket
    const ticketsWithUsers = await Promise.all(
      tickets.map(async (ticket) => {
        const user = await ctx.db.get(ticket.userId);
        return {
          ...ticket,
          user: user ? { email: user.email, name: user.name } : null,
        };
      })
    );

    return ticketsWithUsers;
  },
});

// Admin: Update ticket status
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    // Check admin access
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.ticketId, {
      status: args.status,
    });
  },
});

// Admin: Add admin message to ticket
export const addAdminMessage = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Check admin access
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const newMessage = {
      senderId: userId,
      message: args.message,
      timestamp: Date.now(),
      isAdmin: true,
    };

    await ctx.db.patch(args.ticketId, {
      messages: [...ticket.messages, newMessage],
    });
  },
});

// Admin: Assign ticket
export const assignTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check admin access
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.ticketId, {
      assignedTo: args.assignedTo,
    });
  },
});
