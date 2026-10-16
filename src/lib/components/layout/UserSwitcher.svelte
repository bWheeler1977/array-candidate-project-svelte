<script lang="ts">
	/**
	 * This component was added just for the purpose of demoing how the component works with different accounts.
	 * It is not part of the original project and would not be included in a shipped component.
	 * It was merely done to help parse through the account data from the endpoints, and for demo purposes.
	*/
	// POST /active-user then invalidateAll so layout reloads accounts, domains, and page data.
	import { invalidateAll } from '$app/navigation';
	import { clearPendingBalances } from '$lib/stores/pendingBalances';
	import { isSessionRefreshing } from '$lib/stores/sessionUi';
	import { messages } from '$lib/i18n';

	export let users: string[] = [];
	export let activeUser = '';
	/** compact: minimal chrome for toolbar next to Figma-style nav */
	export let variant: 'default' | 'compact' = 'default';

	let isSwitching = false;

	async function onUserChange(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const user = select.value;
		if (!user || user === activeUser || isSwitching) {
			select.value = activeUser;
			return;
		}

		isSwitching = true;
		isSessionRefreshing.set(true);
		try {
			const body = new FormData();
			body.set('user', user);
			const response = await fetch('/active-user', { method: 'POST', body });
			if (!response.ok) {
				select.value = activeUser;
				return;
			}
			clearPendingBalances();
			await invalidateAll();
		} catch {
			select.value = activeUser;
		} finally {
			isSwitching = false;
			isSessionRefreshing.set(false);
		}
	}
</script>

{#if users.length > 0}
	<div class="switcher" class:compact={variant === 'compact'}>
		<label class="label" for="active-user-select">{messages.userSwitcher.viewingAs}</label>
		<select
			id="active-user-select"
			name="user"
			class="select"
			class:compact={variant === 'compact'}
			value={activeUser}
			disabled={isSwitching || users.length <= 1}
			on:change={onUserChange}
		>
			{#each users as user (user)}
				<option value={user}>{user}</option>
			{/each}
		</select>
	</div>
{/if}

<style>
	.switcher {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		min-width: 0;
	}

	.label {
		font-size: var(--text-xs-fs);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
		white-space: nowrap;
	}

	.select {
		max-width: 11rem;
		min-width: 0;
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-text, var(--text-fg-ci));
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray));
		border-radius: var(--radius-lg);
		padding: var(--s-2) var(--s-3);
		background: var(--wl-surface, var(--c-white));
		cursor: pointer;
	}

	.select:disabled {
		opacity: 0.75;
		cursor: default;
	}

	.select:focus-visible {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: 2px;
	}

	.switcher.compact {
		padding-right: var(--s-4);
		margin-right: var(--s-1);
		border-right: var(--border-size-thin) solid var(--c-gray-light);
	}

	.select.compact {
		max-width: 9.5rem;
		padding: var(--s-1) var(--s-2);
		font-size: var(--text-xs-fs);
		border-color: var(--c-gray-light);
		background: var(--c-gray-lighter);
	}

	@media (max-width: 640px) {
		.switcher {
			flex-direction: column;
			align-items: stretch;
			width: 100%;
		}

		.switcher.compact {
			padding-right: 0;
			margin-right: 0;
			border-right: none;
		}

		.select,
		.select.compact {
			max-width: 100%;
			width: 100%;
		}
	}
</style>
