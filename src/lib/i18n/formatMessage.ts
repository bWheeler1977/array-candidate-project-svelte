/** Replace `{key}` placeholders in copy templates (for future locale packs). */
export function msg(template: string, values?: Record<string, string | number>): string {
	if (!values) return template;
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
