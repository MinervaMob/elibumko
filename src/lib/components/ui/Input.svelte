<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: string;
		value?: string | number;
		placeholder?: string;
		label?: string;
		name?: string;
		id?: string;
		hint?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		readonly?: boolean;
		class?: string;
		shortcutHint?: string;
		iconLeft?: Snippet;
		iconRight?: Snippet;
		oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		onchange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
		onkeydown?: (e: KeyboardEvent) => void;
		[key: string]: unknown;
	}

	let {
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		label,
		name,
		id,
		hint,
		error,
		disabled = false,
		required = false,
		readonly = false,
		class: className = '',
		shortcutHint,
		iconLeft,
		iconRight,
		oninput,
		onchange,
		onkeydown,
		...rest
	}: Props = $props();

	const inputId = $derived(id || (name ? `input-${name}` : undefined));
</script>

<div class="flex w-full flex-col gap-1.5">
	{#if label}
		<label
			for={inputId}
			class="flex items-center justify-between text-xs font-semibold tracking-wider text-ink uppercase"
		>
			<span>
				{label}
				{#if required}<span class="ml-0.5 text-brick">*</span>{/if}
			</span>
			{#if hint && !error}
				<span class="text-[11px] font-normal text-ink-muted normal-case">{hint}</span>
			{/if}
		</label>
	{/if}

	<div class="relative flex w-full items-center">
		{#if iconLeft}
			<div class="pointer-events-none absolute left-3.5 flex items-center text-ink-muted">
				{@render iconLeft()}
			</div>
		{/if}

		<input
			{type}
			{name}
			id={inputId}
			bind:value
			{placeholder}
			{disabled}
			{required}
			{readonly}
			{oninput}
			{onchange}
			{onkeydown}
			class="w-full rounded-md border border-ink/20 bg-white px-3.5 py-2.5 text-sm text-ink transition-all duration-200 placeholder:text-ink-muted/50 focus:border-brick focus:ring-2 focus:ring-brick/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-cream/40 disabled:text-ink-muted {iconLeft
				? 'pl-10'
				: ''} {iconRight || shortcutHint ? 'pr-12' : ''} {error
				? '!border-brick ring-1 ring-brick'
				: ''} {className}"
			{...rest}
		/>

		{#if shortcutHint}
			<div class="pointer-events-none absolute right-3 flex items-center">
				<kbd
					class="rounded-sm border border-ink/15 bg-sand/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-muted"
				>
					{shortcutHint}
				</kbd>
			</div>
		{:else if iconRight}
			<div class="absolute right-3.5 flex items-center text-ink-muted">
				{@render iconRight()}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="mt-0.5 text-xs font-medium text-brick">{error}</p>
	{/if}
</div>
