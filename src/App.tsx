import * as Ariakit from "@ariakit/react"
import { type } from "arktype"
import {
	ConvexProvider,
	ConvexReactClient,
	useAction,
	useMutation,
	useQuery,
} from "convex/react"
import prettyMs from "pretty-ms"
import { useActionState, useEffect, useState, type ComponentProps } from "react"
import { Route, Switch } from "wouter"
import { navigate } from "wouter/use-browser-location"
import { api } from "../convex/_generated/api.js"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

function App() {
	return (
		<ConvexProvider client={convex}>
			<Switch>
				<Route path="/">
					<CreateRoomPage />
				</Route>
				<Route path="/play/:room">
					{(params) => <RoomPage slug={params.room} />}
				</Route>
			</Switch>
		</ConvexProvider>
	)
}

function CreateRoomPage() {
	const createRoom = useMutation(api.rooms.create)
	return (
		<>
			<Button
				onClick={async () => {
					const result = await createRoom()
					navigate(`/play/${result.slug}`)
				}}
			>
				new room
			</Button>
		</>
	)
}

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

function RoomPage({ slug }: { slug: string }) {
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
				`https://e926.net/posts.json?limit=320&tags=${query}`,
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
			<form
				action={async (fd) => {
					try {
						const name = (fd.get("name") as string).slice(0, 50)
						await join({
							roomId: room._id,
							name,
						})
						setName(name)
					} catch (error) {
						console.error(error)
					}
				}}
			>
				<p>enter name</p>
				<input name="name" required />
				<Button type="submit">enter</Button>
			</form>
		)
	}

	const player = room.players[name]

	return (
		<main className="flex min-h-dvh bg-gray-950 px-4 gap-4 items-start">
			<section className="flex flex-col gap-2 w-80 sticky top-0 py-4">
				{room.image && (
					<a href={room.image.url} target="_blank" rel="noreferrer">
						<img src={room.image.url} alt="" className="rounded-lg" />
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
									href={`https://e926.net/posts/${post.id}`}
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

type TagAutocompleteItem = {
	id: number
	name: string
	post_count: number
	category: number
	antecedent_name: string | null
}

function useDebouncedValue<T>(value: T, delay: number) {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(timeout)
		}
	}, [value, delay])

	return debouncedValue
}

function TagSearchInput({
	defaultValue,
	...props
}: ComponentProps<typeof Ariakit.Combobox>) {
	const [input, setInput] = useState(String(defaultValue ?? ""))
	const debouncedInput = useDebouncedValue(input, 500)
	const [tags, setTags] = useState<TagAutocompleteItem[]>([])
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (/\s+$/.test(debouncedInput)) return

		const lastWord = debouncedInput.split(/\s+/).at(-1)
		if (!lastWord) return

		const controller = new AbortController()

		void (async () => {
			const res = await fetch(
				`https://e926.net/tags/autocomplete.json?search%5Bname_matches%5D=${lastWord}&expiry=7`,
				{
					signal: controller.signal,
				},
			)
			if (!res.ok) {
				console.error("failed to fetch tags")
				setTags([])
				return
			}
			const data = (await res.json()) as TagAutocompleteItem[]
			setTags(data)
		})()

		return () => {
			controller.abort()
		}
	}, [debouncedInput])

	return (
		<Ariakit.ComboboxProvider
			open={open}
			setOpen={setOpen}
			value={input}
			setValue={setInput}
		>
			<Ariakit.ComboboxLabel className="sr-only">Search</Ariakit.ComboboxLabel>
			<Ariakit.Combobox
				{...props}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						setOpen(false)
					}
				}}
			/>
			<Ariakit.ComboboxPopover
				gutter={4}
				className="bg-gray-900 border-gray-700 border rounded p-1 flex flex-col gap-1 min-w-64 empty:hidden"
			>
				{input !== debouncedInput || /\s+$/.test(input)
					? null
					: tags.map((tag) => (
							<Ariakit.ComboboxItem
								key={tag.id}
								value={[
									...input.trim().split(/(\s+)/).slice(0, -1),
									tag.name,
								].join("")}
								className="px-2 py-1.5 hover:bg-gray-800 transition cursor-default data-focus-visible:bg-gray-800 rounded"
							>
								{tag.name}
							</Ariakit.ComboboxItem>
						))}
			</Ariakit.ComboboxPopover>
		</Ariakit.ComboboxProvider>
	)
}

function Button(props: ComponentProps<"button">) {
	return (
		<button
			type="button"
			className="bg-pink-600 hover:bg-pink-700 transition hover:shadow-md px-3 py-1.5 text-white rounded-lg active:duration-0  active:bg-pink-500 active:translate-y-0.5 shadow-black/25"
			{...props}
		/>
	)
}

export default App
