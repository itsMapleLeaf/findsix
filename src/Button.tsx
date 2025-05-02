import type { ComponentProps } from "react"

export function Button(props: ComponentProps<"button">) {
	return (
		<button
			type="button"
			className="bg-pink-600 hover:bg-pink-700 transition hover:shadow-md px-3 py-1.5 text-white rounded-lg active:duration-0  active:bg-pink-500 active:translate-y-0.5 shadow-black/25"
			{...props}
		/>
	)
}
