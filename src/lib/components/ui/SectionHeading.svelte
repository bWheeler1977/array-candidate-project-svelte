<script lang="ts">
	export let title: string;
	export let subtitle = '';
	export let id: string;
	/** panel: Figma secondary card titles (16px / medium). */
	export let variant: 'default' | 'panel' = 'default';
</script>

<header class="heading">
	<h2 {id} class="title" class:panel={variant === 'panel'}>{title}</h2>
	{#if subtitle}
		<p class="subtitle">{subtitle}</p>
	{/if}
</header>

<style>
	.title {
		font-size: var(--title-lg-fs);
		font-weight: var(--fw-semi-bold);
		color: var(--wl-text, var(--text-fg-ci));
	}

	.title.panel {
		font-size: var(--text-fs);
		font-weight: var(--fw-medium);
		line-height: 1;
		letter-spacing: 0;
		color: var(--c-black);
	}

	.subtitle {
		margin: var(--s-2) 0 0;
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-base);
		line-height: 17px;
		color: var(--wl-text-muted, var(--text-light-fg-ci));
	}
</style>
