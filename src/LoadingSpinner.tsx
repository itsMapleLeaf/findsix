import { Icon, type IconProps } from "@iconify/react"
import { twMerge } from "tailwind-merge"

export function LoadingSpinner(props: Partial<IconProps>) {
	return (
		<Icon
			icon="mingcute:loading-3-fill"
			{...props}
			className={twMerge("size-5 animate-spin", props.className)}
		/>
	)
}
