# NorthWind Bank — Array frontend take-home

SvelteKit (Svelte 4) web component for viewing accounts and transferring funds via the [NorthWind candidate API](https://northwind.dev.array.io/swagger/index.html).

## Setup

Node **^24.12.0** (see `.nvmrc` if present).

```sh
npm install
cp .env.example .env
```

Add your interview API key to `.env`:

```env
NORTHWIND_API_KEY=your_key_here
NORTHWIND_API_BASE_URL=https://northwind.dev.array.io
```

**Do not commit `.env` or include secrets in submission zips.**

```sh
npm run dev
# npm run check   — typecheck
# npm run test    — unit + integration tests (Vitest; success + failure paths)
# npm run build   — production build
```

Svelte 4 docs: [legacy overview](https://svelte.dev/docs/svelte/legacy-overview).

---

## Design decisions (for reviewers & future maintainers)

These choices are intentional; related code is commented where the behavior is non-obvious.

There was a potential error noticed in Figma on the Transfer mockups. The label for the field to set the amount to transfer said "Transfer to", just like the above line. I changed that to "Amount" to better match what the field was for. Also, the mobile version of the transfer after the accounts were selected didn't have an amount entered, so the Transfer Summary card didn't really match the same card in the desktop version. I made sure it matched after adding the amount.

I also noticed that the backend wasn't updating the balances after a transfer. I put in an optimistic view on the Total Balance card and the Accounts cards that showed those updated balances with a note that there were pending balances. A page refresh, or changing the user will reset that back to what the endpoint returns. I imagine in a real scenerio, we would be able to get the updated balances, and so wanted to show that.

### Server-first API access

All NorthWind calls run on the **server** (`+layout.server.ts`, `+page.server.ts`, `src/lib/server/northwind.ts`) so the API key never reaches the browser. Responses are **parsed once** at the boundary (`src/lib/types/northwind.ts`, `src/lib/types/domains.ts`); UI components receive plain typed data.

### Domain labels (`GET /domains`) as copy source of truth

Figma mockups use sample product names; real banks expose wording via **domain catalogs**. We load `/domains` **once per navigation** in the root layout (in parallel with accounts/session) and expose a shared lookup via Svelte context (`src/lib/context/domains.ts`).

- `/external/accounts` returns **`account_type`** and **`account_status`** as **codes** (`CHECKING`, `ACTIVE`, …).
- `/domains` maps each **code** → **`display_name`** + **`description`**.
- UI shows `display_name`; tooltips use `description` where helpful (e.g. account badges).
- If `/domains` fails, we **title-case the raw code** so the app still renders.

This keeps the component portable across banks (and leaves room for localized domain payloads later) without hard-coded marketing names in components.

### Multi-user sandbox

The candidate API returns accounts for **multiple holders**. The app simulates a single customer session:

- **Cookie** `northwind_active_user` stores the selected holder (`src/lib/utils/userContext.ts`).
- **Layout load** fetches all accounts, derives holder list, filters to `accountsForUser`.
- **Viewing as** switcher posts to **`POST /active-user`** (dedicated route—not a form action on `/`—to avoid 405/method issues with static routing during user switches).
- Transfers and activity are **scoped** with `filterTransfersForUser` / mock data keyed by `account_holder_name`.

### Recent Activity: mocks + real transfers

NorthWind provides **accounts** and **transfers** only—**no** merchant/payroll transaction API. The Accounts **Recent Activity** panel therefore:

1. **Mocks** (`src/lib/data/mockRecentActivity.ts`) — per-holder sample rows (grocery, payroll, etc.) with `daysAgo` so dates stay within the last 30 days on every page load. Clearly separated (`source: 'mock'` in feed items).
2. **Real transfers** — from `GET /external/transfers`, merged in `src/lib/utils/recentActivityFeed.ts`.

The **Transfers** page “Recent transfers” list uses **API transfers only** (no mocks).

Activity rows use SVG icons from `src/lib/assets/` (bank, shopping cart, briefcase, etc.) via `ActivityIcon.svelte` and `resolveActivityIconKind()` in `activityIcon.ts`.

### Transfer account hydration (no guessing)

List responses sometimes omit `source_account.account_number` or `destination_account.account_number`. We **do not infer** the other account when a user has 3+ accounts—that could attach activity to the wrong card.

Instead, `hydrateTransfersForDisplay` (`src/lib/server/transfers.ts`) calls **`GET /external/transfers/{id}`** for any row missing either account number, then merges both sides from the detail payload (Swagger includes full account objects). Per-account filtering and signed amounts rely on those numbers matching the user’s accounts.

### Account card → filter Recent Activity

Clicking an account card filters activity to rows linked to that account (`relatedAccountIds`). Click again to clear. Switching **Viewing as** resets the filter.

When filtered, **amount sign is from that account’s perspective** (outbound internal transfer negative on checking, positive on savings). Unfiltered feed keeps transfer `direction` semantics from the API.

### Transfers UX

- **Inactive** accounts appear in dropdowns but are **disabled** with status text from `/domains` (requirement: visible but not selectable).
- **Validation** on client (`src/lib/utils/transfer.ts`) and server (transfer action) before `POST /external/transfers/initiate`. This covers only what the UI can know safely (active status, balance, amount shape)—not bank product rules such as “transfers allowed from CD.”
- **API is the authority** for which transfers are permitted. We do not hard-code account-type or transfer-type allowlists on the front end; backend tests and `POST /external/transfers/initiate` (or validate) enforce those rules. When the API rejects a request, we show the **message from NorthWind** in the error modal (`NorthwindApiError` / action outcome)—no silent failures.
- **Outcomes** use modals (not inline banners) for success and API errors; success triggers `invalidateAll()` to refresh transfers and account payloads from the API.

### Sandbox account balances (API lag)

In the interview sandbox, **`GET /external/accounts` often does not update balances after a successful `POST /external/transfers/initiate`**, even though transfers appear in history. That is a **backend/mock limitation**, not missing `invalidateAll()` on our side.

**Accounts page display:** After a successful transfer in this tab, we apply **in-memory pending deltas** to card and total balances (`src/lib/stores/pendingBalances.ts`) so the UI matches what the user just did. The total balance card shows a note: *Includes pending transfers…*

Pending adjustments are **scoped to the current holder in this browser tab** and are cleared when:

- the page is **fully refreshed**, or  
- **Viewing as** switches to another holder (`UserSwitcher` → `clearPendingBalances()`).

Transfer form validation and initiate payloads still use **API balances** from the server. When the API eventually returns updated balances (or after refresh/switch), the UI reflects that data and pending state is dropped.

### Styling

Plain CSS + shared design tokens (`src/app.css`, theme preset)—no Tailwind—to match the starter and keep layout aligned with provided Figma references without coupling copy to Figma.

### Accessibility

- Account picker: WAI-ARIA **listbox** on the trigger (`aria-controls`, `aria-activedescendant`) with Arrow/Home/End, typeahead, Enter/Space, and Escape — see `AccountSelectField.svelte`.
- Transfer outcome **modal**: focus moves to the primary button, **Tab is trapped** (`focusTrap.ts`), Escape and backdrop dismiss, focus returns to the control that opened the dialog.
- Forms use labels, `aria-invalid` / `aria-describedby` for errors; account filter cards expose an **`aria-label`** for the toggle behavior.

### Embedded in a host banking app

The widget is designed to run **inside** a bank’s authenticated session, not only as a standalone dev app.

1. **Host calls** `POST /embed/init` on the widget origin with JSON:
   - `accessToken` (required) — customer Bearer token from the bank / NorthWind
   - `accountHolderName` (optional) — scope when multiple holders exist
   - `accounts` (optional) — validated snapshot from the host; holder name can be inferred
   - `apiBaseUrl` (optional) — override API base (e.g. bank BFF)
2. The server stores the token in an **httpOnly cookie** and uses it for all NorthWind requests (`hooks.server.ts` + `northwind.ts`). The token is not exposed to widget client JS.
3. **Custom element** (optional): load `/embed/register`, then use `<northwind-banking-widget>` and `element.configure({ accessToken, … })` — see `src/lib/embed/`.
4. **JS helper**: `initNorthwindEmbedSession()` from `$lib/embed` for same-origin host apps.

Standalone development still uses `NORTHWIND_API_KEY` in `.env`. Embedded mode hides the dev “Viewing as” switcher.

### Out of scope / manual only

- **`POST /external/reset`** — sandbox reset via Swagger/curl only, not wired in UI.
- **`/bank`**, batch transfers, cancel/reverse — not required by assignment PDF.

---

## Features (assignment checklist)

### Accounts view

| Requirement | Implementation |
|-------------|----------------|
| Account name, number, balance, active/inactive | `AccountCard` — domain `display_name` for type/status, masked number, balance |
| Inactive accounts visually distinct | Muted card + status badge from `/domains` (e.g. Frozen, Closed) |
| Loading / error states | Skeleton on user switch; API errors on accounts load |
| Optional: masked numbers, empty state | Masked `**** 1234`; empty copy when no accounts |
| Extra: filter activity by account | Click an account card to filter Recent Activity to that account; click again to clear (see **Account card → filter Recent Activity** below) |

Data: `GET /external/accounts` + `GET /domains` in `src/routes/+layout.server.ts`.

### Balance transfer view

| Requirement | Implementation |
|-------------|----------------|
| From / To dropdowns + amount | `TransferForm` + `AccountSelectField` |
| Inactive listed but not selectable | Disabled options + domain status in hint text |
| Frontend validation | Amount, active accounts, balance ≤ available |
| Success / failure | Modals; invalidate to refresh data |

Data: `POST /external/transfers/initiate`.

### API & TypeScript

- Types and parsers: `src/lib/types/northwind.ts`, `src/lib/types/domains.ts`
- Server HTTP client: `src/lib/server/northwind.ts` (`NorthwindApiError`)
- Vitest: parsers, validation, feed rules, hydration, server actions (see below)

---

## Project structure (high level)

```
src/lib/components/
  accounts/     AccountsView, AccountCard, RecentActivityPanel, …
  transfers/    TransferForm, TransferOutcomeModal, RecentTransfersPanel, …
  layout/       AppShell, UserSwitcher
src/lib/context/ domains.ts          — Svelte context for label lookup
src/lib/data/    mockRecentActivity.ts
src/lib/server/  northwind.ts, userSession.ts, transfers.ts, loadDomains.ts
src/lib/utils/   account.ts, domainsLookup.ts, recentActivityFeed.ts, transferDisplay.ts, userContext.ts
src/routes/      +layout.server.ts, +page (accounts), transfers/, active-user/
```

---

## Tests

`npm run test` — Vitest covers domain lookup, parsers, transfer validation, user scoping, recent-activity feed (including account filter and signed amounts), transfer hydration (mocked fetch), transfer form server action, and `POST /active-user`.

---

## Submission notes

- Exclude `.env`, `node_modules`, and build artifacts per PDF instructions.
- API key is required at runtime (`NORTHWIND_API_KEY`); missing key throws from the server client with a setup message.
