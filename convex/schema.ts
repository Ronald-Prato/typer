import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user: defineTable({
    authId: v.string(),
    username: v.string(),
    nickname: v.string(),
    email: v.string(),
  })
    .index("by_auth_id", ["authId"])
    .index("by_username", ["username"]),
});
