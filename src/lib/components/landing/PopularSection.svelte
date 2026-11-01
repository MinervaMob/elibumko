<script lang="ts">
	import type { BookData } from '#lib/types';
	import RankingRow from '#lib/components/book/RankingRow.svelte';
	import { TrendingUp, ArrowRight } from 'lucide-svelte';

	interface Props {
		books?: BookData[];
	}

	let { books = [] }: Props = $props();

	// Sort by reader count descending to form true ranking
	const sortedBooks = $derived(
		[...books].sort((a, b) => (b.readersCount ?? 0) - (a.readersCount ?? 0))
	);

	const leftColumn = $derived(sortedBooks.slice(0, 4));
	const rightColumn = $derived(sortedBooks.slice(4, 8));
</script>

<section class="py-14 sm:py-20">
	<div class="mx-auto max-w-300 px-4 sm:px-6 lg:px-8">
		<!-- Section Header -->
		<div
			class="mb-10 flex flex-col justify-between gap-4 border-b border-ink/15 pb-3 md:flex-row md:items-end"
		>
			<div>
				<div
					class="mb-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-[0.12em] text-brick uppercase"
				>
					<TrendingUp size={14} />
					<span>Statistik Membaca Kampus</span>
				</div>
				<h2 class="font-serif text-2xl font-bold tracking-tight text-ink sm:text-4xl">
					Buku Paling Populer
				</h2>
				<p class="mt-1 max-w-xl font-sans text-sm text-ink-muted sm:text-base">
					Berdasarkan frekuensi baca dan durasi waktu membaca aktif mahasiswa serta dosen di portal
					ElibUMKO.
				</p>
			</div>

			<a
				href="/rak?sort=populer"
				class="focus-library inline-flex items-center gap-1.5 text-xs font-semibold text-brick hover:text-brick-dark"
			>
				<span>Semua Buku Populer</span>
				<ArrowRight size={14} />
			</a>
		</div>

		<!-- Editorial Ranking Grid: 2 columns on desktop (1-4 on left, 5-8 on right) -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
			<!-- Left Column: Rank 1 - 4 -->
			<div
				class="catalog-card divide-y divide-ink/10 overflow-hidden rounded-lg border border-ink/15 bg-sand/15"
			>
				{#each leftColumn as book, index (book.slug)}
					<RankingRow rank={index + 1} {book} />
				{/each}
			</div>

			<!-- Right Column: Rank 5 - 8 -->
			<div
				class="catalog-card divide-y divide-ink/10 overflow-hidden rounded-lg border border-ink/15 bg-sand/15"
			>
				{#each rightColumn as book, index (book.slug)}
					<RankingRow rank={index + 5} {book} />
				{/each}
			</div>
		</div>
	</div>
</section>
