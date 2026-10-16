<script lang="ts">
	export let width = '100%';
	export let height = '1rem';
	export let radius = 'var(--radius-lg)';
</script>

<span
	class="skeleton"
	style:width
	style:height
	style:border-radius={radius}
	aria-hidden="true"
></span>

<style>
	.skeleton {
		display: block;
		background: linear-gradient(
			90deg,
			var(--c-gray-light) 0%,
			var(--c-gray-lighter) 45%,
			var(--c-gray-light) 90%
		);
		background-size: 200% 100%;
		animation: shimmer 1.2s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: -100% 0;
		}
	}
</style>
