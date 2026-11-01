<script lang="ts">
	import type { PageData } from './$types';
	import type { BookData } from '#lib/types';
	import Header from '#lib/components/layout/Header.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import BookShelf from '#lib/components/book/BookShelf.svelte';
	import BookCard from '#lib/components/book/BookCard.svelte';
	import ShelfTreeSidebar from '#lib/components/book/ShelfTreeSidebar.svelte';
	import {
		Search,
		LayoutGrid,
		List,
		Layers,
		ChevronRight,
		BookOpen,
		RotateCcw
	} from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// svelte-ignore state_referenced_locally
	let searchQuery = $state(data.initialQuery || '');
	let selectedCategory = $state('all');
	let sortBy = $state<'populer' | 'terbaru' | 'az' | 'tahun'>('populer');
	let displayMode = $state<'shelf' | 'grid' | 'list'>('shelf');
	let visibleCount = $state(8);

	// Filter and sort computation
	const filteredBooks = $derived.by(() => {
		let list = [...data.books];

		// Search query filter
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter(
				(b) =>
					b.title.toLowerCase().includes(q) ||
					b.author.toLowerCase().includes(q) ||
					(b.classification && b.classification.includes(q)) ||
					(b.category && b.category.toLowerCase().includes(q))
			);
		}

		// Category filter
		if (selectedCategory !== 'all') {
			list = list.filter((b) => b.ddcCode === selectedCategory || b.category === selectedCategory);
		}

		// Sorting
		if (sortBy === 'populer') {
			list.sort((a, b) => (b.readersCount ?? 0) - (a.readersCount ?? 0));
		} else if (sortBy === 'terbaru') {
			list.sort((a, b) => (b.year ? Number(b.year) : 0) - (a.year ? Number(a.year) : 0));
		} else if (sortBy === 'az') {
			list.sort((a, b) => a.title.localeCompare(b.title));
		} else if (sortBy === 'tahun') {
			list.sort((a, b) => (b.year ? Number(b.year) : 0) - (a.year ? Number(a.year) : 0));
		}

		return list;
	});

	// Grouped books for physical shelf view (DDC 000, 200, 300, 400, 500, 600)
	const shelfGroups = $derived.by(() => {
		const groups: { code: string; title: string; description: string; books: BookData[] }[] = [];
		for (const node of data.ddcTree) {
			const booksInClass = filteredBooks.filter((b) => b.ddcCode === node.code);
			if (booksInClass.length > 0) {
				groups.push({
					code: node.code,
					title: node.name,
					description: `Koleksi resmi klasifikasi DDC ${node.code}`,
					books: booksInClass
				});
			}
		}
		return groups;
	});

	const paginatedBooks = $derived(filteredBooks.slice(0, visibleCount));
	const hasMoreBooks = $derived(visibleCount < filteredBooks.length);

	function loadMore() {
		visibleCount += 8;
	}

	function resetFilters() {
		searchQuery = '';
		selectedCategory = 'all';
		sortBy = 'populer';
	}
</script>

