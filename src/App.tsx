import { useState } from "react"
import "./App.css"

type View =
	| { type: "initial" }
	| { type: "findIt"; post: ESixPost }
	| { type: "wrong"; post: ESixPost }
	| { type: "right"; post: ESixPost }

type ESixPost = {
	id: number
	sample: {
		url: string
	}
}

function App() {
	const [view, setView] = useState<View>({ type: "initial" })

	const getRandomThing = async () => {
		const res = await fetch(
			"https://e926.net/posts.json?limit=1&tags=order:random+~type:png+~type:jpg",
		)
		const data = (await res.json()) as { posts: ESixPost[] }
		setView({
			type: "findIt",
			post: data.posts[0],
		})
	}

	if (view.type === "initial") {
		return (
			<button
				type="button"
				className="bg-pink-600 hover:bg-pink-700 transition hover:scale-105 hover:shadow-md px-3 py-2 text-white rounded-lg active:duration-0 active:scale-95 active:bg-pink-500 shadow-black/25"
				onClick={getRandomThing}
			>
				start
			</button>
		)
	}

	if (view.type === "findIt") {
		const handleIt = async (form: FormData) => {
			const foundId = Number(form.get("foundId"))
			if (foundId === view.post.id) {
				setView({
					type: "right",
					post: view.post,
				})
			} else {
				setView({
					type: "wrong",
					post: view.post,
				})
			}
		}

		return (
			<>
				<img src={view.post.sample.url} alt="" />
				<p>now go find it you bitch</p>
				<form action={handleIt}>
					<input name="foundId" placeholder="what is" />
					<button type="submit">yeah</button>
				</form>
				<p>(pretend there's a timer here)</p>
			</>
		)
	}

	if (view.type === "right") {
		return (
			<>
				<p>yay you did it</p>
				<button
					type="button"
					className="bg-pink-600 hover:bg-pink-700 transition hover:scale-105 hover:shadow-md px-3 py-2 text-white rounded-lg active:duration-0 active:scale-95 active:bg-pink-500 shadow-black/25"
					onClick={getRandomThing}
				>
					again
				</button>
			</>
		)
	}

	if (view.type === "wrong") {
		return (
			<>
				<p>no that's not right you dumb stupid idiot</p>
				<button
					type="button"
					className="bg-pink-600 hover:bg-pink-700 transition hover:scale-105 hover:shadow-md px-3 py-2 text-white rounded-lg active:duration-0 active:scale-95 active:bg-pink-500 shadow-black/25"
					onClick={() => {
						setView({
							type: "findIt",
							post: view.post,
						})
					}}
				>
					try.
				</button>
			</>
		)
	}

	return <p>what the fuck</p>
}

export default App
