<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	import { messages } from '$lib/i18n';
</script>

<div class="skeleton-page" aria-busy="true" aria-label={messages.a11y.loadingAccounts}>
	<div class="layout">
		<div class="primary">
			<div class="balance-card">
				<Skeleton width="6rem" height="0.875rem" radius="var(--radius-md)" />
				<Skeleton width="55%" height="2.5rem" radius="var(--radius-md)" />
				<Skeleton width="7rem" height="0.875rem" radius="var(--radius-md)" />
			</div>

			<div class="section">
				<Skeleton width="8rem" height="1.25rem" />
				<div class="account-cards">
					{#each [1, 2, 3] as _ (_)}
						<div class="account-card">
							<div class="left">
								<Skeleton width="10rem" height="1.125rem" />
								<Skeleton width="7rem" height="0.75rem" />
							</div>
							<div class="right">
								<Skeleton width="5rem" height="1.125rem" />
								<Skeleton width="3.5rem" height="0.75rem" />
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="aside">
			<div class="activity-panel">
				<Skeleton width="9rem" height="1.25rem" />
				<Skeleton width="14rem" height="0.875rem" />
				<div class="activity-list">
					{#each [1, 2, 3] as _ (_)}
						<div class="activity-row">
							<Skeleton width="2.5rem" height="2.5rem" radius="var(--radius-round)" />
							<div class="activity-copy">
								<Skeleton width="8rem" height="0.875rem" />
								<Skeleton width="10rem" height="0.75rem" />
							</div>
							<Skeleton width="4rem" height="0.875rem" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.skeleton-page {
		width: 100%;
	}

	.layout {
		display: grid;
		gap: var(--s-12);
	}

	.primary {
		display: grid;
		gap: var(--s-6);
		min-width: 0;
	}

	.balance-card {
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
		padding: var(--s-6);
		border-radius: var(--wl-radius-card, var(--radius-xl));
		background: var(--c-blue-lighter);
		border: var(--border-size-thin) solid var(--c-blue-light);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.account-cards {
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
	}

	.account-card {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s-4);
		padding: var(--s-4) var(--s-5);
		background: var(--wl-surface, var(--c-white));
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.left,
	.right {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
	}

	.right {
		align-items: flex-end;
	}

	.activity-panel {
		padding: var(--s-5);
		border-radius: var(--wl-radius-card, var(--radius-xl));
		background: var(--wl-surface-muted, var(--c-gray-lighter));
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		box-sizing: border-box;
	}

	.activity-list {
		padding: var(--s-4);
		background: var(--wl-surface, var(--c-white));
		border-radius: var(--radius-lg);
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.activity-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: var(--s-3);
		align-items: center;
	}

	.activity-copy {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		min-width: 0;
	}

	.aside {
		min-width: 0;
	}

	@media (min-width: 900px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			align-items: start;
		}
	}
</style>
