<script lang="ts">
	import { X, Search, ChevronUp, ChevronDown, FileSearch } from 'lucide-svelte';

	interface SearchResult {
		page: number;
		snippet: string;
		matchIndex: number;
	}

	interface Props {
		isOpen: boolean;
		results?: SearchResult[];
		activeIndex?: number;
		isSearching?: boolean;
		onClose: () => void;
		onSearch: (query: string) => void;
		onNavigate: (page: number) => void;
		onPrevResult?: () => void;
		onNextResult?: () => void;
	}

	let {
		isOpen,
		results = [],
		activeIndex = 0,
		isSearching = false,
		onClose,
		onSearch,
		onNavigate,
		onPrevResult,
		onNextResult
	}: Props = $props();

	let query = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (isOpen && inputEl) {
			// Auto-focus when panel opens
			setTimeout(() => inputEl?.focus(), 80);
		}
	});

	function handleInput(e: Event) {
		query = (e.target as HTMLInputElement).value;
		onSearch(query);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (e.shiftKey) onPrevResult?.();
			else onNextResult?.();
		}
		if (e.key === 'Escape') onClose();
	}

	function clearSearch() {
		query = '';
		onSearch('');
		inputEl?.focus();
	}

	function highlightMatch(snippet: string, q: string): string {
		if (!q.trim()) return snippet;
		const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return snippet.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
	}
</script>

{#if isOpen}
	<!-- Search panel: slides down from toolbar -->
	<div
		class="z-20 w-full border-b border-ink/15 bg-cream shadow-[0_4px_12px_rgba(42,26,22,0.08)]"
		role="search"
		aria-label="Cari kata dalam buku"
	>
		<div class="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-3">
			<!-- Input row -->
			<div class="flex items-center gap-2">
				<div class="relative flex-1">
					<Search
						size={15}
						class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted/70"
					/>
					<input
						bind:this={inputEl}
						type="search"
						value={query}
						oninput={handleInput}
						onkeydown={handleKeydown}
						placeholder="Cari kata atau frasa dalam dokumen…"
						class="w-full rounded-sm border border-ink/20 bg-white py-2 pr-9 pl-9 font-sans
							text-sm text-ink transition-colors
							placeholder:text-ink-muted/60 focus:border-brick focus:ring-2 focus:ring-brick/50
							focus:outline-none"
						aria-label="Kata kunci pencarian"
						autocomplete="off"
						spellcheck="false"
					/>
					{#if query}
						<button
							type="button"
							onclick={clearSearch}
							class="absolute top-1/2 right-2.5 -translate-y-1/2 rounded
								p-0.5 text-ink-muted/60 transition-colors hover:text-ink"
							aria-label="Hapus pencarian"
						>
							<X size={13} />
						</button>
					{/if}
				</div>

				<!-- Prev / Next result -->
				<div class="flex shrink-0 items-center gap-1">
					<button
						type="button"
						onclick={onPrevResult}
						disabled={results.length === 0}
						class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted
							transition-colors hover:bg-sand/70 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
						aria-label="Hasil sebelumnya"
						title="Sebelumnya (Shift+Enter)"
					>
						<ChevronUp size={15} />
					</button>
					<button
						type="button"
						onclick={onNextResult}
						disabled={results.length === 0}
						class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted
							transition-colors hover:bg-sand/70 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
						aria-label="Hasil berikutnya"
						title="Berikutnya (Enter)"
					>
						<ChevronDown size={15} />
					</button>
					<button
						type="button"
						onclick={onClose}
						class="focus-library ml-1 rounded-sm p-1.5 text-ink-muted
							transition-colors hover:bg-sand/70 hover:text-ink"
						aria-label="Tutup panel pencarian"
						title="Tutup (Esc)"
					>
						<X size={15} />
					</button>
				</div>
			</div>

			<!-- Result summary -->
			{#if query.trim()}
				<div class="flex items-center gap-2 font-mono text-xs text-ink-muted">
					{#if isSearching}
						<span class="animate-pulse">Mencari…</span>
					{:else if results.length === 0}
						<span class="text-brick/80">Tidak ditemukan untuk "{query}"</span>
					{:else}
						<span>
							<span class="font-bold text-ink">{activeIndex + 1}</span>
							&nbsp;/&nbsp;
							<span class="font-bold text-ink">{results.length}</span>
							&nbsp;hasil ditemukan
						</span>
					{/if}
				</div>
			{/if}

			<!-- Results list (max 6 visible) -->
			{#if results.length > 0 && query.trim()}
				<ul
					class="max-h-52 divide-y divide-ink/8 overflow-y-auto rounded-sm border border-ink/10 bg-white/60"
					role="listbox"
					aria-label="Hasil pencarian"
				>
					{#each results as result, i (result.page + '-' + i)}
						<li role="option" aria-selected={i === activeIndex}>
							<button
								type="button"
								onclick={() => onNavigate(result.page)}
								class="w-full px-3 py-2 text-left text-sm transition-colors
									{i === activeIndex ? 'border-l-2 border-brick bg-sand/80' : 'hover:bg-sand/40'}"
							>
								<p class="mb-0.5 font-mono text-[10px] tracking-wide text-ink-muted/80 uppercase">
									Halaman {result.page}
								</p>
								<p class="line-clamp-2 text-xs leading-snug text-ink">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html highlightMatch(result.snippet, query)}
								</p>
							</button>
						</li>
					{/each}
				</ul>
			{:else if !query.trim()}
				<!-- Empty state -->
				<div class="flex items-center gap-2 py-1 text-xs text-ink-muted/70">
					<FileSearch size={13} class="shrink-0" />
					<span>Ketik kata kunci untuk mencari di seluruh halaman dokumen.</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	:global(mark) {
		background-color: #e2c799;
		color: #2a1a16;
		border-radius: 2px;
		padding: 0 2px;
		font-weight: 600;
	}
</style>
