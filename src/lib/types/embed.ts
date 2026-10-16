import type { AccountSummary } from './northwind';

/**
 * Configuration passed by the host banking app when mounting the widget.
 * The access token is never stored in the DOM — use POST /embed/init or configure().
 */
export interface HostWidgetConfig {
	/** Bearer token for NorthWind (or bank BFF) API calls. Required in embedded mode. */
	accessToken: string;
	/** When the token returns multiple holders, scope the widget to one customer. */
	accountHolderName?: string;
	/** Optional API base; defaults to env / widget origin proxy. */
	apiBaseUrl?: string;
	/**
	 * Optional account snapshot from the host (e.g. already loaded after login).
	 * Validated server-side; used only when non-empty. Live data still refreshes via API.
	 */
	accounts?: AccountSummary[];
}

export interface EmbedInitResponse {
	ok: boolean;
	accountHolderName: string;
	accountCount: number;
}

export type WidgetRuntimeMode = 'standalone' | 'embedded';
