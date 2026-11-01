<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
	type ButtonSize = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		fullWidth?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
		iconLeft?: Snippet;
		iconRight?: Snippet;
		[key: string]: unknown;
	}

	let {
		variant = 'primary',
		size = 'md',
		href,
		fullWidth = false,
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children,
		iconLeft,
		iconRight,
		...rest
	}: Props = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		primary:
			'bg-brick text-white hover:bg-brick-dark active:bg-brick-dark border border-brick-dark/30 shadow-[0_1px_2px_rgba(42,26,22,0.15)]',
		secondary:
			'bg-sand text-ink hover:bg-sand-dark border border-ink/15 active:bg-sand-dark shadow-[0_1px_2px_rgba(42,26,22,0.06)]',
		outline: 'bg-transparent text-brick border border-brick hover:bg-sand/30 active:bg-sand/50',
		ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-sand/40 active:bg-sand/60'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'text-xs px-3 py-1.5 rounded-sm gap-1.5 min-h-8',
		md: 'text-sm px-4 py-2 rounded-md gap-2 min-h-10',
		lg: 'text-base px-6 py-2.5 rounded-md gap-2.5 min-h-11.5'
	};
</script>

{#if href && !disabled}
	<a
		{href}
		class="focus-library inline-flex cursor-pointer items-center justify-center text-center font-sans font-medium transition-all duration-200 select-none {variantClasses[
			variant
		]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''} {className}"
		{...rest}
	>
		{#if iconLeft}
			<span class="inline-flex shrink-0 items-center">
				{@render iconLeft()}
			</span>
		{/if}
		{#if children}
			{@render children()}
		{/if}
		{#if iconRight}
			<span class="inline-flex shrink-0 items-center">
				{@render iconRight()}
			</span>
		{/if}
	</a>
{:else}
	<button
		{type}
		{disabled}
		{onclick}
		class="focus-library inline-flex cursor-pointer items-center justify-center font-sans font-medium transition-all duration-200 select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 {variantClasses[
			variant
		]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''} {className}"
		{...rest}
	>
		{#if iconLeft}
			<span class="inline-flex shrink-0 items-center">
				{@render iconLeft()}
			</span>
		{/if}
		{#if children}
			{@render children()}
		{/if}
		{#if iconRight}
			<span class="inline-flex shrink-0 items-center">
				{@render iconRight()}
			</span>
		{/if}
	</button>
{/if}
