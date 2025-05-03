import { useMutation } from "convex/react"
import { useActionState, useState } from "react"
import { navigate } from "wouter/use-browser-location"
import { api } from "../convex/_generated/api"
import { Button } from "./Button.tsx"
import { Checkbox } from "./Checkbox.tsx"

export function NewGame() {
	const createRoomMutation = useMutation(api.rooms.create)
	const [useAdultContent, setUseAdultContent] = useState(false)
	const [, createRoom, createRoomPending] = useActionState(
		async function createRoom() {
			const result = await createRoomMutation({ useAdultContent })
			navigate(`/play/${result.slug}`)
		},
		undefined,
	)

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gray-950 p-4">
			<h1 className="text-3xl font-light text-white">findsix</h1>
			<form action={createRoom} className="contents">
				<Checkbox
					name="useAdultContent"
					label="e621 mode (18+ content)"
					checked={useAdultContent}
					onCheckedChange={(checked) => setUseAdultContent(checked)}
				/>
				<Button
					type="submit"
					icon="mingcute:plus-fill"
					pending={createRoomPending}
				>
					New Game
				</Button>
			</form>
		</div>
	)
}
