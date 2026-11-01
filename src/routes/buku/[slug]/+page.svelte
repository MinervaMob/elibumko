<script lang="ts">
	import Header from '#lib/components/layout/Header.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import BookCover from '#lib/components/book/BookCover.svelte';
	import BookShelf from '#lib/components/book/BookShelf.svelte';
	import { Button } from '#lib';
	import type { PageData } from './$types';
	import {
		BookOpen,
		Bookmark,
		BookmarkCheck,
		ShieldCheck,
		Share2,
		ChevronRight,
		Eye,
		Check,
		ListFilter
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const book = $derived(data.book);
	const relatedBooks = $derived(data.relatedBooks);

	let isSavedOverride = $state<boolean | null>(null);
	const isSaved = $derived(isSavedOverride !== null ? isSavedOverride : (book.isSaved ?? false));
	let isSynopsisExpanded = $state(false);
	let isCopied = $state(false);

	function toggleSave() {
		isSavedOverride = !isSaved;
	}

	function handleShare() {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(window.location.href);
			isCopied = true;
			setTimeout(() => (isCopied = false), 2500);
		}
	}

	// Schema.org JSON-LD structured data for book
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Book',
			name: book.title,
			author: {
				'@type': 'Person',
				name: book.author
			},
			publisher: {
				'@type': 'Organization',
				name: book.publisher ?? 'UMKO Press'
			},
			datePublished: String(book.year ?? '2024'),
			isbn: book.isbn ?? '978-602-05-2418-4',
			numberOfPages: book.pages ?? 300,
			inLanguage: book.language ?? 'id',
			bookFormat: 'https://schema.org/EBook',
			description: book.synopsis ?? ''
		})
	);
</script>

