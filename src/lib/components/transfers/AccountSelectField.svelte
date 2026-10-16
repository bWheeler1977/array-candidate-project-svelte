<script lang="ts">
	/**
	 * Custom account picker (listbox). Keyboard: Arrow Up/Down, Home/End, typeahead, Enter to select, Escape to close.
	 * Focus stays on the trigger while open (aria-activedescendant highlights the active option).
	 */
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { getDomainsLookup } from '$lib/context/domains';
	import { openAccountSelectId, setOpenAccountSelectId } from '$lib/stores/accountSelectOpen';
	import type { AccountSummary } from '$lib/types/northwind';
	import { accountTransferPickerLabel } from '$lib/utils/account';
	import { formatCurrency } from '$lib/utils/format';
	import { findAccount } from '$lib/utils/transfer';
	import { msg, messages } from '$lib/i18n';

	export let id: string;
	export let name: string;
	export let label: string;
	/** Full account list for resolving the selected value label. */
	export let accountsCatalog: AccountSummary[] = [];
	/** Options shown in the menu (filtered). */
	export let options: AccountSummary[] = [];
	export let value = '';
	export let isInvalid = false;
	export let describedBy: string | undefined = undefined;
	export let isOptionDisabled: (account: AccountSummary) => boolean = () => false;
	export let optionHint: (account: AccountSummary) => string | undefined = () => undefined;

	const dispatch = createEventDispatcher<{ change: void }>();

	$: listboxId = `${id}-listbox`;
	const clearOptionId = `${id}-option-clear`;
	const optionId = (accountId: string) => `${id}-option-${accountId}`;
	$: menuRows = [
		{ type: 'clear' as const },
		...options.map((account) => ({ type: 'account' as const, account }))
	];

	let isOpen = false;
	let root: HTMLDivElement;
	let triggerElement: HTMLButtonElement;
	let menuElement: HTMLUListElement | undefined;
	let activeIndex = -1;
	let typeahead = '';
	let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

	$: domains = getDomainsLookup();
	$: selected = value ? findAccount(accountsCatalog, value) : undefined;
	$: activeRow = isOpen && activeIndex >= 0 ? menuRows[activeIndex] : undefined;
	$: activeDescendantId =
		activeRow?.type === 'clear'
			? clearOptionId
			: activeRow?.type === 'account'
				? optionId(activeRow.account.account_id)
				: undefined;

	/** Only one account picker menu open at a time (from vs to). */
	$: if (isOpen && $openAccountSelectId !== id) {
		closeMenu(false);
	}

	function enabledIndices(): number[] {
		return menuRows
			.map((row, index) => {
				if (row.type === 'clear') return index;
				return isOptionDisabled(row.account) ? -1 : index;
			})
			.filter((index) => index >= 0);
	}

	function initialActiveIndex(): number {
		if (value) {
			const selectedIndex = options.findIndex((account) => account.account_id === value);
			if (selectedIndex >= 0 && !isOptionDisabled(options[selectedIndex])) {
				return selectedIndex + 1;
			}
		}
		return enabledIndices()[0] ?? -1;
	}

	function openMenu() {
		setOpenAccountSelectId(id);
		isOpen = true;
		activeIndex = initialActiveIndex();
		void tick().then(scrollActiveOptionIntoView);
	}

	function closeMenu(restoreFocus = true) {
		isOpen = false;
		activeIndex = -1;
		typeahead = '';
		if (typeaheadTimer) clearTimeout(typeaheadTimer);
		openAccountSelectId.update((current) => (current === id ? null : current));
		if (restoreFocus) triggerElement?.focus();
	}

	function onTriggerFocus() {
		if ($openAccountSelectId && $openAccountSelectId !== id) {
			setOpenAccountSelectId(null);
		}
	}

	function toggle() {
		if (isOpen) closeMenu(false);
		else openMenu();
	}

	function clearSelection() {
		value = '';
		closeMenu();
		dispatch('change');
	}

	function choose(accountId: string) {
		const account = findAccount(accountsCatalog, accountId);
		if (account && isOptionDisabled(account)) return;
		value = accountId;
		closeMenu();
		dispatch('change');
	}

	function chooseMenuIndex(index: number) {
		const row = menuRows[index];
		if (!row) return;
		if (row.type === 'clear') {
			clearSelection();
			return;
		}
		choose(row.account.account_id);
	}

	function scrollActiveOptionIntoView() {
		if (!menuElement || activeIndex < 0) return;
		const row = menuRows[activeIndex];
		if (!row) return;
		const nodeId = row.type === 'clear' ? clearOptionId : optionId(row.account.account_id);
		const node = menuElement.querySelector<HTMLElement>(`#${nodeId}`);
		node?.scrollIntoView({ block: 'nearest' });
	}

	function moveActive(delta: number) {
		const enabled = enabledIndices();
		if (enabled.length === 0) return;

		const currentPos = enabled.indexOf(activeIndex);
		const nextPos =
			currentPos < 0
				? delta > 0
					? 0
					: enabled.length - 1
				: (currentPos + delta + enabled.length) % enabled.length;
		activeIndex = enabled[nextPos];
		scrollActiveOptionIntoView();
	}

	function jumpActive(edge: 'first' | 'last') {
		const enabled = enabledIndices();
		if (enabled.length === 0) return;
		activeIndex = edge === 'first' ? enabled[0] : enabled[enabled.length - 1];
		scrollActiveOptionIntoView();
	}

	function applyTypeahead(char: string) {
		typeahead = `${typeahead}${char}`.slice(-20);
		if (typeaheadTimer) clearTimeout(typeaheadTimer);
		typeaheadTimer = setTimeout(() => {
			typeahead = '';
		}, 500);

		const needle = typeahead.toLowerCase();
		const enabled = enabledIndices();
		const startPos = enabled.indexOf(activeIndex);
		const order =
			startPos >= 0
				? [...enabled.slice(startPos + 1), ...enabled.slice(0, startPos + 1)]
				: enabled;

		for (const index of order) {
			const row = menuRows[index];
			if (row.type !== 'account') continue;
			const labelText = accountTransferPickerLabel(row.account, domains).toLowerCase();
			if (labelText.includes(needle)) {
				activeIndex = index;
				scrollActiveOptionIntoView();
				return;
			}
		}
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) openMenu();
				else moveActive(1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (!isOpen) openMenu();
				else moveActive(-1);
				break;
			case 'Home':
				if (!isOpen) return;
				event.preventDefault();
				jumpActive('first');
				break;
			case 'End':
				if (!isOpen) return;
				event.preventDefault();
				jumpActive('last');
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (!isOpen) {
					openMenu();
				} else if (activeIndex >= 0) {
					chooseMenuIndex(activeIndex);
				}
				break;
			case 'Escape':
				if (!isOpen) return;
				event.preventDefault();
				closeMenu();
				break;
			case 'Tab':
				if (isOpen) closeMenu(false);
				break;
			default:
				if (!isOpen || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
					return;
				}
				if (/^[a-z0-9 ]$/i.test(event.key)) {
					event.preventDefault();
					applyTypeahead(event.key);
				}
		}
	}

	function onWindowClick(event: MouseEvent) {
		if (isOpen && root && !root.contains(event.target as Node)) {
			closeMenu(false);
		}
	}

	onMount(() => {
		window.addEventListener('click', onWindowClick);
		return () => {
			window.removeEventListener('click', onWindowClick);
			if (typeaheadTimer) clearTimeout(typeaheadTimer);
		};
	});
