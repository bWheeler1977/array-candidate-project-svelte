/**
 * User-facing copy for the NorthWind widget. Centralized for localization and reuse.
 * API/domain display names still come from `/domains`; mock activity titles stay in mock data.
 */
export const messages = {
	brand: {
		bankLegalName: 'NorthWind Bank',
		institutionName: 'Northwind Bank'
	},
	common: {
		accountLabel: 'Account',
		accountTransferFallback: 'Account transfer',
		emDash: '—',
		available: 'Available',
		loading: 'Loading…'
	},
	nav: {
		accounts: 'Accounts',
		transfers: 'Transfers',
		primary: 'Primary',
		brandHome: '{brand} home'
	},
	userSwitcher: {
		viewingAs: 'Viewing as',
		selectUser: 'Select a user.',
		unknownUser: 'Unknown user.'
	},
	pageTitle: {
		accounts: '{brand} · Accounts',
		transfers: '{brand} · Transfers'
	},
	accounts: {
		totalBalance: 'Total balance',
		acrossOneAccount: 'Across {count} account',
		acrossManyAccounts: 'Across {count} accounts',
		yourAccounts: 'Your accounts',
		loading: 'Loading accounts…',
		loadErrorTitle: 'We couldn’t load your accounts',
		loadActivityError: 'Something went wrong loading activity.',
		empty: 'No accounts found.',
		filterSelected:
			'{productName}, showing activity for this account, press to show all accounts',
		filterPrompt: '{productName}, press to filter recent activity to this account',
		inactiveTransferHint: '{status} — not available for transfers',
		/** Shown under total balance when in-tab pending transfer deltas are applied (Accounts page). */
		pendingTransfersNote: '* Includes pending transfers'
	},
	activity: {
		title: 'Recent Activity',
		subtitleAll: 'Latest movements across all accounts',
		subtitleForAccount: 'Activity for {accountName}',
		empty: 'No recent activity to show yet.',
		internalTransfer: 'Internal transfer',
		/** When the transfers API omits source account_number and we cannot infer the account. */
		sourceUnavailable: 'Source unavailable',
		metaDateAccount: '{date} · {accountLabel}',
		metaWithDetail: '{date} · {detail}',
		/** Recent transfer rows: date line shows source account (Figma “From …”). */
		metaFromAccount: '{date} · From {source}',
		transferTo: 'Transfer to {destination}'
	},
	transfers: {
		page: {
			loadErrorTitle: 'We couldn’t load accounts',
			empty: 'No accounts available for transfers.',
			loadTransfersError: 'Unable to load transfers.',
			loadAccountsError: 'Unable to load accounts.',
			noUserAccounts: 'Select a user with available accounts.',
			accountsMustBelongToUser: 'Selected accounts must belong to the active user.',
			buildRequestFailed: 'Unable to build transfer request.',
			unexpectedError:
				'Your transfer could not be completed because an unexpected error occurred.'
		},
		selection: {
			ariaLabel: 'Transfer selection',
			title: 'Transfer between accounts',
			subtitle: 'Move money instantly between your accounts.',
			fromLabel: 'Transfer from',
			toLabel: 'Transfer to',
			amountLabel: 'Amount',
			legal: 'By continuing, I authorize {bankName} to transfer money as indicated.',
			submit: 'Complete transfer',
			submitting: 'Transferring…'
		},
		summary: {
			ariaLabel: 'Transfer details',
			title: 'Transfer summary',
			subtitle: 'A quick view of how this transfer affects your balances.',
			from: 'From',
			to: 'To',
			/** Placeholder when no account is selected (Figma uses a hyphen, not an em dash). */
			emptyPlaceholder: '-',
			balanceNew: 'New balance',
			balanceCurrent: 'Current',
			balanceLine: '{label} · {balance}'
		},
		recent: {
			title: 'Recent transfers',
			subtitle: 'Quick reference of your latest internal transfers.',
			empty: 'Transfers you make will appear here.',
			listTitleTo: 'To {destination}',
			listTitleFrom: 'From {source}'
		},
		accountSelect: {
			chooseAccount: 'Choose account',
			balanceAvailable: '{amount} available',
			/** Transfer picker primary line (Figma product names). */
			productChecking: 'Everyday Checking',
			productSavings: 'High-Yield Savings',
			productCd: 'Certificate of Deposit',
			productLoan: 'Loan Account'
		},
		hints: {
			noBalance: 'No available balance'
		},
		validation: {
			fromRequired: 'Select an account to transfer from.',
			fromInactive:
				'Select an active account with a positive balance to transfer from.',
			toRequired: 'Select an account to transfer to.',
			toInactive: 'Select an active account to transfer to.',
			sameAccount: 'Choose a different destination account.',
			amountRequired: 'Enter a transfer amount.',
			amountInvalid: 'Enter a valid amount.',
			amountZero: 'Enter an amount greater than zero.',
			amountOverBalance: 'Amount exceeds available balance in the source account.',
			referenceTooLong: 'Reference must be 100 characters or fewer.'
		},
		descriptionWithReference: 'Transfer: {reference}',
		modal: {
			dismissBackdrop: 'Dismiss dialog',
			successTitle: 'Transfer Successful',
			successLead: 'Your transfer has successfully been completed.',
			failedTitle: 'Transfer Failed',
			failedDefault:
				'Your transfer could not be completed. Please try again or contact support.',
			done: 'Done',
			backToTransfers: 'Back to transfers',
			amount: 'Amount',
			transferFrom: 'Transfer from',
			transferTo: 'Transfer to',
			transferDate: 'Transfer date',
			confirmation: 'Confirmation'
		}
	},
	a11y: {
		loadingAccounts: 'Loading accounts',
		loadingTransfers: 'Loading transfers'
	},
	errors: {
		loadAccountHolders: 'Unable to load account holders.',
		verifyAccountHolders: 'Unable to verify account holders.',
		apiUnreachable: 'Unable to reach NorthWind API. Check your network connection.'
	},
	formats: {
		transferDescriptionPrefix: 'Transfer:',
		maskedAccountSuffix: '**** {last4}'
	}
} as const;

export type Messages = typeof messages;