<svelte:head>
	<title>{book.title} — ElibUMKO</title>
	<meta name="description" content={book.synopsis ?? book.title} />
	<meta property="og:title" content="{book.title} — Perpustakaan Digital UMKO" />
	<meta property="og:description" content={book.synopsis ?? book.title} />
	<meta property="og:type" content="book" />
	<meta property="og:site_name" content="ElibUMKO" />
	<!-- Structure Data JSON-LD -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}</` + `script>`}
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-cream text-ink selection:bg-terracotta/30 selection:text-ink"
>
	<Header />

	<main class="mx-auto w-full max-w-300 grow px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
		<!-- Breadcrumbs -->
		<nav
			class="mb-8 flex items-center gap-2 overflow-x-auto font-mono text-xs text-ink-muted"
			aria-label="Breadcrumb"
		>
			<a href="/" class="focus-library shrink-0 transition-colors hover:text-brick">Beranda</a>
			<ChevronRight size={13} class="shrink-0 opacity-50" />
			<a href="/rak" class="focus-library shrink-0 transition-colors hover:text-brick">Rak Buku</a>
			{#if book.ddcCode}
				<ChevronRight size={13} class="shrink-0 opacity-50" />
				<a
					href="/rak/{book.ddcCode}"
					class="focus-library shrink-0 transition-colors hover:text-brick"
				>
					DDC {book.ddcCode}
				</a>
			{/if}
			<ChevronRight size={13} class="shrink-0 opacity-50" />
			<span class="truncate font-semibold text-ink">{book.title}</span>
		</nav>

		<!-- Main 2-Column Detail Block -->
		<div class="mb-16 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
			<!-- LEFT COLUMN: Large Cover + Access Protection Badge (4 cols) -->
			<div class="flex flex-col items-center sm:items-start lg:sticky lg:top-24 lg:col-span-4">
				<div class="relative mx-auto w-full max-w-70 sm:mx-0">
					<BookCover
						title={book.title}
						slug={book.slug}
						author={book.author}
						src={book.coverUrl}
						classification={book.classification}
						{isSaved}
						isFeatured={book.isFeatured}
						size="xl"
						class="book-shadow-hover w-full"
					/>
				</div>

				<!-- Read-Only Protection Badge -->
				<div
					class="mt-6 w-full max-w-70 space-y-2 rounded-md border border-ink/15 bg-sand/40 p-3.5 text-xs text-ink"
				>
					<div class="flex items-center gap-2 font-semibold text-brick">
						<ShieldCheck size={16} />
						<span>Akses Terproteksi (Hanya Baca)</span>
					</div>
					<p class="text-[11px] leading-relaxed text-ink-muted">
						Buku ini dilindungi hak cipta universitas dan disajikan secara aman tanpa unduhan berkas
						langsung.
					</p>
					<div
						class="flex items-center justify-between border-t border-ink/10 pt-2 font-mono text-[11px] text-ink-muted"
					>
						<span>Format Reader: PDF / EPUB</span>
						<span class="font-semibold text-brick">Aktif</span>
					</div>
				</div>
			</div>

			<!-- RIGHT COLUMN: Title, Metadata, Action Buttons, Synopsis, TOC (8 cols) -->
			<div class="flex flex-col lg:col-span-8">
				<!-- Category & DDC Tag row -->
				<div class="mb-3 flex flex-wrap items-center gap-2">
					{#if book.classification}
						<div class="catalog-card rounded-xs border border-ink/20 px-2.5 py-0.5">
							<span class="font-mono text-xs font-bold tracking-wider text-brick">
								DDC {book.classification}
							</span>
						</div>
					{/if}
					{#if book.category}
						<span
							class="rounded-xs border border-ink/10 bg-sand/60 px-2.5 py-0.5 text-xs font-medium text-ink"
						>
							{book.category}
						</span>
					{/if}
					{#if book.readersCount != null}
						<span class="ml-auto flex items-center gap-1 font-mono text-xs text-ink-muted">
							<Eye size={13} class="text-brick" />
							<span>{(book.readersCount ?? 0).toLocaleString('id-ID')} pembaca</span>
						</span>
					{/if}
				</div>

				<!-- Title (Serif Fraunces) -->
				<h1
					class="mb-3 font-serif text-2xl leading-[1.12] font-bold tracking-tight text-ink sm:text-4xl lg:text-[42px]"
				>
					{book.title}
				</h1>

				<!-- Author -->
				<div class="mb-6 font-sans text-base text-ink-muted sm:text-lg">
					Ditulis oleh <span class="font-semibold text-ink">{book.author}</span>
				</div>

				<!-- Primary Action Buttons -->
				<div class="mb-8 flex flex-wrap items-center gap-3 border-b border-ink/15 pb-8">
					<Button
						variant="primary"
						size="lg"
						href="/baca/{book.slug}"
						class="min-w-50 flex-1 sm:flex-initial"
					>
						{#snippet iconLeft()}
							<BookOpen size={18} />
						{/snippet}
						<span>Baca Sekarang</span>
					</Button>

					<Button variant="secondary" size="lg" onclick={toggleSave} class="border border-ink/20">
						{#snippet iconLeft()}
							{#if isSaved}
								<BookmarkCheck size={18} class="text-brick" />
							{:else}
								<Bookmark size={18} class="text-ink-muted" />
							{/if}
						{/snippet}
						<span>{isSaved ? 'Tersimpan di Rak' : 'Simpan ke Daftar Baca'}</span>
					</Button>

					<button
						type="button"
						onclick={handleShare}
						class="focus-library rounded-md border border-ink/15 bg-sand/40 p-3 text-ink transition-colors hover:bg-sand"
						aria-label="Salin tautan buku"
						title="Bagikan tautan buku"
					>
						{#if isCopied}
							<Check size={18} class="text-emerald-700" />
						{:else}
							<Share2 size={18} />
						{/if}
					</button>
				</div>

				<!-- Metadata Grid (Table of Bibliographic Records) -->
				<div class="catalog-card mb-8 rounded-lg border border-ink/15 bg-sand/25 p-5 sm:p-6">
					<h3
						class="mb-4 flex items-center justify-between border-b border-ink/10 pb-2 font-mono text-xs font-semibold tracking-wider text-ink-muted uppercase"
					>
						<span>Data Bibliografi Katalog Perpustakaan</span>
						<span class="text-[10px]">Standar Nasional Perpustakaan</span>
					</h3>

					<div class="grid grid-cols-2 gap-x-6 gap-y-4 text-xs sm:grid-cols-3 sm:text-sm">
						<div>
							<span class="block font-sans text-xs text-ink-muted">Penerbit:</span>
							<span class="mt-0.5 block font-medium text-ink">{book.publisher ?? 'UMKO Press'}</span
							>
						</div>
						<div>
							<span class="block font-sans text-xs text-ink-muted">Tahun Terbit:</span>
							<span class="mt-0.5 block font-mono font-medium text-ink">{book.year ?? '2024'}</span>
						</div>
						<div>
							<span class="block font-sans text-xs text-ink-muted">Edisi / Cetakan:</span>
							<span class="mt-0.5 block font-medium text-ink"
								>{book.edition ?? 'Edisi Pertama'}</span
							>
						</div>
						<div>
							<span class="block font-sans text-xs text-ink-muted">Nomor Standar ISBN:</span>
							<span class="mt-0.5 block font-mono font-medium text-ink"
								>{book.isbn ?? '978-602-05-2418-4'}</span
							>
						</div>
						<div>
							<span class="block font-sans text-xs text-ink-muted">Jumlah Halaman:</span>
							<span class="mt-0.5 block font-mono font-medium text-ink"
								>{book.pages ?? 320} halaman</span
							>
						</div>
						<div>
							<span class="block font-sans text-xs text-ink-muted">Bahasa Teks:</span>
							<span class="mt-0.5 block font-medium text-ink"
								>{book.language ?? 'Bahasa Indonesia'}</span
							>
						</div>
					</div>
				</div>

				<!-- Synopsis Section with Expand/Collapse -->
				<div class="mb-8 border-b border-ink/15 pb-8">
					<h3 class="mb-3 font-serif text-xl font-bold text-ink">Sinopsis Buku</h3>
					<div class="prose max-w-none font-sans text-sm leading-relaxed text-ink sm:text-base">
						<p class={!isSynopsisExpanded ? 'line-clamp-4' : ''}>
							{book.synopsis ??
								'Buku ini merupakan referensi akademik resmi yang diterbitkan untuk menunjang perkuliahan, riset keilmuan, dan penyusunan tugas akhir mahasiswa Universitas Muhammadiyah Kotabumi.'}
						</p>
					</div>

					<button
						type="button"
						onclick={() => (isSynopsisExpanded = !isSynopsisExpanded)}
						class="focus-library mt-2 text-xs font-semibold text-brick transition-colors hover:text-brick-dark"
					>
						{isSynopsisExpanded ? 'Sembunyikan sinopsis &uarr;' : 'Baca selengkapnya &rarr;'}
					</button>
				</div>

				<!-- Subject / Tags -->
				{#if book.tags && book.tags.length > 0}
					<div class="mb-8 border-b border-ink/15 pb-8">
						<span
							class="mb-2.5 block font-mono text-xs font-semibold tracking-wider text-ink-muted uppercase"
						>
							Subjek & Kata Kunci Terkait
						</span>
						<div class="flex flex-wrap gap-2">
							{#each book.tags as tag (tag)}
								<a
									href="/rak?q={encodeURIComponent(tag)}"
									class="focus-library rounded-sm border border-ink/15 bg-sand/40 px-2.5 py-1 text-xs text-ink transition-colors hover:bg-sand"
								>
									#{tag}
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Table of Contents (Daftar Isi) -->
				{#if book.toc && book.toc.length > 0}
					<div class="mb-8">
						<div class="mb-3 flex items-center gap-2">
							<ListFilter size={18} class="text-brick" />
							<h3 class="font-serif text-xl font-bold text-ink">Daftar Isi Buku</h3>
						</div>

						<div
							class="catalog-card divide-y divide-ink/10 overflow-hidden rounded-lg border border-ink/15 bg-cream"
						>
							{#each book.toc as item, idx (item.title + '-' + idx)}
								<div
									class="flex items-center justify-between p-3 text-xs transition-colors hover:bg-sand/30 sm:px-4 sm:text-sm"
								>
									<span class="font-medium text-ink">{item.title}</span>
									<span class="ml-4 shrink-0 font-mono text-ink-muted">hlm. {item.page}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- RELATED BOOKS SECTION: "Mungkin Anda Juga Baca" (Standing on physical wooden shelf) -->
		{#if relatedBooks.length > 0}
			<div class="border-t border-ink/15 pt-8">
				<BookShelf
					title="Mungkin Anda Juga Baca"
					code={book.classification ?? 'DDC'}
					description="Rekomendasi buku rujukan terkait dalam bidang ilmu yang serupa"
					books={relatedBooks}
					href="/rak/{book.ddcCode ?? ''}"
				/>
			</div>
		{/if}
	</main>

	<Footer />
</div>
