import * as Ariakit from "@ariakit/react"
import { type ComponentProps, useEffect, useState } from "react"
import { useDebouncedValue } from "./useDebouncedValue.tsx"

type TagAutocompleteItem = {
	id: number
	name: string
	post_count: number
	category: number
	antecedent_name: string | null
}

export function TagSearchInput({
	defaultValue,
	domain = "e926.net",
	...props
}: ComponentProps<typeof Ariakit.Combobox> & { domain?: string }) {
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
				`https://${domain}/tags/autocomplete.json?search%5Bname_matches%5D=${lastWord}&expiry=7`,
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
	}, [debouncedInput, domain])

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
