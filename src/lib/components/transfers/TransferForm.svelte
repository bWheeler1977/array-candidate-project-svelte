<script lang="ts">
	import { onMount } from 'svelte';
	import AccountSelectField from './AccountSelectField.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { getDomainsLookup } from '$lib/context/domains';
	import { recordPendingTransfer } from '$lib/stores/pendingBalances';
	import { recordTransferEndpointHint } from '$lib/stores/transferHints';
	import type { AccountSummary } from '$lib/types/northwind';
	import { inactiveAccountTransferHint, isAccountActive } from '$lib/utils/account';
	import { currencyInputAffix, formatAmountInputValue } from '$lib/utils/format';
	import {
		findAccount,
		isSelectableFromAccount,
		isSelectableToAccount,
		parseAmount,
		type TransferFormErrors
	} from '$lib/utils/transfer';
	import { msg, messages } from '$lib/i18n';

	export let accounts: AccountSummary[] = [];
	export let fromAccountId = '';
	export let toAccountId = '';
	export let amount = '';
	export let reference = '';
	export let errors: TransferFormErrors = {};
	export let isSubmitting = false;
	export let bankName = messages.brand.bankLegalName;
	export let activeUser = '';
	/** When true, form fields sit on the parent widget surface (no inner card chrome). */
	export let isEmbedded = false;

	let locale = 'en-US';
	onMount(() => {
		locale = typeof navigator !== 'undefined' ? navigator.language : locale;
	});

	$: domains = getDomainsLookup();
	$: amountCurrency = fromAccount?.currency ?? toAccount?.currency ?? 'USD';
	$: currencyAffix = currencyInputAffix(amountCurrency, locale);
	/** Show every account so two-account holders can swap; validation still blocks same from/to. */
	$: fromOptions = accounts;
	$: toOptions = accounts;
	$: fromAccount = findAccount(accounts, fromAccountId);
	$: toAccount = findAccount(accounts, toAccountId);
	$: parsedAmount = parseAmount(amount);
	$: clientAmountError = (() => {
		const trimmed = amount.trim();
		if (!trimmed || !fromAccount) return '';
		if (parsedAmount === null) return messages.transfers.validation.amountInvalid;
		if (parsedAmount <= 0) return messages.transfers.validation.amountZero;
		if (parsedAmount > fromAccount.balance) {
			return messages.transfers.validation.amountOverBalance;
		}
		return '';
	})();
	$: amountError = errors.amount || clientAmountError;
	$: canSubmit =
		Boolean(fromAccount && toAccount && fromAccountId !== toAccountId) &&
		parsedAmount !== null &&
		parsedAmount > 0 &&
		fromAccount !== undefined &&
		parsedAmount <= fromAccount.balance &&
		!amountError &&
		!isSubmitting;

	let previousFromAccountId = '';
	let previousToAccountId = '';

	$: if (!fromAccountId) previousFromAccountId = '';
	$: if (!toAccountId) previousToAccountId = '';

	function handleFromChange() {
		if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
			toAccountId = previousFromAccountId;
		}
		previousFromAccountId = fromAccountId;
	}

	function handleToChange() {
		if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
			fromAccountId = previousToAccountId;
		}
		previousToAccountId = toAccountId;
	}

	function fromOptionDisabled(account: (typeof accounts)[number]): boolean {
		return !isSelectableFromAccount(account);
	}

	function toOptionDisabled(account: (typeof accounts)[number]): boolean {
		return !isSelectableToAccount(account);
	}

	function fromOptionHint(account: (typeof accounts)[number]): string | undefined {
		if (!isAccountActive(account)) return inactiveAccountTransferHint(account, domains);
		if (account.balance <= 0) return messages.transfers.hints.noBalance;
		return undefined;
	}

	function toOptionHint(account: (typeof accounts)[number]): string | undefined {
		if (!isAccountActive(account)) return inactiveAccountTransferHint(account, domains);
		return undefined;
	}

	function recordHintFromActionResult(data: unknown) {
		if (!data || typeof data !== 'object') return;
		const row = data as Record<string, unknown>;
		if (row.outcome !== 'success') return;

		const fromId = String(row.successFromAccountId ?? '');
		const toId = String(row.successToAccountId ?? '');
		const amountRaw = row.successAmount;
		if (!fromId || !toId || typeof amountRaw !== 'number') return;

		recordTransferEndpointHint({
			transferId: String(row.successTransferId ?? '') || undefined,
			referenceNumber: String(row.successConfirmation ?? '') || undefined,
			fromAccountId: fromId,
			toAccountId: toId,
			amount: amountRaw,
			recordedAt: String(row.successTransferDate ?? new Date().toISOString())
		});
		if (activeUser) {
			recordPendingTransfer({
				activeUser,
				fromAccountId: fromId,
				toAccountId: toId,
				amount: amountRaw
			});
		}
	}

	function formatAmountOnBlur() {
		const trimmed = amount.trim();
		if (!trimmed) return;
		const parsed = parseAmount(amount);
		if (parsed === null || parsed <= 0) return;
		amount = formatAmountInputValue(parsed, amountCurrency, locale);
	}
