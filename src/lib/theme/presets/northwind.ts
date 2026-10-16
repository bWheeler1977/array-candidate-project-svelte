import type { AppTheme } from '../types';
import defaultLogo from '$lib/assets/logo.svg';

export const northwindTheme: AppTheme = {
	id: 'northwind',
	brand: {
		name: 'NorthWind',
		logoSrc: defaultLogo,
		logoAlt: 'NorthWind'
	},
	colors: {
		primary: 'var(--c-blue)',
		primaryForeground: 'var(--c-white)',
		surface: 'var(--c-white)',
		surfaceMuted: 'var(--c-gray-lighter)',
		border: 'var(--c-gray-light)',
		text: 'var(--text-fg-ci)',
		textMuted: 'var(--text-light-fg-ci)',
		negative: 'var(--c-red)',
		positive: 'var(--text-fg-ci)',
		inactiveSurface: 'var(--c-gray-lighter)',
		inactiveText: 'var(--c-gray-dark)',
		navActive: 'var(--c-blue)',
		navInactive: 'var(--text-light-fg-ci)'
	},
	radii: {
		card: 'var(--radius-xl)',
		pill: 'var(--radius-round)'
	}
};
