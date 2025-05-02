import { useEffect, useState } from "react"
import { Button } from "./Button.tsx"

export function NameInputForm({
	onSubmit,
}: {
	onSubmit: (name: string) => void
}) {
	const [inputName, setInputName] = useState<string>("")

	useEffect(() => {
		const savedName = localStorage.getItem("playerName")
		if (savedName) {
			setInputName(savedName)
		}
	}, [])

	return (
		<div className="flex flex-col items-center justify-center min-h-dvh bg-gray-950 p-4 gap-4">
			<h1 className="text-3xl font-light text-white">findsix</h1>
			<form
				action={(fd) => {
					try {
						const nameValue = (fd.get("name") as string).slice(0, 50)
						localStorage.setItem("playerName", nameValue)
						onSubmit(nameValue)
					} catch (error) {
						console.error(error)
					}
				}}
				className="flex flex-col gap-2 w-72"
			>
				<label htmlFor="playerName" className="text-white">
					Enter your name
				</label>
				<input
					id="playerName"
					name="name"
					value={inputName}
					onChange={(event) => setInputName(event.target.value)}
					required
					className="bg-gray-800 text-white p-2 rounded border border-gray-700 focus:border-pink-500 focus:outline-none"
					autoFocus
				/>
				<Button type="submit" disabled={!inputName.trim()}>
					join
				</Button>
			</form>
		</div>
	)
}
