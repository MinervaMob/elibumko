<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/ElibUMKO_core.avif';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
