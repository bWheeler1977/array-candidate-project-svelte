<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	import { messages } from '$lib/i18n';
</script>

<div class="skeleton-page" aria-busy="true" aria-label={messages.a11y.loadingTransfers}>
	<div class="layout">
			<div class="form-col">
				<Skeleton width="14rem" height="1.5rem" />
				<Skeleton width="18rem" height="0.875rem" />
				<div class="inputs-panel">
					<div class="fields">
						{#each [1, 2, 3] as _ (_)}
							<div class="field">
								<Skeleton width="5rem" height="0.875rem" />
								<Skeleton width="100%" height="3.25rem" />
							</div>
						{/each}
					</div>
					<Skeleton width="80%" height="0.75rem" />
					<Skeleton width="100%" height="3rem" radius="var(--radius-lg)" />
				</div>
			</div>

			<aside class="context-col">
				<div class="panel">
					<Skeleton width="9rem" height="1.25rem" />
					<Skeleton width="12rem" height="0.875rem" />
					<div class="summary-body">
						<Skeleton width="100%" height="3rem" />
					</div>
				</div>
				<div class="panel">
					<Skeleton width="10rem" height="1.25rem" />
					<Skeleton width="14rem" height="0.875rem" />
					<div class="list-body">
						{#each [1, 2, 3] as _ (_)}
							<div class="list-row">
								<Skeleton width="2rem" height="2rem" radius="var(--radius-round)" />
								<div class="list-copy">
									<Skeleton width="7rem" height="0.875rem" />
									<Skeleton width="9rem" height="0.75rem" />
								</div>
								<Skeleton width="4rem" height="0.875rem" />
							</div>
						{/each}
					</div>
				</div>
			</aside>
	</div>
</div>

<style>
	.skeleton-page {
		width: 100%;
	}

	.layout {
		display: grid;
		gap: var(--s-5);
		align-items: start;
	}

	.form-col {
		display: flex;
		flex-direction: column;
		gap: var(--s-5);
		min-width: 0;
	}

	.inputs-panel {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		padding: var(--s-4);
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius-xl);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
	}

	.context-col {
		display: flex;
		flex-direction: column;
		gap: var(--s-6);
		min-width: 0;
	}

	.panel {
		background: var(--c-gray-lighter);
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius-xl);
		padding: var(--s-4);
		display: flex;
		flex-direction: column;
		gap: var(--s-6);
		box-sizing: border-box;
	}

	.summary-body {
		padding-top: var(--s-1);
	}

	.list-body {
		display: flex;
		flex-direction: column;
		gap: var(--s-6);
	}

	.list-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: var(--s-3);
		align-items: center;
	}

	.list-copy {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		min-width: 0;
	}

	@media (min-width: 900px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: var(--s-6);
		}
	}
</style>