</script>

<form
	method="POST"
	class="form"
	class:embedded={isEmbedded}
	use:enhance={() => {
		isSubmitting = true;
		return async ({ update, result }) => {
			await update();
			isSubmitting = false;
			if (result.type === 'success') {
				recordHintFromActionResult(result.data);
				await invalidateAll();
			}
		};
	}}
>
	<header class="form-header">
		<h1 id="transfer-selection-heading" class="title">{messages.transfers.selection.title}</h1>
		<p class="subtitle">{messages.transfers.selection.subtitle}</p>
	</header>

	{#if errors.form}
		<p class="banner error" role="alert">{errors.form}</p>
	{/if}

	<div class="inputs-panel">
		<div class="inputs-group">
			<div class="field-group">
				<AccountSelectField
					id="from-account"
					name="fromAccountId"
					label={messages.transfers.selection.fromLabel}
					accountsCatalog={accounts}
					options={fromOptions}
					bind:value={fromAccountId}
					isOptionDisabled={fromOptionDisabled}
					optionHint={fromOptionHint}
					isInvalid={Boolean(errors.fromAccountId)}
					describedBy={errors.fromAccountId ? 'from-account-error' : undefined}
					on:change={handleFromChange}
				/>
				{#if errors.fromAccountId}
					<p id="from-account-error" class="field-error">{errors.fromAccountId}</p>
				{/if}
			</div>

			<div class="field-group">
				<AccountSelectField
					id="to-account"
					name="toAccountId"
					label={messages.transfers.selection.toLabel}
					accountsCatalog={accounts}
					options={toOptions}
					bind:value={toAccountId}
					isOptionDisabled={toOptionDisabled}
					optionHint={toOptionHint}
					isInvalid={Boolean(errors.toAccountId)}
					describedBy={errors.toAccountId ? 'to-account-error' : undefined}
					on:change={handleToChange}
				/>
				{#if errors.toAccountId}
					<p id="to-account-error" class="field-error">{errors.toAccountId}</p>
				{/if}
			</div>

			<div class="field-group">
				<div class="field amount-field">
					<label for="amount">{messages.transfers.selection.amountLabel}</label>
					<div
						class="amount-input-wrap"
						class:invalid={Boolean(amountError)}
						class:currency-suffix={currencyAffix.position === 'suffix'}
					>
						<span class="currency-affix" aria-hidden="true">{currencyAffix.symbol}</span>
						<input
							id="amount"
							name="amount"
							type="text"
							inputmode="decimal"
							autocomplete="off"
							placeholder={formatAmountInputValue(0, amountCurrency, locale)}
							bind:value={amount}
							on:blur={formatAmountOnBlur}
							aria-invalid={amountError ? 'true' : undefined}
							aria-describedby={amountError ? 'amount-error' : undefined}
						/>
					</div>
					{#if amountError}
						<p id="amount-error" class="field-error">{amountError}</p>
					{/if}
				</div>
			</div>
		</div>

		<input type="hidden" name="reference" value={reference} />

		<p class="legal">
			{msg(messages.transfers.selection.legal, { bankName })}
		</p>

		<button type="submit" class="submit" class:enabled={canSubmit} disabled={!canSubmit}>
			{isSubmitting ? messages.transfers.selection.submitting : messages.transfers.selection.submit}
		</button>
	</div>
</form>

<style>
	.form {
		background: var(--wl-surface, var(--c-white));
		border: var(--border-size-thin) solid var(--wl-border, var(--c-gray-light));
		border-radius: var(--wl-radius-card, var(--radius-xl));
		padding: var(--s-6) var(--s-6) var(--s-5);
		box-shadow: var(--shadow-sm);
	}

	.form.embedded {
		background: transparent;
		border: none;
		border-radius: 0;
		padding: 0;
		box-shadow: none;
	}

	.form-header {
		margin-bottom: var(--s-4);
	}

	.inputs-panel {
		display: flex;
		flex-direction: column;
		gap: var(--s-6);
		padding: var(--s-6);
		background: var(--c-white);
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius-xl);
		box-sizing: border-box;
	}

	.inputs-group {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.inputs-panel :global(.field) {
		margin-bottom: 0;
	}

	.form:not(.embedded) .inputs-panel {
		padding: 0;
		border: none;
		border-radius: 0;
		background: transparent;
	}

	.title {
		font-size: var(--title-fs);
		font-weight: var(--header-fw);
		color: var(--c-black, var(--text-fg-ci));
	}

	.subtitle {
		margin: var(--s-2) 0 0;
		font-size: var(--text-sm-fs);
		color: var(--c-black, var(--text-light-fg-ci));
	}

	.banner {
		margin: 0 0 var(--s-4);
		padding: var(--s-3) var(--s-4);
		border-radius: var(--radius-lg);
		font-size: var(--text-sm-fs);
	}

	.banner.error {
		background: var(--c-red-lighter);
		color: var(--c-red-dark);
		border: var(--border-size-thin) solid var(--c-red-light);
	}

	.field-error {
		margin: var(--s-2) 0 0;
		font-size: var(--text-xs-fs);
		line-height: 1.4;
		color: var(--wl-negative, var(--c-red));
	}

	.amount-field label {
		display: block;
		height: 17px;
		margin-bottom: var(--s-2);
		font-size: var(--text-sm-fs);
		font-weight: var(--fw-medium);
	}

	.amount-input-wrap {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		box-sizing: border-box;
		min-height: 51px;
		padding: 0 var(--s-4);
		background: var(--input-bg-ci);
		border: var(--border-size-thin) solid var(--c-gray);
		border-radius: var(--radius-lg);
	}

	.amount-input-wrap.invalid {
		background: var(--input-error-bg-ci);
		border-color: var(--input-error-border-ci);
	}

	.currency-affix {
		font-size: var(--text-xs-fs);
		font-weight: var(--fw-medium);
		line-height: 1;
		color: var(--text-light-fg-ci);
		flex-shrink: 0;
	}

	.amount-input-wrap.currency-suffix {
		flex-direction: row;
	}

	.amount-input-wrap.currency-suffix .currency-affix {
		order: 2;
	}

	.amount-input-wrap input {
		flex: 1;
		border: none;
		background: transparent;
		padding: var(--s-3) 0;
		font: var(--input-fw) var(--input-fs) var(--input-font);
		color: var(--input-fg-ci);
		min-width: 0;
	}

	.amount-input-wrap input:focus {
		outline: none;
	}

	.amount-input-wrap:focus-within:not(.invalid) {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: 2px;
	}

	.amount-input-wrap.invalid:focus-within {
		outline: 2px solid var(--input-error-border-ci);
		outline-offset: 2px;
	}

	.legal {
		font-size: var(--text-xs-fs);
		color: var(--c-black, var(--text-light-fg-ci));
		line-height: 1.45;
		text-align: center;
	}

	.submit {
		width: 100%;
		min-height: 3rem;
		padding: var(--s-3) var(--s-4);
		border: none;
		border-radius: var(--radius);
		background: var(--c-gray-medium);
		color: var(--c-white);
		font-size: var(--text-fs);
		font-weight: var(--fw-semi-bold);
		cursor: not-allowed;
		transition: filter 0.15s ease;
	}

	.submit.enabled {
		background: var(--wl-primary, var(--c-blue));
		cursor: pointer;
		box-shadow: none;
	}

	.submit.enabled:hover {
		filter: brightness(0.96);
	}

	.submit.enabled:focus-visible {
		outline: 2px solid var(--wl-primary, var(--c-blue));
		outline-offset: 2px;
	}
</style>
