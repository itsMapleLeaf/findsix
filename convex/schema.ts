import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export const roomImageValidator = v.object({
	id: v.string(),
	url: v.string(),
	tags: v.array(v.string()),
})

export default defineSchema({
	rooms: defineTable({
		slug: v.string(),
		image: v.union(v.null(), roomImageValidator),
		players: v.record(
			v.string(),
			v.object({
				score: v.number(),
				lastActiveTime: v.number(),
				startTime: v.optional(v.number()),
				foundTime: v.optional(v.number()),
				state: v.union(
					v.literal("playing"),
					v.literal("found"),
					v.literal("incorrect"),
					v.literal("skipped"),
				),
				tagMatches: v.record(v.string(), v.boolean()),
			}),
		),
	}).index("slug", ["slug"]),
})
