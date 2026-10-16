/** White-label theme tokens mapped to CSS custom properties on `.theme-root`. */
export interface AppTheme {
	id: string;
	brand: {
		name: string;
		/** Optional override; defaults to bundled wordmark asset when omitted. */
		logoSrc?: string;
		logoAlt?: string;
	};
	colors: {
		primary: string;
		primaryForeground: string;
		surface: string;
		surfaceMuted: string;
		border: string;
		text: string;
		textMuted: string;
		negative: string;
		positive: string;
		inactiveSurface: string;
		inactiveText: string;
		navActive: string;
		navInactive: string;
	};
	radii?: {
		card?: string;
		pill?: string;
	};
}

export type ThemeCssVarMap = Record<string, string>;
