import { type } from "arktype"
import { v } from "convex/values"
import { mapValues } from "es-toolkit"
import { adjective, animal, color, spaceSlug } from "space-slug"
import { internal, api } from "./_generated/api.js"
import {
	action,
	internalMutation,
	mutation,
	query,
} from "./_generated/server.js"
import { roomImageValidator } from "./schema.js"

export const get = query({
	args: {
		slug: v.string(),
	},
	async handler(ctx, args) {
		const room = await ctx.db
			.query("rooms")
			.withIndex("slug", (q) => q.eq("slug", args.slug))
			.first()
		return room
	},
})

export const getById = query({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, args) {
		return await ctx.db.get(args.roomId)
	},
})

export const create = mutation({
	args: {
		useAdultContent: v.optional(v.boolean()),
	},
	async handler(ctx, args) {
		const slug = spaceSlug([adjective(), color(), animal()])
		const domain = args.useAdultContent ? "e621.net" : "e926.net"

		await ctx.db.insert("rooms", {
			slug,
			domain,
			players: {},
			image: null,
		})

		return { slug }
	},
})

export const join = mutation({
	args: {
		roomId: v.id("rooms"),
		name: v.string(),
	},
	async handler(ctx, args) {
		const room = await ctx.db.get(args.roomId)
		if (!room) {
			throw new Error("room not found")
		}

		const { players } = room
		const player = (players[args.name] ??= {
			score: 0,
			lastActiveTime: 0,
			state: "playing",
			tagMatches: {},
		})
		player.lastActiveTime = Date.now()

		await ctx.db.patch(args.roomId, {
			players,
		})
	},
})

export const fetchNewImage = action({
	args: {
		roomId: v.id("rooms"),
	},
	async handler(ctx, args) {
		const room = await ctx.runQuery(api.rooms.getById, { roomId: args.roomId })
		if (!room) {
			throw new Error("room not found")
		}

		const PostsResponse = type({
			posts: type({
				id: type("number").pipe(String),
				sample: {
					url: "string",
				},
				tags: `Record<string, string[]>`,
			}).array(),
		})

		const image = await fetch(
			`https://${room.domain}/posts.json?limit=1&tags=order:random+~type:png+~type:jpg`,
		)
		const result = PostsResponse(await image.json())
		if (result instanceof type.errors) {
			throw new Error(`failed to fetch image: ${result.summary}`)
		}

		await ctx.runMutation(internal.rooms.setNextImage, {
			roomId: args.roomId,
			image: {
				id: String(result.posts[0].id),
				url: result.posts[0].sample.url,
				tags: Object.values(result.posts[0].tags).flat(),
			},
		})
	},
})

export const setNextImage = internalMutation({
	args: {
		roomId: v.id("rooms"),
		image: roomImageValidator,
	},
	async handler(ctx, args) {
		const room = await ctx.db.get(args.roomId)
		if (!room) {
			throw new Error("room not found")
		}
		const now = Date.now()
		await ctx.db.patch(args.roomId, {
			image: args.image,
			players: mapValues(room.players, (player) => ({
				...player,
				state: "playing" as const,
				tagMatches: {},
				startTime: now,
				foundTime: undefined,
			})),
		})
	},
})

export const guessImage = mutation({
	args: {
		roomId: v.id("rooms"),
		name: v.string(),
		imageId: v.string(),
	},
	async handler(ctx, args) {
		const room = await ctx.db.get(args.roomId)
		if (!room) {
			throw new Error("room not found")
		}

		const { players } = room
		const player = (players[args.name] ??= {
			score: 0,
			lastActiveTime: 0,
			state: "playing",
			tagMatches: {},
		})
		player.lastActiveTime = Date.now()

		if (player.state === "playing") {
			if (args.imageId === room.image?.id) {
				player.state = "found"
				player.score++
				player.foundTime = Date.now()
			} else {
				player.state = "incorrect"
			}
		}

		await ctx.db.patch(args.roomId, {
			players,
		})

		return {
			isCorrect: args.imageId === room.image?.id,
		}
	},
})

export const guessTags = mutation({
	args: {
		roomId: v.id("rooms"),
		name: v.string(),
		tags: v.array(v.string()),
	},
	async handler(ctx, args) {
		const room = await ctx.db.get(args.roomId)
		if (!room) {
			throw new Error("room not found")
		}

		const { players, image } = room
		if (!image) {
			throw new Error("no image")
		}

		const player = (players[args.name] ??= {
			score: 0,
			lastActiveTime: 0,
			state: "playing",
			tagMatches: {},
		})
		player.lastActiveTime = Date.now()

		if (player.state === "playing") {
			player.tagMatches = {
				...player.tagMatches,
				...Object.fromEntries(
					args.tags.map((tag) => [tag, image.tags.includes(tag)]),
				),
			}
		}

		await ctx.db.patch(args.roomId, {
			players,
		})

		return {
			tagMatches: player.tagMatches,
		}
	},
})
