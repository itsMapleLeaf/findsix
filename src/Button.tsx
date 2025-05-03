import { Icon } from "@iconify/react"
import type { ComponentProps, ReactElement } from "react"
import { twMerge } from "tailwind-merge"
import { LoadingSpinner } from "./LoadingSpinner.tsx"

type ButtonProps = ComponentProps<"button"> & {
	icon?: string | ReactElement
	pending?: boolean
}

export function Button({ icon, children, pending, ...props }: ButtonProps) {
	return (
		<button
			type="button"
			{...props}
			className={twMerge(
				"flex w-fit items-center gap-2.5 rounded border border-pink-700 bg-pink-900/50 px-3 py-1.5 text-white shadow-black/25 transition hover:border-pink-600 hover:bg-pink-900/75 hover:shadow-md active:translate-y-0.5 active:border-pink-500 active:bg-pink-900 active:duration-0",
				pending && "pointer-events-none opacity-50",
				props.className,
			)}
			onClick={(event) => {
				if (pending) {
					event.preventDefault()
				} else {
					props.onClick?.(event)
				}
			}}
		>
			{pending ?
				<LoadingSpinner className="-mx-1 size-5" />
			: typeof icon === "string" ?
				<Icon icon={icon} className="-mx-1 size-5" />
			:	icon}
			{children}
		</button>
	)
}
