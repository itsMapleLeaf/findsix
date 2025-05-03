import { useMutation } from "convex/react"
import { useState } from "react"
import { navigate } from "wouter/use-browser-location"
import { api } from "../convex/_generated/api"
import { Button } from "./Button.tsx"

export function CreateRoom() {
	const createRoom = useMutation(api.rooms.create)
	const [useAdultContent, setUseAdultContent] = useState(false)

	return (
		<div className="flex flex-col items-center justify-center min-h-dvh bg-gray-950 p-4 gap-4">
			<h1 className="text-3xl font-light text-white">findsix</h1>

			<Button
				onClick={async () => {
					const result = await createRoom({ useAdultContent })
					navigate(`/play/${result.slug}`)
				}}
			>
				create room
			</Button>

			<div className="flex items-center gap-2 mb-4">
				<input
					type="checkbox"
					id="useAdultContent"
					checked={useAdultContent}
					onChange={(e) => setUseAdultContent(e.target.checked)}
					className="size-4 peer accent-pink-300"
				/>
				<label
					htmlFor="useAdultContent"
					className="text-gray-400 peer-checked:text-pink-300"
				>
					e621 mode (18+ content)
				</label>
			</div>
		</div>
	)
}
