<script lang="ts">
	import Header from '#lib/components/layout/Header.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import BookShelf from '#lib/components/book/BookShelf.svelte';
	import BookCard from '#lib/components/book/BookCard.svelte';
	import ShelfTreeSidebar from '#lib/components/book/ShelfTreeSidebar.svelte';
	import type { PageData } from './$types';
	import {
		Search,
		LayoutGrid,
		List,
		Layers,
		ChevronRight,
		ArrowLeft,
		RotateCcw
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let sortBy = $state<'populer' | 'terbaru' | 'az'>('populer');
	let displayMode = $state<'shelf' | 'grid' | 'list'>('shelf');
	let visibleCount = $state(8);

	const filteredBooks = $derived.by(() => {
		let list = [...(data?.books || [])];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter(
				(b) =>
					b.title.toLowerCase().includes(q) ||
					b.author.toLowerCase().includes(q) ||
					(b.classification && b.classification.includes(q))
			);
		}

		if (sortBy === 'populer') {
			list.sort((a, b) => (b.readersCount ?? 0) - (a.readersCount ?? 0));
		} else if (sortBy === 'terbaru') {
			list.sort((a, b) => (b.year ? Number(b.year) : 0) - (a.year ? Number(a.year) : 0));
		} else if (sortBy === 'az') {
			list.sort((a, b) => a.title.localeCompare(b.title));
		}

		return list;
	});

	const paginatedBooks = $derived(filteredBooks.slice(0, visibleCount));
	const hasMoreBooks = $derived(visibleCount < filteredBooks.length);
</script>

