<script lang="ts">
	import bankIcon from '$lib/assets/bank.svg';
	import briefcaseIcon from '$lib/assets/briefcase.svg';
	import hotBeverageIcon from '$lib/assets/hot-beverage.svg';
	import moneyBagIcon from '$lib/assets/money-bag.svg';
	import shoppingCartIcon from '$lib/assets/shopping-cart.svg';
	import type { ActivityIconKind } from '$lib/utils/activityIcon';

	export let kind: ActivityIconKind;

	const iconSrc: Record<ActivityIconKind, string> = {
		bank: bankIcon,
		'money-bag': moneyBagIcon,
		briefcase: briefcaseIcon,
		'hot-beverage': hotBeverageIcon,
		'shopping-cart': shoppingCartIcon
	};
</script>

<img class="activity-icon-image" src={iconSrc[kind]} alt="" width="16" height="16" decoding="async" />

<style>
	.activity-icon-image {
		display: block;
		width: 16px;
		height: 16px;
		object-fit: contain;
	}
</style>
