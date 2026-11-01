<script lang="ts">
	import { X, BookOpen, ChevronRight } from 'lucide-svelte';
	import type { TableOfContentItem } from '#lib';

	interface Props {
		isOpen: boolean;
		toc: TableOfContentItem[];
		currentPage?: number;
		onClose: () => void;
		onNavigate: (page: number) => void;
	}

	let { isOpen, toc, currentPage = 1, onClose, onNavigate }: Props = $props();

	function handleNavigate(page: number) {
		onNavigate(page);
		// Don't close TOC so user can continue browsing chapters
	}

	function isActive(item: TableOfContentItem): boolean {
		return item.page === currentPage;
	}
</script>

{#snippet tocItem(item: TableOfContentItem, depth: number)}
	<li>
		<button
			type="button"
			onclick={() => handleNavigate(item.page)}
			class="group flex w-full items-start gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors
				{isActive(item) ? 'bg-brick font-semibold text-cream' : 'text-ink hover:bg-sand/60 hover:text-ink'}"
			style="padding-left: {12 + depth * 16}px;"
		>
			{#if depth === 0}
				<BookOpen
					size={14}
					class="mt-0.5 shrink-0 {isActive(item) ? 'text-cream' : 'text-terracotta'}"
				/>
			{:else}
				<ChevronRight
					size={13}
					class="mt-0.5 shrink-0 {isActive(item) ? 'text-cream/70' : 'text-ink-muted/60'}"
				/>
			{/if}
			<span class="leading-snug">{item.title}</span>
			{#if item.page}
				<span
					class="ml-auto shrink-0 font-mono text-[10px] tracking-wide
						{isActive(item) ? 'text-cream/70' : 'text-ink-muted'}"
				>
					hlm.&nbsp;{item.page}
				</span>
			{/if}
		</button>

		{#if item.children?.length}
			<ul class="mt-0.5 space-y-0.5">
				{#each item.children as child (child.title + child.page)}
					{@render tocItem(child, depth + 1)}
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

{#if isOpen}
	<!-- Backdrop (mobile) -->
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default bg-black/30 lg:hidden"
		tabindex="-1"
		onclick={onClose}
		aria-label="Tutup daftar isi"
	></button>

	<!-- TOC Panel -->
	<aside
		class="fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-ink/15 bg-cream shadow-[2px_0_16px_rgba(42,26,22,0.12)]"
		aria-label="Daftar Isi Buku"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-ink/15 bg-sand/30 px-4 py-3.5">
			<div class="flex items-center gap-2">
				<BookOpen size={16} class="shrink-0 text-brick" />
				<h3 class="font-serif text-base font-bold text-ink">Daftar Isi</h3>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="focus-library rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-sand hover:text-ink"
				aria-label="Tutup daftar isi"
			>
				<X size={16} />
			</button>
		</div>

		<!-- TOC List -->
		<div class="flex-1 overflow-y-auto px-2 py-3">
			{#if toc.length === 0}
				<div class="px-4 py-10 text-center">
					<BookOpen size={32} class="mx-auto mb-3 text-ink-muted/40" />
					<p class="text-sm text-ink-muted">Daftar isi tidak tersedia untuk buku ini.</p>
				</div>
			{:else}
				<ul class="space-y-0.5">
					{#each toc as item (item.title + item.page)}
						{@render tocItem(item, 0)}
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Footer: current position indicator -->
		<div class="border-t border-ink/15 bg-sand/20 px-4 py-2.5">
			<p class="font-mono text-[11px] tracking-wide text-ink-muted">
				Posisi: Halaman&nbsp;<span class="font-bold text-brick">{currentPage}</span>
			</p>
		</div>
	</aside>
{/if}