<svelte:head>
	<title>Rak Buku & Klasifikasi DDC — ElibUMKO</title>
	<meta
		name="description"
		content="Jelajahi rak buku digital Universitas Muhammadiyah Kotabumi berdasarkan klasifikasi Dewey Decimal Classification (DDC 000-900)."
	/>
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
			<span class="font-semibold text-ink">Rak Buku & Klasifikasi</span>
		</nav>

		<!-- Page Header -->
		<div class="mb-8 border-b border-ink/15 pb-6">
			<div
				class="mb-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-[0.12em] text-brick uppercase"
			>
				<BookOpen size={14} />
				<span>Koleksi Terbuka Kampus</span>
			</div>
			<h1 class="font-serif text-3xl font-bold tracking-tight text-ink sm:text-5xl">
				Rak Buku Berdasarkan Klasifikasi
			</h1>
			<p class="mt-2 max-w-3xl font-sans text-base leading-relaxed text-ink-muted sm:text-lg">
				Dikelompokkan menurut sistem Dewey Decimal Classification (DDC 000-900). Seluruh buku dapat
				dibaca langsung di peramban tanpa antrean unduh.
			</p>
		</div>

		<!-- Main 2-Column Layout: Sidebar + Shelf Content -->
		<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
			<!-- Left: Collapsible Classification Tree Sidebar (4 cols) -->
			<div class="sticky top-24 lg:col-span-4">
				<ShelfTreeSidebar activeCode="" />
				<ShelfTreeSidebar activeCode="" tree={data.ddcTree} />
			</div>

			<!-- Right: Books Content (8 cols) -->
			<div class="flex min-w-0 flex-col lg:col-span-8">
				<!-- Search and Filter Bar -->
				<div class="mb-8 space-y-3 rounded-lg border border-ink/15 bg-sand/30 p-4 shadow-xs">
					<!-- Top row: Search input + View switchers -->
					<div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
						<div class="relative flex-1">
							<Search
								size={17}
								class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
							/>
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Cari judul, penulis, atau kata kunci..."
								class="w-full rounded-md border border-ink/20 bg-white py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
							/>
						</div>

						<!-- Display View Modes -->
						<div
							class="flex shrink-0 items-center justify-end gap-1 rounded-md border border-ink/15 bg-cream/70 p-1"
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

					<!-- Bottom row: Dropdowns for category and sort -->
					<div
						class="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-2 text-xs"
					>
						<div class="flex flex-wrap items-center gap-3">
							<!-- Category select -->
							<div class="flex items-center gap-1.5">
								<span class="font-medium text-ink-muted">Klasifikasi:</span>
								<select
									bind:value={selectedCategory}
									class="rounded-sm border border-ink/20 bg-white px-2 py-1 text-xs text-ink focus:border-brick focus:outline-none"
								>
									<option value="all">Semua Bidang</option>
									{#each data.categories as cat (cat.code)}
										<option value={cat.code}>{cat.code} — {cat.name}</option>
									{/each}
								</select>
							</div>

							<!-- Sort select -->
							<div class="flex items-center gap-1.5">
								<span class="font-medium text-ink-muted">Urutan:</span>
								<select
									bind:value={sortBy}
									class="rounded-sm border border-ink/20 bg-white px-2 py-1 text-xs text-ink focus:border-brick focus:outline-none"
								>
									<option value="populer">Paling Banyak Dibaca</option>
									<option value="terbaru">Terbitan Terbaru</option>
									<option value="az">Judul (A–Z)</option>
									<option value="tahun">Tahun Terbit</option>
								</select>
							</div>
						</div>

						<div class="font-mono text-ink-muted">
							Menampilkan <span class="font-bold text-ink">{filteredBooks.length}</span> judul
						</div>
					</div>
				</div>

				<!-- CONTENT RENDER BASED ON DISPLAY MODE -->
				{#if filteredBooks.length === 0}
					<!-- Informative Empty State -->
					<div class="rounded-lg border border-ink/15 bg-sand/20 p-12 text-center">
						<BookOpen size={36} class="mx-auto mb-3 text-ink-muted/50" />
						<h3 class="mb-1 font-serif text-xl font-bold text-ink">Tidak Ada Buku yang Cocok</h3>
						<p class="mx-auto mb-5 max-w-md text-sm leading-relaxed text-ink-muted">
							Pencarian untuk "{searchQuery}" pada klasifikasi terpilih tidak membuahkan hasil. Coba
							periksa kembali ejaan atau reset filter.
						</p>
						<button
							type="button"
							onclick={resetFilters}
							class="focus-library inline-flex items-center gap-1.5 rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream shadow-xs transition-colors hover:bg-brick-dark"
						>
							<RotateCcw size={14} />
							<span>Reset Filter & Pencarian</span>
						</button>
					</div>
				{:else if displayMode === 'shelf'}
					<!-- 1. Physical Book Shelf View (Row of covers resting on wooden shelf plank) -->
					<div class="space-y-6">
						{#each shelfGroups as group (group.code)}
							<BookShelf
								title={group.title}
								code="DDC {group.code}"
								description={group.description}
								books={group.books}
								href="/rak/{group.code}"
							/>
						{/each}
					</div>
				{:else if displayMode === 'grid'}
					<!-- 2. Standard 2:3 Book Grid -->
					<div>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
							{#each paginatedBooks as book (book.id)}
								<BookCard {book} layout="grid" showActions={true} />
							{/each}
						</div>

						<!-- "Muat Lagi" pagination button (Anti-slop compliant) -->
						{#if hasMoreBooks}
							<div class="mt-10 text-center">
								<button
									type="button"
									onclick={loadMore}
									class="focus-library rounded-md border border-ink/20 bg-sand px-6 py-2.5 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-sand-dark"
								>
									Muat Lebih Banyak Koleksi ({filteredBooks.length - visibleCount} tersisa)
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<!-- 3. Bibliographic List View -->
					<div>
						<div class="space-y-3">
							{#each paginatedBooks as book (book.id)}
								<BookCard {book} layout="list" />
							{/each}
						</div>

						<!-- "Muat Lagi" pagination button -->
						{#if hasMoreBooks}
							<div class="mt-10 text-center">
								<button
									type="button"
									onclick={loadMore}
									class="focus-library rounded-md border border-ink/20 bg-sand px-6 py-2.5 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-sand-dark"
								>
									Muat Lebih Banyak Koleksi ({filteredBooks.length - visibleCount} tersisa)
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</main>

	<Footer />
</div>
