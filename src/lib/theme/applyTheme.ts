import type { AppTheme, ThemeCssVarMap } from './types';

export function themeToCssVars(theme: AppTheme): ThemeCssVarMap {
	const { colors, radii } = theme;
	return {
		'--wl-primary': colors.primary,
		'--wl-primary-fg': colors.primaryForeground,
		'--wl-surface': colors.surface,
		'--wl-surface-muted': colors.surfaceMuted,
		'--wl-border': colors.border,
		'--wl-text': colors.text,
		'--wl-text-muted': colors.textMuted,
		'--wl-negative': colors.negative,
		'--wl-positive': colors.positive,
		'--wl-inactive-surface': colors.inactiveSurface,
		'--wl-inactive-text': colors.inactiveText,
		'--wl-nav-active': colors.navActive,
		'--wl-nav-inactive': colors.navInactive,
		'--wl-radius-card': radii?.card ?? 'var(--radius-xl)',
		'--wl-radius-pill': radii?.pill ?? 'var(--radius-round)'
	};
}

export function cssVarsToStyle(vars: ThemeCssVarMap): string {
	return Object.entries(vars)
		.map(([key, value]) => `${key}: ${value}`)
		.join('; ');
}
