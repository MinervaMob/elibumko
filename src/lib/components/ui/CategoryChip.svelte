<script lang="ts">
	interface Props {
		name: string;
		code?: string;
		count?: number;
		href?: string;
		active?: boolean;
		variant?: 'spine' | 'catalog' | 'chip';
		color?: 'brick' | 'terracotta' | 'sand' | 'ink';
		onclick?: () => void;
		class?: string;
	}

	let {
		name,
		code,
		count,
		href,
		active = false,
		variant = 'catalog',
		color = 'terracotta',
		onclick,
		class: className = ''
	}: Props = $props();

	const spineColors: Record<string, { bg: string; text: string; border: string }> = {
		brick: {
			bg: 'bg-brick',
			text: 'text-cream',
			border: 'border-brick-dark'
		},
		terracotta: {
			bg: 'bg-terracotta',
			text: 'text-cream',
			border: 'border-terracotta-dark'
		},
		sand: {
			bg: 'bg-sand',
			text: 'text-ink',
			border: 'border-sand-dark'
		},
		ink: {
			bg: 'bg-ink',
			text: 'text-cream',
			border: 'border-ink'
		}
	};
</script>

{#if variant === 'spine'}
	<!-- Vertical book-spine styled card -->
	{#if href}
		<a
			{href}
			class="group book-shadow hover:book-shadow-hover focus-library relative flex h-47.5 min-w-32.5 flex-col justify-between overflow-hidden rounded-md border p-4 text-left transition-all duration-300 select-none hover:-translate-y-1 {spineColors[
				color
			].bg} {spineColors[color].text} {spineColors[color].border} {className}"
		>
			<div class="absolute top-0 bottom-0 left-0 w-3 border-r border-white/10 bg-black/15"></div>
			<div class="flex items-start justify-between pl-2">
				{#if code}
					<span
						class="rounded-xs bg-black/20 px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wider"
					>
						{code}
					</span>
				{/if}
				{#if count !== undefined}
					<span class="font-mono text-[11px] opacity-80">
						{count} judul
					</span>
				{/if}
			</div>
			<div class="mt-auto pl-2">
				<h4 class="line-clamp-3 font-serif text-base leading-snug font-bold">{name}</h4>
				<span
					class="mt-2 inline-block font-sans text-[11px] tracking-wide uppercase opacity-75 transition-opacity group-hover:opacity-100"
				>
					Lihat Rak &rarr;
				</span>
			</div>
		</a>
	{:else}
		<button
			type="button"
			{onclick}
			class="group book-shadow hover:book-shadow-hover focus-library relative flex h-47.5 min-w-32.5 cursor-pointer flex-col justify-between overflow-hidden rounded-md border p-4 text-left transition-all duration-300 select-none hover:-translate-y-1 {spineColors[
				color
			].bg} {spineColors[color].text} {spineColors[color].border} {className}"
		>
			<div class="absolute top-0 bottom-0 left-0 w-3 border-r border-white/10 bg-black/15"></div>
			<div class="flex items-start justify-between pl-2">
				{#if code}
					<span
						class="rounded-xs bg-black/20 px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wider"
					>
						{code}
					</span>
				{/if}
				{#if count !== undefined}
					<span class="font-mono text-[11px] opacity-80">
						{count} judul
					</span>
				{/if}
			</div>
			<div class="mt-auto pl-2">
				<h4 class="line-clamp-3 font-serif text-base leading-snug font-bold">{name}</h4>
				<span
					class="mt-2 inline-block font-sans text-[11px] tracking-wide uppercase opacity-75 transition-opacity group-hover:opacity-100"
				>
					Lihat Rak &rarr;
				</span>
			</div>
		</button>
	{/if}
{:else if variant === 'catalog'}
	<!-- Library Index Card Style -->
	{#if href}
		<a
			{href}
			class="group focus-library inline-flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-all duration-200 select-none {active
				? 'border-brick bg-brick text-white shadow-sm'
				: 'border-ink/15 bg-sand/40 text-ink hover:border-ink/30 hover:bg-sand'} {className}"
		>
			{#if code}
				<span
					class="rounded-sm px-1.5 py-0.5 font-mono text-xs {active
						? 'bg-white/20 text-cream'
						: 'border border-ink/10 bg-cream text-ink'}"
				>
					{code}
				</span>
			{/if}
			<span class="text-sm font-medium tracking-tight">{name}</span>
			{#if count !== undefined}
				<span
					class="py-0.2 rounded-full px-1.5 font-mono text-xs {active
						? 'bg-white/20 text-cream'
						: 'bg-ink/10 text-ink-muted'}"
				>
					{count}
				</span>
			{/if}
		</a>
	{:else}
		<button
			type="button"
			{onclick}
			class="group focus-library inline-flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-all duration-200 select-none {active
				? 'border-brick bg-brick text-white shadow-sm'
				: 'border-ink/15 bg-sand/40 text-ink hover:border-ink/30 hover:bg-sand'} {className}"
		>
			{#if code}
				<span
					class="rounded-sm px-1.5 py-0.5 font-mono text-xs {active
						? 'bg-white/20 text-cream'
						: 'border border-ink/10 bg-cream text-ink'}"
				>
					{code}
				</span>
			{/if}
			<span class="text-sm font-medium tracking-tight">{name}</span>
			{#if count !== undefined}
				<span
					class="py-0.2 rounded-full px-1.5 font-mono text-xs {active
						? 'bg-white/20 text-cream'
						: 'bg-ink/10 text-ink-muted'}"
				>
					{count}
				</span>
			{/if}
		</button>
	{/if}
{:else}
	<!-- Compact filter chip -->
	{#if href}
		<a
			{href}
			class="focus-library inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors {active
				? 'border-brick bg-brick text-white'
				: 'border-ink/15 bg-white/60 text-ink hover:bg-sand/60'} {className}"
		>
			{#if code}
				<span class="font-mono text-[11px] opacity-75">{code}</span>
			{/if}
			<span>{name}</span>
			{#if count !== undefined}
				<span class="font-mono text-[10px] opacity-60">({count})</span>
			{/if}
		</a>
	{:else}
		<button
			type="button"
			{onclick}
			class="focus-library inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors {active
				? 'border-brick bg-brick text-white'
				: 'border-ink/15 bg-white/60 text-ink hover:bg-sand/60'} {className}"
		>
			{#if code}
				<span class="font-mono text-[11px] opacity-75">{code}</span>
			{/if}
			<span>{name}</span>
			{#if count !== undefined}
				<span class="font-mono text-[10px] opacity-60">({count})</span>
			{/if}
		</button>
	{/if}
{/if}
