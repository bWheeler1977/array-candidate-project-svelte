/** Focusable elements for dialog focus trap (WAI-ARIA modal pattern). */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const selector =
		'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
	return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
		(el) => !el.hasAttribute('disabled') && el.offsetParent !== null
	);
}

/** Keep Tab / Shift+Tab inside `container` while a modal is open. */
export function handleFocusTrap(event: KeyboardEvent, container: HTMLElement): void {
	if (event.key !== 'Tab') return;

	const focusable = getFocusableElements(container);
	if (focusable.length === 0) {
		event.preventDefault();
		container.focus();
		return;
	}

	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	const active = document.activeElement;

	if (event.shiftKey) {
		if (active === first || !container.contains(active)) {
			event.preventDefault();
			last.focus();
		}
		return;
	}

	if (active === last) {
		event.preventDefault();
		first.focus();
	}
}
