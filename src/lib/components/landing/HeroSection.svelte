<script lang="ts">
	import SearchAutocomplete from '#lib/components/search/SearchAutocomplete.svelte';
	import BookCover from '#lib/components/book/BookCover.svelte';
	import type { BookData } from '#lib/types';

	interface Props {
		books?: BookData[];
	}

	let { books = [] }: Props = $props();

	const heroBooks = $derived(books.slice(0, 3));
</script>

<section class="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20">
	<!-- Subtle warm background wash -->
	<div
		class="mx-auto grid max-w-300 grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8"
	>
		<!-- Left Column: Headline, Search, Metrics (Asymmetric 7 cols) -->
		<div class="z-10 flex flex-col items-start lg:col-span-7">
			<!-- Eyebrow -->
			<div
				class="mb-4 inline-flex items-center gap-2 rounded-xs border border-ink/15 bg-sand/60 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-ink uppercase sm:text-xs"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-brick"></span>
				<span>Perpustakaan Digital Universitas Muhammadiyah Kotabumi</span>
			</div>

			<!-- Main Headline (Fluid scale, line-height 1.02) -->
			<h1
				class="mb-4 font-serif text-[clamp(40px,5vw,70px)] leading-[1.04] font-bold tracking-tight text-ink"
			>
				Seluruh koleksi kampus, <span class="text-brick italic">terbuka</span> untuk dibaca.
			</h1>

			<!-- Subtitle (1 kalimat lugas) -->
			<p class="mb-7 max-w-xl font-sans text-base leading-[1.65] text-ink-muted sm:text-lg">
				Akses ratusan buku teks kuliah, monograf keilmuan, dan karya ilmiah civitas akademika UMKO
				yang dapat dibaca nyaman di peramban tanpa antrean unduh.
			</p>

			<!-- Primary Search Bar (Fokus Utama) -->
			<div class="mb-8 w-full max-w-xl">
				<SearchAutocomplete />
			</div>

			<!-- Quick Metrics in IBM Plex Mono -->
			<div class="grid w-full max-w-xl grid-cols-3 gap-4 border-t border-ink/15 pt-6">
				<div>
					<span class="block font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						1.428
					</span>
					<span class="mt-0.5 block font-sans text-xs text-ink-muted"> Judul Ebook Aktif </span>
				</div>
				<div>
					<span class="block font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						12
					</span>
					<span class="mt-0.5 block font-sans text-xs text-ink-muted"> Klasifikasi Bidang </span>
				</div>
				<div>
					<span class="block font-mono text-2xl font-bold tracking-tight text-brick sm:text-3xl">
						3.894
					</span>
					<span class="mt-0.5 block font-sans text-xs text-ink-muted"> Pembaca Terdaftar </span>
				</div>
			</div>
		</div>

		<!-- Right Column: Stacked & Tilted Books from Real Collection (5 cols) -->
		<div class="relative flex items-center justify-center py-6 sm:py-10 lg:col-span-5">
			<!-- Visual Composition of layered real books -->
			<div class="relative flex h-95 w-70 items-center justify-center sm:h-110 sm:w-80">
				<!-- Background glow/shadow disk -->
				<div
					class="pointer-events-none absolute -z-10 h-64 w-64 rounded-full bg-sand/50 blur-2xl"
				></div>

				<!-- Book 3: Tilted left & back -->
				{#if heroBooks[2]}
					<div
						class="absolute top-4 -left-2 z-10 -rotate-6 transform transition-transform duration-500 hover:-translate-y-2 hover:-rotate-3 sm:-left-4"
					>
						<a
							href="/buku/{heroBooks[2].slug}"
							class="focus-library block rounded-sm"
							title={heroBooks[2].title}
						>
							<BookCover
								title={heroBooks[2].title}
								slug={heroBooks[2].slug}
								author={heroBooks[2].author}
								src={heroBooks[2].coverUrl}
								classification={heroBooks[2].classification}
								size="lg"
								class="w-37.5 opacity-85 shadow-lg sm:w-42.5"
							/>
						</a>
					</div>
				{/if}

				<!-- Book 2: Tilted right & mid -->
				{#if heroBooks[1]}
					<div
						class="absolute top-8 -right-2 z-20 rotate-6 transform transition-transform duration-500 hover:-translate-y-2 hover:rotate-3 sm:-right-4"
					>
						<a
							href="/buku/{heroBooks[1].slug}"
							class="focus-library block rounded-sm"
							title={heroBooks[1].title}
						>
							<BookCover
								title={heroBooks[1].title}
								slug={heroBooks[1].slug}
								author={heroBooks[1].author}
								src={heroBooks[1].coverUrl}
								classification={heroBooks[1].classification}
								size="lg"
								class="w-40 opacity-95 shadow-xl sm:w-45"
							/>
						</a>
					</div>
				{/if}

				<!-- Book 1: Front and center (Prominent) -->
				{#if heroBooks[0]}
					<div
						class="relative z-30 -rotate-1 transform transition-transform duration-500 hover:-translate-y-2 hover:rotate-0"
					>
						<a
							href="/buku/{heroBooks[0].slug}"
							class="focus-library block rounded-sm"
							title={heroBooks[0].title}
						>
							<BookCover
								title={heroBooks[0].title}
								slug={heroBooks[0].slug}
								author={heroBooks[0].author}
								src={heroBooks[0].coverUrl}
								classification={heroBooks[0].classification}
								isFeatured={true}
								isSaved={true}
								size="xl"
								class="book-shadow-hover w-45 sm:w-52.5"
							/>
						</a>
					</div>
				{/if}

				<!-- Subtle shelf floor line beneath the books -->
				<div
					class="pointer-events-none absolute -bottom-4 z-0 h-3 w-72 rounded-full bg-black/15 blur-sm sm:w-80"
				></div>
			</div>
		</div>
	</div>
</section>
