// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			/** True when the host app initialized the widget via /embed/init (Bearer in httpOnly cookie). */
			isEmbedMode: boolean;
			embedAccountHolder: string | null;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
