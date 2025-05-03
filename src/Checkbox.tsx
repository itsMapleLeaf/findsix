import { ComponentProps, useId } from "react"
import { twMerge } from "tailwind-merge"

export function Checkbox({
	onCheckedChange,
	label,
	...props
}: {
	onCheckedChange: (checked: boolean) => void
	label: string
} & ComponentProps<"input">) {
	const id = useId()
	return (
		<div className="flex items-center gap-2">
			<input
				type="checkbox"
				id={id}
				{...props}
				className={twMerge("peer size-4 accent-pink-300", props.className)}
				onChange={(event) => {
					props.onChange?.(event)
					onCheckedChange(event.target.checked)
				}}
			/>
			<label
				htmlFor={props.id ?? id}
				className="text-gray-400 peer-checked:text-pink-300"
			>
				{label}
			</label>
		</div>
	)
}
