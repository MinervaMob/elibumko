<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		value: string | number;
		subtext?: string;
		trend?: {
			value: string;
			positive?: boolean;
		};
		icon?: Snippet;
		class?: string;
	}

	let { title, value, subtext, trend, icon, class: className = '' }: Props = $props();
</script>

<div
	class="catalog-card flex flex-col justify-between rounded-lg border border-ink/15 bg-sand/35 p-4 shadow-[0_2px_4px_rgba(42,26,22,0.04)] transition-all duration-200 hover:border-ink/30 hover:bg-sand/50 sm:p-5 {className}"
>
	<div class="flex items-start justify-between gap-3">
		<span class="text-xs font-semibold tracking-wider text-ink-muted uppercase">
			{title}
		</span>
		{#if icon}
			<div class="shrink-0 rounded-sm bg-ink/5 p-2 text-ink">
				{@render icon()}
			</div>
		{/if}
	</div>

	<div class="mt-3">
		<div class="font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
			{typeof value === 'number' ? value.toLocaleString('id-ID') : value}
		</div>

		{#if subtext || trend}
			<div class="mt-2 flex items-center gap-2 text-xs">
				{#if trend}
					<span
						class="rounded-xs px-1.5 py-0.5 font-mono font-medium {trend.positive
							? 'bg-brick/15 text-brick'
							: 'bg-ink/10 text-ink-muted'}"
					>
						{trend.value}
					</span>
				{/if}
				{#if subtext}
					<span class="text-ink-muted">{subtext}</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
