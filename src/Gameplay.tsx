import { type } from "arktype"
import { useAction, useMutation, useQuery } from "convex/react"
import prettyMs from "pretty-ms"
import { useActionState, useState } from "react"
import { api } from "../convex/_generated/api"
import { Button } from "./Button.tsx"
import { NameInputForm } from "./NameInputForm.tsx"
import { TagSearchInput } from "./TagSearchInput.tsx"

type SearchResponse = typeof SearchResponse.inferOut
const SearchResponse = type({
	posts: type({
		id: type("number").pipe(String),
		sample: {
			"url?": "string | null",
		},
		file: {
			"url?": "string | null",
		},
		preview: {
			"url?": "string | null",
		},
	}).array(),
})

export function RoomPage({ slug }: { slug: string }) {
	const room = useQuery(api.rooms.get, { slug })
	const join = useMutation(api.rooms.join)
	const fetchNewImage = useAction(api.rooms.fetchNewImage)
	const guessTags = useMutation(api.rooms.guessTags)
	const [name, setName] = useState<string>()

	type SearchState = {
		query: string
		posts: SearchResponse["posts"]
	}

	const [searchState, submitSearch, searchPending] = useActionState(
		async function submitSearch(state: SearchState, fd: FormData) {
			if (!room) {
				console.error("no room")
				return state
			}

			if (!name) {
				console.error("no name")
				return state
			}

			const query = fd.get("query") as string

			const response = await fetch(
				`https://${room.domain}/posts.json?limit=320&tags=${query}`,
			)

			await guessTags({
				roomId: room._id,
				name,
				tags: query.split(/\s+/).map((tag) => tag.trim()),
			})

			const result = SearchResponse(await response.json())
			if (result instanceof type.errors) {
				console.error(result.summary)
				return {
					query,
					posts: [],
				}
			}

			return {
				query,
				posts: result.posts,
			}
		},
		{
			query: "",
			posts: [],
		},
	)

	const guessImageMutation = useMutation(api.rooms.guessImage)
	const [, guessImage] = useActionState(async function guessImage(
		_state: { isCorrect: boolean } | null,
		fd: FormData,
	) {
		if (!name) {
			console.error("no name")
			return null
		}

		if (!room) {
			console.error("no room")
			return null
		}

		if (!room.image) {
			console.error("no image")
			return null
		}

		const imageId = fd.get("imageId") as string
		return await guessImageMutation({
			roomId: room._id,
			imageId,
			name,
		})
	}, null)

	if (room === undefined) {
		return <p>load</p>
	}

	if (room === null) {
		return <p>not</p>
	}

	if (!name) {
		return (
			<NameInputForm
				onSubmit={async (nameValue) => {
					try {
						await join({
							roomId: room._id,
							name: nameValue,
						})
						setName(nameValue)
					} catch (error) {
						console.error(error)
					}
				}}
			/>
		)
	}

	const player = room.players[name]

	return (
		<main className="flex min-h-dvh bg-gray-950 px-4 gap-4 items-start">
			<section className="flex flex-col gap-2 w-80 sticky top-0 py-4">
				{room.image && (
					<a href={room.image.url} target="_blank" rel="noreferrer">
						<img src={room.image.url} alt="" className="rounded" />
					</a>
				)}

				<Button
					type="button"
					onClick={async () => {
						await fetchNewImage({ roomId: room._id })
					}}
				>
					new image
				</Button>

				{player.state === "found" ? (
					<p>
						u did it :)
						{player.foundTime && player.startTime && (
							<span className="block text-gray-400">
								(found in {prettyMs(player.foundTime - player.startTime)})
							</span>
						)}
					</p>
				) : player.state === "incorrect" ? (
					<p>lol no try again</p>
				) : null}

				<div className="h-px bg-gray-800" />

				<ul>
					{Object.entries(room.players).map(([playerName, player]) => (
						<p key={playerName}>
							{playerName}: {player.score}{" "}
							<span className="text-gray-400">
								{player.state === "found" &&
								player.foundTime &&
								player.startTime ? (
									<>
										(found in {prettyMs(player.foundTime - player.startTime)})
									</>
								) : (
									`(${player.state})`
								)}
							</span>
						</p>
					))}
				</ul>
			</section>

			<section className="flex-1 flex flex-col gap-2">
				<header className="sticky top-0 bg-gray-950 py-4">
					<form action={submitSearch} className="flex gap-2">
						<TagSearchInput
							name="query"
							required
							defaultValue={searchState.query}
							domain={room.domain}
							className="flex-1"
						/>
						<Button type="submit" disabled={searchPending}>
							{searchPending ? "searching..." : "search"}
						</Button>
					</form>
					<div className="flex gap-x-3 gap-y-1 flex-wrap">
						{searchState.posts.length ? (
							<p>{searchState.posts.length} results</p>
						) : null}

						{Object.entries(player.tagMatches)
							.sort((a, b) => Number(b[1]) - Number(a[1]))
							.map(
								([tag, matches]) =>
									tag.trim() && (
										<p key={tag}>
											{matches ? "✅" : "❌"} {tag}
										</p>
									),
							)}
					</div>
				</header>

				<section className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 items-center justify-items-center flex-1 py-4">
					{searchState.posts.map((post) => {
						const url = post.preview.url ?? post.sample.url ?? post.file.url
						if (!url) return
						return (
							<form action={guessImage}>
								<input type="hidden" name="imageId" value={post.id} />
								<button
									key={post.id}
									type="submit"
									className="transition border border-transparent hover:border-pink-500 rounded overflow-clip"
								>
									<img src={url} alt="" />
								</button>
								<a
									href={`https://${room.domain}/posts/${post.id}`}
									target="_blank"
									rel="noreferrer"
									className="text-center p-1 w-full block"
								>
									view
								</a>
							</form>
						)
					})}
				</section>
			</section>
		</main>
	)
}
