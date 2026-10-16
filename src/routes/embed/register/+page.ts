/** Side-effect route: registers the custom element when loaded by the host app. */
import { registerNorthwindBankingWidget } from '$lib/embed/northwind-widget-element';

export const ssr = false;

export function load() {
	registerNorthwindBankingWidget();
	return {};
}
