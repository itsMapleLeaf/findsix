import { ConvexProvider, ConvexReactClient } from "convex/react"
import { Suspense } from "react"
import { Route, Switch } from "wouter"
import { RoomPage } from "./Gameplay.tsx"
import { NewGame } from "./NewGame.tsx"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export default function App() {
	return (
		<ConvexProvider client={convex}>
			<Suspense fallback={<p>pretend there's a pretty loading spinne here</p>}>
				<Switch>
					<Route path="/">
						<NewGame />
					</Route>
					<Route path="/play/:room">
						{(params) => <RoomPage slug={params.room} />}
					</Route>
				</Switch>
			</Suspense>
		</ConvexProvider>
	)
}
