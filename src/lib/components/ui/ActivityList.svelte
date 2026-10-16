<script lang="ts">
	export let emptyMessage = '';
	export let isEmpty = false;
	export let isCenterEmpty = true;
	/** inset: white nested card (Transfers panel). plain: rows sit on parent surface (Accounts activity). */
	export let variant: 'inset' | 'plain' = 'inset';
</script>

{#if isEmpty}
	<p class="empty" class:center={isCenterEmpty} role="status">{emptyMessage}</p>
{:else}
	<ul class="list" class:plain={variant === 'plain'}>
		<slot />
	</ul>
{/if}

<style>
	.list {
		padding: 0 var(--s-4);
		background: var(--wl-surface, var(--c-white));
		border-radius: var(--radius-lg);
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
	}

	.list.plain {
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 0;
		display: flex;
		flex-direction: column;
		gap: var(--s-6);
	}

	.empty {
		margin: var(--s-6) 0 var(--s-2);
		font-size: var(--text-sm-fs);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
	}

	.empty.center {
		text-align: center;
	}
</style>
