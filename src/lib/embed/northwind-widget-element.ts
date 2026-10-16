import { initNorthwindEmbedSession } from './initSession';
import type { HostWidgetConfig } from '$lib/types/embed';

const DEFAULT_APP_PATH = '/';

/**
 * Custom element for host apps: `<northwind-banking-widget app-src="/" widget-origin="https://…">`
 *
 * Call `configure({ accessToken, accountHolderName?, accounts? })` before or after connect.
 * Loads the SvelteKit app in a sandboxed iframe after the embed session cookie is set.
 */
export class NorthwindBankingWidgetElement extends HTMLElement {
	static get observedAttributes(): string[] {
		return ['app-src', 'widget-origin', 'title'];
	}

	#iframe: HTMLIFrameElement | null = null;
	#pendingConfig: HostWidgetConfig | null = null;

	get appSrc(): string {
		return this.getAttribute('app-src') ?? DEFAULT_APP_PATH;
	}

	get widgetOrigin(): string {
		const attr = this.getAttribute('widget-origin')?.trim();
		if (attr) return attr.replace(/\/$/, '');
		if (typeof window !== 'undefined') return window.location.origin;
		return '';
	}

	/** Host API: supply bearer token and optional account context, then load the app. */
	async configure(config: HostWidgetConfig): Promise<void> {
		this.#pendingConfig = config;
		await initNorthwindEmbedSession(config, { widgetOrigin: this.widgetOrigin });
		this.#mountFrame();
	}

	connectedCallback(): void {
		this.style.display = 'block';
		this.style.width = '100%';
		if (this.#pendingConfig) {
			void this.configure(this.#pendingConfig);
		}
	}

	disconnectedCallback(): void {
		this.#iframe?.remove();
		this.#iframe = null;
	}

	attributeChangedCallback(name: string): void {
		if (name === 'app-src' && this.#iframe) {
			this.#iframe.src = this.#resolveFrameUrl();
		}
	}

	#resolveFrameUrl(): string {
		const path = this.appSrc.startsWith('/') ? this.appSrc : `/${this.appSrc}`;
		return `${this.widgetOrigin}${path}`;
	}

	#mountFrame(): void {
		if (this.#iframe) {
			this.#iframe.src = this.#resolveFrameUrl();
			return;
		}

		const iframe = document.createElement('iframe');
		iframe.title = this.getAttribute('title') ?? 'NorthWind banking';
		iframe.src = this.#resolveFrameUrl();
		iframe.setAttribute(
			'style',
			'width:100%;min-height:720px;border:0;display:block;background:transparent;'
		);
		iframe.setAttribute('loading', 'lazy');
		this.replaceChildren(iframe);
		this.#iframe = iframe;
	}
}

export function registerNorthwindBankingWidget(tagName = 'northwind-banking-widget'): void {
	if (typeof customElements === 'undefined') return;
	if (customElements.get(tagName)) return;
	customElements.define(tagName, NorthwindBankingWidgetElement);
}