</script>

<div class="field" bind:this={root}>
	<label for={id}>{label}</label>
	<input type="hidden" {name} bind:value />
	<button
		type="button"
		bind:this={triggerElement}
		{id}
		class="trigger"
		class:invalid={isInvalid}
		class:open={isOpen}
		role="combobox"
		aria-autocomplete="none"
		aria-expanded={isOpen}
		aria-controls={listboxId}
		aria-activedescendant={activeDescendantId}
		aria-invalid={isInvalid ? 'true' : undefined}
		aria-describedby={describedBy}
		on:click|stopPropagation={toggle}
		on:focus={onTriggerFocus}
		on:keydown={onTriggerKeydown}
	>
		<span class="trigger-body">
			{#if selected}
				<span class="primary">{accountTransferPickerLabel(selected, domains)}</span>
				<span class="secondary">
					{msg(messages.transfers.accountSelect.balanceAvailable, {
						amount: formatCurrency(selected.balance, selected.currency)
					})}
				</span>
			{:else}
				<span class="placeholder">{messages.transfers.accountSelect.chooseAccount}</span>
			{/if}
		</span>
		<span class="chevron" aria-hidden="true">›</span>
	</button>

	{#if isOpen}
		<ul
			bind:this={menuElement}
			id={listboxId}
			class="menu"
			role="listbox"
			aria-label={label}
			tabindex="-1"
		>
			{#each menuRows as row, index (row.type === 'clear' ? 'clear' : row.account.account_id)}
				<li role="presentation">
					{#if row.type === 'clear'}
						<div
							id={clearOptionId}
							role="option"
							class="option option-clear"
							class:active={index === activeIndex}
							class:selected={!value}
							aria-selected={!value}
							tabindex="-1"
							on:click|stopPropagation={() => clearSelection()}
							on:keydown|stopPropagation={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									clearSelection();
								}
							}}
						>
							<span class="primary placeholder">{messages.transfers.accountSelect.chooseAccount}</span>
						</div>
					{:else}
						{@const account = row.account}
						{@const disabled = isOptionDisabled(account)}
						<div
							id={optionId(account.account_id)}
							role="option"
							class="option"
							class:selected={account.account_id === value}
							class:active={index === activeIndex}
							class:disabled
							aria-selected={account.account_id === value}
							aria-disabled={disabled}
							tabindex="-1"
							on:click|stopPropagation={() => choose(account.account_id)}
							on:keydown|stopPropagation={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									choose(account.account_id);
								}
							}}
						>
							<span class="primary">{accountTransferPickerLabel(account, domains)}</span>
							<span class="secondary">
								{#if optionHint(account)}
									{optionHint(account)}
								{:else}
									{msg(messages.transfers.accountSelect.balanceAvailable, {
										amount: formatCurrency(account.balance, account.currency)
									})}
								{/if}
							</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.field {
		position: relative;
		margin-bottom: var(--s-4);
	}

	label {
		display: block;
		height: 17px;
		margin-bottom: var(--s-2);
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-text, var(--text-fg-ci));
	}

	.trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s-3);
		box-sizing: border-box;
		min-height: 51px;
		padding: var(--s-3) var(--s-4);
		text-align: left;
		cursor: pointer;
		background: var(--wl-surface, var(--c-white));
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius-lg);
		font: inherit;
		color: inherit;
	}

	.trigger:hover {
		border-color: var(--wl-border, var(--c-gray));
	}

	.trigger:focus-visible {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: 2px;
	}

	.trigger.invalid {
		background: var(--input-error-bg-ci);
		border-color: var(--input-error-border-ci);
	}

	.trigger-body {
		display: flex;
		flex-direction: column;
		gap: var(--s-05);
		min-width: 0;
		flex: 1;
	}

	.primary {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-semi-bold);
		color: var(--wl-text, var(--text-fg-ci));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.secondary {
		font-size: var(--text-xs-fs);
		color: var(--wl-text-muted, var(--text-light-fg-ci));
	}

	.placeholder {
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
		color: var(--wl-primary, var(--c-blue));
	}

	.chevron {
		flex-shrink: 0;
		font-size: 1.25rem;
		line-height: 1;
		color: var(--wl-text-muted, var(--c-gray-dark));
		font-weight: var(--fw-medium);
	}

	.menu {
		position: absolute;
		z-index: var(--layer-2);
		left: 0;
		right: 0;
		top: calc(100% + var(--s-1));
		padding: var(--s-2);
		background: var(--wl-surface, var(--c-white));
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		max-height: 14rem;
		overflow-y: auto;
	}

	.option {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--s-05);
		padding: var(--s-3);
		border-radius: var(--radius-md);
		background: transparent;
		cursor: pointer;
		text-align: left;
		font: inherit;
		box-sizing: border-box;
	}

	.option:hover:not(.disabled),
	.option.active:not(.disabled),
	.option.selected:not(.disabled) {
		background: var(--wl-surface-muted, var(--c-gray-lighter));
	}

	.option.active:not(.disabled) {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: -2px;
	}

	.option.disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.option-clear .primary.placeholder {
		color: var(--wl-primary, var(--c-blue));
		font-weight: var(--fw-medium);
	}
</style>
