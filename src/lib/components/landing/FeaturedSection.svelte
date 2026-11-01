<script lang="ts">
	import type { BookData } from '#lib/types';
	import BookCover from '#lib/components/book/BookCover.svelte';
	import { ChevronLeft, ChevronRight, BookOpen, BookmarkCheck } from 'lucide-svelte';

	interface Props {
		books?: BookData[];
	}

	let { books = [] }: Props = $props();

	const featuredBooks = $derived(books.filter((b) => b.isFeatured || b.isSaved));
	let carouselContainer: HTMLElement | null = $state(null);

	function scrollCarousel(direction: 'left' | 'right') {
		if (!carouselContainer) return;
		const offset = direction === 'left' ? -340 : 340;
		carouselContainer.scrollBy({ left: offset, behavior: 'smooth' });
	}
</script>

<section id="rekomendasi" class="border-t border-b border-ink/10 bg-sand/20 py-14 sm:py-20">
	<div class="mx-auto max-w-300 px-4 sm:px-6 lg:px-8">
		<!-- Section Header -->
		<div class="mb-8 flex items-end justify-between border-b border-ink/15 pb-3">
			<div>
				<div
					class="mb-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-[0.12em] text-brick uppercase"
				>
					<BookmarkCheck size={14} />
					<span>Kurasi Pustakawan Kampus</span>
				</div>
				<h2 class="font-serif text-2xl font-bold tracking-tight text-ink sm:text-4xl">
					Pilihan Pustakawan
				</h2>
				<p class="mt-1 max-w-xl font-sans text-sm text-ink-muted sm:text-base">
					Buku rujukan esensial yang dikurasi khusus untuk mendukung kegiatan perkuliahan dan riset
					lintas program studi.
				</p>
			</div>

			<!-- Navigation Controls -->
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => scrollCarousel('left')}
					class="focus-library flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-cream text-ink shadow-xs transition-colors hover:bg-sand"
					aria-label="Geser ke buku sebelumnya"
				>
					<ChevronLeft size={18} />
				</button>
				<button
					type="button"
					onclick={() => scrollCarousel('right')}
					class="focus-library flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-cream text-ink shadow-xs transition-colors hover:bg-sand"
					aria-label="Geser ke buku berikutnya"
				>
					<ChevronRight size={18} />
				</button>
			</div>
		</div>

		<!-- Scroll-snap Horizontal Carousel -->
		<div
			bind:this={carouselContainer}
			class="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pt-2 pb-4 sm:gap-6"
			aria-label="Daftar buku rekomendasi pustakawan"
		>
			{#each featuredBooks as book (book.slug)}
				<div
					class="flex w-65 shrink-0 snap-start flex-col rounded-lg border border-ink/15 bg-cream p-4 shadow-[0_3px_10px_rgba(42,26,22,0.05)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-ink/30 sm:w-72.5"
				>
					<!-- Top classification badge -->
					<div class="mb-3 flex items-center justify-between">
						<span
							class="rounded-xs bg-brick px-2 py-0.5 font-mono text-[11px] font-bold text-cream"
						>
							Pilihan Pustakawan
						</span>
						{#if book.classification}
							<span
								class="rounded-xs bg-sand/60 px-1.5 py-0.5 font-mono text-xs font-semibold text-ink"
							>
								{book.classification}
							</span>
						{/if}
					</div>

					<!-- Book cover with spine shadow -->
					<a href="/buku/{book.slug}" class="focus-library mb-4 flex justify-center rounded-sm">
						<BookCover
							title={book.title}
							slug={book.slug}
							author={book.author}
							src={book.coverUrl}
							classification={book.classification}
							isFeatured={true}
							isSaved={book.isSaved}
							size="md"
							class="w-35 shadow-md"
						/>
					</a>

					<!-- Book title & Author -->
					<div class="flex flex-1 flex-col justify-between">
						<div>
							<h3
								class="line-clamp-2 font-serif text-base leading-snug font-bold text-ink transition-colors hover:text-brick"
							>
								<a href="/buku/{book.slug}" class="focus-library">
									{book.title}
								</a>
							</h3>
							<p class="mt-1 line-clamp-1 text-xs text-ink-muted">
								{book.author}
							</p>
						</div>

						<!-- Metadata & Quick Action -->
						<div class="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
							<span class="font-mono text-[11px] text-ink-muted">
								{book.pages ?? 320} hlm &bull; {book.year ?? '2024'}
							</span>
							<a
								href="/baca/{book.slug}"
								class="focus-library inline-flex items-center gap-1 rounded-sm bg-brick px-3 py-1 text-xs font-medium text-cream shadow-xs transition-colors hover:bg-brick-dark"
							>
								<BookOpen size={12} />
								<span>Baca</span>
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
