import { vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		NORTHWIND_API_KEY: 'test-api-key',
		NORTHWIND_API_BASE_URL: 'https://northwind.test'
	}
}));
