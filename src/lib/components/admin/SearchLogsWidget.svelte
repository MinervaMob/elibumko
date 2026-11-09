<script lang="ts">
	import { Search, AlertCircle, ArrowRight } from 'lucide-svelte';
	import type { SearchLogItem } from '#lib/types';

	interface Props {
		popularQueries: SearchLogItem[];
		zeroResultQueries: SearchLogItem[];
		class?: string;
	}

	let { popularQueries, zeroResultQueries, class: className = '' }: Props = $props();

	type Tab = 'popular' | 'zero';
	let activeTab = $state<Tab>('popular');
</script>

<div
	class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6 {className}"
>
	<!-- Header with Tab Switcher -->
	<div
		class="flex flex-col items-start justify-between gap-3 border-b border-ink/15 pb-3 sm:flex-row sm:items-center"
	>
		<div class="flex items-center gap-2">
			<Search size={18} class="text-brick" />
			<h3 class="font-serif text-base font-bold text-ink sm:text-lg">Log Pencarian Sivitas</h3>
		</div>

		<!-- Tabs -->
		<div class="flex items-center rounded-md border border-ink/15 bg-sand/50 p-1 text-xs">
			<button
				type="button"
				class="focus-library rounded-sm px-2.5 py-1 font-medium transition-all {activeTab ===
				'popular'
					? 'bg-brick font-semibold text-cream shadow-xs'
					: 'text-ink-muted hover:text-ink'}"
				onclick={() => (activeTab = 'popular')}
			>
				Populer ({popularQueries.length})
			</button>
			<button
				type="button"
				class="focus-library flex items-center gap-1 rounded-sm px-2.5 py-1 font-medium transition-all {activeTab ===
				'zero'
					? 'bg-brick font-semibold text-cream shadow-xs'
					: 'text-ink-muted hover:text-ink'}"
				onclick={() => (activeTab = 'zero')}
			>
				<span>Tanpa Hasil</span>
				{#if zeroResultQueries.length > 0}
					<span
						class="h-1.5 w-1.5 rounded-full {activeTab === 'zero'
							? 'bg-cream'
							: 'animate-ping bg-brick'}"
					></span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Tab Content -->
	<div class="mt-4">
		{#if activeTab === 'popular'}
			{#if popularQueries.length === 0}
				<div class="py-8 text-center">
					<Search size={26} class="mx-auto mb-2 text-ink-muted/50" />
					<p class="font-serif text-sm font-bold text-ink">Belum Ada Riwayat Pencarian</p>
					<p class="mx-auto mt-1 max-w-xs text-xs text-ink-muted">
						Kata kunci yang sering dicari civitas akademika di perpustakaan akan dianalisis di sini
						secara otomatis.
					</p>
				</div>
			{:else}
				<p class="mb-3 text-xs text-ink-muted">
					Kata kunci yang paling sering dicari mahasiswa dan dosen dalam 30 hari terakhir:
				</p>

				<div class="divide-y divide-ink/10">
					{#each popularQueries as item, i (item.id)}
						<div class="flex items-center justify-between gap-3 py-2.5">
							<div class="flex min-w-0 items-center gap-2.5">
								<span class="w-4 text-center font-mono text-xs font-bold text-ink-muted">
									{i + 1}.
								</span>
								<span class="truncate text-xs font-medium text-ink sm:text-sm">
									"{item.query}"
								</span>
							</div>

							<div class="flex shrink-0 items-center gap-3">
								<span class="font-mono text-[11px] text-ink-muted">
									{item.resultsCount} hasil
								</span>
								<span
									class="rounded-xs bg-brick/10 px-2 py-0.5 font-mono text-xs font-bold text-brick"
								>
									{item.count}×
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			{#if zeroResultQueries.length === 0}
				<div class="py-8 text-center">
					<AlertCircle size={26} class="mx-auto mb-2 text-emerald-600/70" />
					<p class="font-serif text-sm font-bold text-ink">Tidak Ada Pencarian Nihil</p>
					<p class="mx-auto mt-1 max-w-xs text-xs text-ink-muted">
						Semua topik dan kata kunci yang dicari sivitas akademika berhasil menemukan buku relevan
						di repositori.
					</p>
				</div>
			{:else}
				<!-- Zero Results Notice (Acquisition Opportunity) -->
				<div
					class="mb-3 flex items-start gap-2.5 rounded-md border border-terracotta/30 bg-terracotta/15 p-3"
				>
					<AlertCircle size={16} class="mt-0.5 shrink-0 text-brick" />
					<div class="text-xs leading-relaxed text-ink">
						<span class="font-bold text-brick">Peluang Pengadaan Buku:</span>
						Topik di bawah ini dicari berulang kali oleh mahasiswa tetapi belum tersedia di koleksi kampus.
					</div>
				</div>

				<div class="divide-y divide-ink/10">
					{#each zeroResultQueries as item (item.id)}
						<div class="flex items-center justify-between gap-3 py-2.5">
							<div class="min-w-0">
								<p class="truncate text-xs font-semibold text-ink sm:text-sm">
									"{item.query}"
								</p>
								<p class="font-mono text-[10px] text-ink-muted">
									Terakhir dicari {item.lastSearched}
								</p>
							</div>

							<div class="flex shrink-0 items-center gap-2">
								<span
									class="rounded-xs bg-sand/80 px-2 py-0.5 font-mono text-xs font-bold text-ink-muted"
								>
									{item.count} pencarian
								</span>
								<a
									href="/admin/buku?action=tambah&query={encodeURIComponent(item.query)}"
									class="focus-library rounded-sm p-1 text-brick transition-colors hover:bg-sand/60"
									title="Tambah buku untuk topik ini"
								>
									<ArrowRight size={14} />
								</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
