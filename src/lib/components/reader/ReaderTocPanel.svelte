<script lang="ts">
	import { X, BookOpen, ChevronRight, Bookmark } from 'lucide-svelte';
	import type { TableOfContentItem } from '#lib';

	interface Props {
		isOpen: boolean;
		toc: TableOfContentItem[];
		currentPage?: number;
		onClose: () => void;
		onNavigate: (page: number) => void;
	}

	let { isOpen, toc = [], currentPage = 1, onClose, onNavigate }: Props = $props();

	function handleNavigate(page: number) {
		if (page && page > 0) {
			onNavigate(page);
		}
	}

	function cleanTitle(title: string): string {
		return (title || '')
			.replace(/[\s.-_–—·•…]+$/, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	// Filter duplicates & clean titles
	const sanitizedToc = $derived.by(() => {
		const seenKeys: string[] = [];
		const result: TableOfContentItem[] = [];

		for (const item of toc) {
			const clean = cleanTitle(item.title);
			if (!clean) continue;
			const key = `${clean.toLowerCase()}_${item.page}`;
			if (!seenKeys.includes(key)) {
				seenKeys.push(key);
				result.push({
					...item,
					title: clean
				});
			}
		}

		// Sort by page number if pages are present
		return result.sort((a, b) => (a.page || 0) - (b.page || 0));
	});

	function isItemActive(item: TableOfContentItem, idx: number): boolean {
		if (!item.page) return false;
		const next = sanitizedToc[idx + 1];
		const endPage = next?.page ? next.page : Infinity;
		return currentPage >= item.page && currentPage < endPage;
	}

	function formatChapterDisplay(title: string): { badge?: string; text: string } {
		const match = title.match(/^(BAB\s+[IVXLCDM\d]+)[:\s-]*(.*)$/i);
		if (match) {
			return {
				badge: match[1].toUpperCase(),
				text: match[2].trim() || match[1]
			};
		}
		if (/^DAFTAR\s+PUSTAKA/i.test(title)) {
			return {
				badge: 'PUSTAKA',
				text: 'Daftar Pustaka'
			};
		}
		if (/^KATA\s+PENGANTAR/i.test(title)) {
			return {
				badge: 'PRAKATA',
				text: 'Kata Pengantar'
			};
		}
		return { text: title };
	}
</script>

{#snippet tocItem(item: TableOfContentItem, idx: number, depth: number)}
	{@const active = isItemActive(item, idx)}
	{@const display = formatChapterDisplay(item.title)}
	<li>
		<button
			type="button"
			onclick={() => handleNavigate(item.page)}
			class="group flex w-full items-start gap-2.5 rounded-sm px-3 py-2.5 text-left text-xs transition-all sm:text-sm
				{active
				? 'border-l-3 border-brick bg-brick/10 font-semibold text-brick shadow-2xs'
				: 'text-ink/90 hover:bg-sand/50 hover:text-ink'}"
			style="padding-left: {12 + depth * 14}px;"
		>
			{#if depth === 0}
				<Bookmark
					size={14}
					class="mt-0.5 shrink-0 transition-colors {active
						? 'fill-brick text-brick'
						: 'text-terracotta group-hover:text-brick'}"
				/>
			{:else}
				<ChevronRight
					size={13}
					class="mt-0.5 shrink-0 {active ? 'text-brick' : 'text-ink-muted/60'}"
				/>
			{/if}

			<div class="min-w-0 flex-1 leading-snug">
				{#if display.badge}
					<span
						class="py-0.2 inline-block rounded-xs px-1.5 font-mono text-[10px] font-bold tracking-wider uppercase
							{active ? 'bg-brick text-cream' : 'bg-sand/70 text-ink-muted group-hover:bg-sand'}"
					>
						{display.badge}
					</span>
					<span class="mt-0.5 block text-ink/90">{display.text}</span>
				{:else}
					<span>{display.text}</span>
				{/if}
			</div>

			{#if item.page}
				<span
					class="ml-auto shrink-0 self-start pt-0.5 font-mono text-[10px] tracking-wide
						{active ? 'font-bold text-brick' : 'text-ink-muted'}"
				>
					hlm.&nbsp;{item.page}
				</span>
			{/if}
		</button>

		{#if item.children?.length}
			<ul class="mt-0.5 space-y-0.5">
				{#each item.children as child, childIdx (child.title + child.page)}
					{@render tocItem(child, childIdx, depth + 1)}
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
		class="fixed top-0 bottom-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-ink/15 bg-cream shadow-[4px_0_24px_rgba(42,26,22,0.14)]"
		aria-label="Daftar Isi Buku"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-ink/15 bg-sand/30 px-4 py-3.5">
			<div class="flex items-center gap-2">
				<BookOpen size={16} class="shrink-0 text-brick" />
				<div>
					<h3 class="font-serif text-sm font-bold text-ink sm:text-base">Daftar Isi</h3>
					<p class="font-mono text-[10px] text-ink-muted">
						{sanitizedToc.length} bab / bagian terindeks
					</p>
				</div>
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
			{#if sanitizedToc.length === 0}
				<div class="px-4 py-12 text-center">
					<BookOpen size={32} class="mx-auto mb-3 text-ink-muted/40" />
					<p class="font-serif text-sm font-semibold text-ink">Daftar isi tidak tersedia</p>
					<p class="mt-1 text-xs text-ink-muted">
						Naskah ini belum memuat bookmark atau struktur bab terindeks.
					</p>
				</div>
			{:else}
				<ul class="space-y-1">
					{#each sanitizedToc as item, idx (item.title + item.page)}
						{@render tocItem(item, idx, 0)}
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Footer: current position indicator -->
		<div class="border-t border-ink/15 bg-sand/20 px-4 py-2.5">
			<div class="flex items-center justify-between font-mono text-[11px] text-ink-muted">
				<span>Navigasi Cepat</span>
				<span>
					Halaman <strong class="font-bold text-brick">{currentPage}</strong>
				</span>
			</div>
		</div>
	</aside>
{/if}