<svelte:head>
	<title>{data.code} — {data.title} | ElibUMKO</title>
	<meta name="description" content={data.description} />
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-cream text-ink selection:bg-terracotta/30 selection:text-ink"
>
	<Header />

	<main class="mx-auto w-full max-w-300 grow px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
		<!-- Breadcrumbs -->
		<nav
			class="mb-6 flex items-center gap-2 font-mono text-xs text-ink-muted"
			aria-label="Breadcrumb"
		>
			<a href="/" class="focus-library transition-colors hover:text-brick">Beranda</a>
			<ChevronRight size={13} class="opacity-50" />
			<a href="/rak" class="focus-library transition-colors hover:text-brick">Rak Buku</a>
			<ChevronRight size={13} class="opacity-50" />
			<span class="font-semibold text-ink">{data.code} — {data.title}</span>
		</nav>

		<!-- Page Header with Library Catalog Placard -->
		<div
			class="mb-8 flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-end"
		>
			<div>
				<div class="mb-3 inline-flex items-center gap-2">
					<div class="catalog-card rounded-xs border border-ink/20 px-2.5 py-1">
						<span class="font-mono text-xs font-bold tracking-wider text-brick">
							DDC {data.code}
						</span>
					</div>
					<span class="font-mono text-xs text-ink-muted">
						{data.books.length} Koleksi Terbit
					</span>
				</div>
				<h1 class="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
					{data.title}
				</h1>
				<p class="mt-1.5 max-w-2xl font-sans text-sm leading-relaxed text-ink-muted sm:text-base">
					{data.description}
				</p>
			</div>

			<a
				href="/rak"
				class="focus-library inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-sand/40 hover:text-ink"
			>
				<ArrowLeft size={14} />
				<span>Kembali ke Semua Rak</span>
			</a>
		</div>

		<!-- Main 2-Column Layout -->
		<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
			<!-- Left: Collapsible Tree Sidebar (Active code highlighted) -->
			<div class="sticky top-24 lg:col-span-4">
				<ShelfTreeSidebar activeCode={data.code} tree={data.ddcTree} />
			</div>

			<!-- Right: Books in current classification -->
			<div class="flex min-w-0 flex-col lg:col-span-8">
				<!-- Search and Filter Bar -->
				<div
					class="mb-8 flex flex-col items-stretch justify-between gap-3 rounded-lg border border-ink/15 bg-sand/30 p-4 shadow-xs sm:flex-row sm:items-center"
				>
					<div class="relative flex-1">
						<Search
							size={17}
							class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
						/>
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Cari dalam kelas {data.code}..."
							class="w-full rounded-md border border-ink/20 bg-white py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brick focus:outline-none"
						/>
					</div>

					<!-- View switcher -->
					<div
						class="flex shrink-0 items-center gap-1 self-end rounded-md border border-ink/15 bg-cream/70 p-1 sm:self-auto"
					>
						<button
							type="button"
							onclick={() => (displayMode = 'shelf')}
							class="focus-library flex items-center gap-1 rounded-sm p-1.5 text-xs font-medium transition-colors {displayMode ===
							'shelf'
								? 'bg-brick text-cream shadow-xs'
								: 'text-ink-muted hover:text-ink'}"
							title="Tampilan Rak Kayu Fisik"
						>
							<Layers size={15} />
							<span class="hidden sm:inline">Rak</span>
						</button>
						<button
							type="button"
							onclick={() => (displayMode = 'grid')}
							class="focus-library flex items-center gap-1 rounded-sm p-1.5 text-xs font-medium transition-colors {displayMode ===
							'grid'
								? 'bg-brick text-cream shadow-xs'
								: 'text-ink-muted hover:text-ink'}"
							title="Tampilan Grid Sampul 2:3"
						>
							<LayoutGrid size={15} />
							<span class="hidden sm:inline">Grid</span>
						</button>
						<button
							type="button"
							onclick={() => (displayMode = 'list')}
							class="focus-library flex items-center gap-1 rounded-sm p-1.5 text-xs font-medium transition-colors {displayMode ===
							'list'
								? 'bg-brick text-cream shadow-xs'
								: 'text-ink-muted hover:text-ink'}"
							title="Tampilan Daftar Bibliografi"
						>
							<List size={15} />
							<span class="hidden sm:inline">Daftar</span>
						</button>
					</div>
				</div>

				<!-- CONTENT -->
				{#if filteredBooks.length === 0}
					<div class="rounded-lg border border-ink/15 bg-sand/20 p-10 text-center">
						<p class="mb-1 font-serif text-lg font-bold text-ink">
							Tidak ada buku yang cocok dalam kelas ini
						</p>
						<p class="mb-4 text-xs text-ink-muted">
							Cobalah gunakan kata kunci lain atau lihat seluruh rak.
						</p>
						<button
							type="button"
							onclick={() => (searchQuery = '')}
							class="inline-flex items-center gap-1 rounded-sm bg-brick px-3 py-1.5 text-xs font-semibold text-cream"
						>
							<RotateCcw size={13} />
							<span>Reset Pencarian</span>
						</button>
					</div>
				{:else if displayMode === 'shelf'}
					<BookShelf
						title={data.title}
						code="DDC {data.code}"
						description={data.description}
						books={filteredBooks}
					/>
				{:else if displayMode === 'grid'}
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
						{#each paginatedBooks as book (book.id)}
							<BookCard {book} layout="grid" showActions={true} />
						{/each}
					</div>

					{#if hasMoreBooks}
						<div class="mt-8 text-center">
							<button
								type="button"
								onclick={() => (visibleCount += 8)}
								class="rounded-md border border-ink/20 bg-sand px-5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand-dark"
							>
								Muat Lebih Banyak ({filteredBooks.length - visibleCount} tersisa)
							</button>
						</div>
					{/if}
				{:else}
					<div class="space-y-3">
						{#each paginatedBooks as book (book.id)}
							<BookCard {book} layout="list" />
						{/each}
					</div>

					{#if hasMoreBooks}
						<div class="mt-8 text-center">
							<button
								type="button"
								onclick={() => (visibleCount += 8)}
								class="rounded-md border border-ink/20 bg-sand px-5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sand-dark"
							>
								Muat Lebih Banyak ({filteredBooks.length - visibleCount} tersisa)
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</main>

	<Footer />
</div>
