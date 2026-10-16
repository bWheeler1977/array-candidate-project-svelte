<script lang="ts">
	import SectionHeading from './SectionHeading.svelte';

	/** elevated: white card + optional muted body; muted: gray shell; flat: white card, simple body */
	export let title: string;
	export let subtitle = '';
	export let headingId: string;
	export let variant: 'elevated' | 'muted' | 'flat' = 'elevated';
	export let isMutedBody = false;
	/** When true with muted variant, body scrolls and header stays visible (accounts activity column). */
	export let isScrollBody = false;
</script>

<section
	class="panel"
	class:elevated={variant === 'elevated'}
	class:muted={variant === 'muted'}
	class:flat={variant === 'flat'}
	class:scroll-host={isScrollBody && variant === 'muted'}
	aria-labelledby={headingId}
>
	<header class="header" class:divider={variant === 'elevated'}>
		<SectionHeading
			{title}
			{subtitle}
			id={headingId}
			variant={variant === 'muted' ? 'panel' : 'default'}
		/>
	</header>

	<div
		class="body"
		class:muted-body={isMutedBody}
		class:flat-body={variant === 'flat'}
		class:scroll-body={isScrollBody && variant === 'muted'}
	>
		<slot />
	</div>
</section>

<style>
	.panel {
		border-radius: var(--wl-radius-card, var(--radius-xl));
		box-sizing: border-box;
	}

	.panel.elevated,
	.panel.flat {
		background: var(--wl-surface, var(--c-white));
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.panel.muted {
		background: var(--c-gray-lighter);
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray));
		border-radius: var(--radius-xl);
		box-shadow: none;
		padding: var(--s-4);
	}

	.panel.muted.scroll-host {
		display: flex;
		flex-direction: column;
		min-height: 0;
		max-height: inherit;
		overflow: hidden;
	}

	.panel.elevated .header,
	.panel.flat .header {
		padding: var(--s-5) var(--s-5) var(--s-3);
	}

	.header.divider {
		border-bottom: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
	}

	.panel.muted .header {
		margin-bottom: var(--s-6);
	}

	.body {
		box-sizing: border-box;
	}

	.body.scroll-body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.body.muted-body {
		background: var(--wl-surface-muted, var(--c-gray-lighter));
		padding: var(--s-4) var(--s-5) var(--s-5);
		min-height: 10rem;
	}

	.body.flat-body {
		padding: 0 var(--s-5) var(--s-5);
	}
</style>
