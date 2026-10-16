<script lang="ts">
	import ActivityIcon from './ActivityIcon.svelte';
	import { resolveActivityIconKind, type ActivityIconKind } from '$lib/utils/activityIcon';

	export let title: string;
	export let activityNote: string;
	export let amountLabel: string;
	export let isNegative = false;
	/** When set, overrides title-based icon inference. */
	export let iconKind: ActivityIconKind | undefined = undefined;
	/** Figma-style list: no row dividers (parent list uses gap). */
	export let isDivided = true;

	$: resolvedIconKind =
		iconKind ??
		resolveActivityIconKind({ title, isInternalTransfer: /\btransfer\b/i.test(title) });
</script>

<li class="row" class:divided={isDivided}>
	<div class="icon-badge" aria-hidden="true">
		<ActivityIcon kind={resolvedIconKind} />
	</div>
	<div class="copy">
		<p class="title">{title}</p>
		<p class="activity-note">{activityNote}</p>
	</div>
	<p class="amount" class:negative={isNegative} class:positive={!isNegative}>{amountLabel}</p>
</li>

<style>
	.row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: var(--s-3);
		align-items: center;
		height: 40px;
	}

	.row.divided {
		padding: var(--s-4) 0;
		border-bottom: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
	}

	.row.divided:last-child {
		border-bottom: none;
		padding-bottom: var(--s-1);
	}

	.icon-badge {
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border-radius: var(--wl-radius-pill, var(--radius-round));
		background: var(--c-gray-light);
		display: grid;
		place-items: center;
	}

	.copy {
		min-width: 0;
	}

	.title {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-text, var(--text-fg-ci));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.activity-note {
		margin: var(--s-05) 0 0;
		font-size: var(--text-xs-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
	}

	.amount {
		font-family: var(--number-font);
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-text, var(--text-fg-ci));
		white-space: nowrap;
	}

	.amount.negative {
		color: var(--wl-negative, var(--c-red));
	}

	.amount.positive {
		color: var(--wl-text, var(--text-fg-ci));
	}
</style>
