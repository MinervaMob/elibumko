<script lang="ts">
	/**
	 * /admin/buku — Modul CMS Manajemen Buku ElibUMKO
	 *
	 * Fitur:
	 * - CRUD Buku (Tambah, Sunting, Hapus soft-delete)
	 * - Unggah file PDF & EPUB dengan progress bar
	 * - Filter pencarian instan berdasarkan judul, penulis, ISBN, DDC, format
	 * - Notifikasi aksi interaktif
	 */

	import {
		BookOpen,
		Plus,
		Search,
		ArrowLeft,
		FileText,
		Book as BookIcon,
		Edit3,
		Trash2,
		CheckCircle2,
		Eye,
		Sparkles
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { BookData } from '#lib/types';
	import { BookCover } from '#lib';
	import BookFormModal from '#lib/components/admin/BookFormModal.svelte';
	import DeleteBookModal from '#lib/components/admin/DeleteBookModal.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Local mutable reactive state
	let localBooks = $state<BookData[] | null>(null);
	let books = $derived(localBooks ?? data.books);
	let searchQuery = $state('');
	let selectedCategory = $state('Semua');
	let selectedFormat = $state('Semua');

	// Modal States
	let isFormModalOpen = $state(false);
	let bookToEdit = $state<BookData | null>(null);

	let isDeleteModalOpen = $state(false);
	let bookToDelete = $state<BookData | null>(null);

	// Notification Toast
	let toastMessage = $state<string | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function showToast(msg: string) {
		toastMessage = msg;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toastMessage = null;
		}, 4000);
	}

	// Categories list for filtering
	const categories = $derived([
		'Semua',
		...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))
	]);

	// Filtered books
	const filteredBooks = $derived(
		books.filter((b) => {
			const matchQ =
				!searchQuery.trim() ||
				b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(b.isbn && b.isbn.includes(searchQuery)) ||
				(b.classification && b.classification.includes(searchQuery));

			const matchC = selectedCategory === 'Semua' || b.category === selectedCategory;

			const matchF =
				selectedFormat === 'Semua' ||
				(selectedFormat === 'pdf' && b.fileType !== 'epub') ||
				(selectedFormat === 'epub' && b.fileType === 'epub');

			return matchQ && matchC && matchF;
		})
	);

	function openCreateModal() {
		bookToEdit = null;
		isFormModalOpen = true;
	}

	function openEditModal(book: BookData) {
		bookToEdit = book;
		isFormModalOpen = true;
	}

	function openDeleteModal(book: BookData) {
		bookToDelete = book;
		isDeleteModalOpen = true;
	}

	function handleBookSaved(savedBook: BookData) {
		const current = [...books];
		const idx = current.findIndex((b) => b.slug === savedBook.slug);
		if (idx !== -1) {
			current[idx] = savedBook;
			showToast(`Perubahan metadata naskah "${savedBook.title}" berhasil disimpan.`);
		} else {
			current.unshift(savedBook);
			showToast(`Buku baru "${savedBook.title}" berhasil diterbitkan ke katalog.`);
		}
		localBooks = current;
	}

	function handleBookDeleted(slug: string) {
		const target = books.find((b) => b.slug === slug);
		localBooks = books.filter((b) => b.slug !== slug);
		showToast(`Buku "${target?.title || slug}" telah dihapus dari katalog aktif.`);
	}
</script>

<svelte:head>
	<title>Katalog & CMS Buku — Panel Pustakawan ElibUMKO</title>
</svelte:head>

<div class="space-y-6">
	<!-- Toast Notification Floating -->
	{#if toastMessage}
		<div
			class="animate-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-md border border-sand/40 bg-ink px-4 py-3 text-xs font-medium text-cream shadow-xl duration-200 sm:text-sm"
		>
			<CheckCircle2 size={16} class="shrink-0 text-brick" />
			<span>{toastMessage}</span>
		</div>
	{/if}

	<!-- Header Bar -->
	<div
		class="flex flex-col items-start justify-between gap-4 border-b border-ink/15 pb-4 sm:flex-row sm:items-center"
	>
		<div class="flex items-center gap-3">
			<a
				href="/admin"
				class="focus-library rounded-sm border border-ink/15 p-2 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
				title="Kembali ke Ringkasan"
			>
				<ArrowLeft size={16} />
			</a>
			<div>
				<h2 class="font-serif text-xl leading-tight font-bold text-ink sm:text-2xl">
					Katalog Naskah Digital
				</h2>
				<p class="mt-0.5 text-xs text-ink-muted">
					Kelola berkas lokal, metadata DDC, ISBN, dan daftar isi naskah kampus
				</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex shrink-0 items-center gap-2.5">
			<button
				type="button"
				onclick={openCreateModal}
				class="focus-library flex items-center gap-1.5 rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 sm:text-sm"
			>
				<Plus size={16} />
				<span>Unggah Naskah Baru</span>
			</button>
		</div>
	</div>

	<!-- Search & Filter Controls -->
	<div
		class="flex flex-col items-stretch justify-between gap-3 rounded-lg border border-ink/10 bg-sand/30 p-3.5 md:flex-row md:items-center"
	>
		<div class="flex max-w-2xl flex-1 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
			<!-- Search input -->
			<div class="relative flex-1">
				<Search
					size={15}
					class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
				/>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari judul, penulis, ISBN, atau DDC..."
					class="w-full rounded-sm border border-ink/15 bg-white py-1.5 pr-3 pl-9 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none sm:text-sm"
				/>
			</div>

			<!-- Category select -->
			<select
				bind:value={selectedCategory}
				class="rounded-sm border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
			>
				{#each categories as cat (cat)}
					<option value={cat}>{cat}</option>
				{/each}
			</select>

			<!-- Format select -->
			<select
				bind:value={selectedFormat}
				class="rounded-sm border border-ink/15 bg-white px-2.5 py-1.5 text-xs text-ink focus:border-brick focus:ring-1 focus:ring-brick focus:outline-none"
			>
				<option value="Semua">Semua Format</option>
				<option value="pdf">Naskah PDF</option>
				<option value="epub">Ebook EPUB</option>
			</select>
		</div>

		<!-- Status counts -->
		<div class="shrink-0 text-right font-mono text-xs text-ink-muted">
			<span
				>Menampilkan <strong>{filteredBooks.length}</strong> dari <strong>{books.length}</strong> naskah</span
			>
		</div>
	</div>

	<!-- Books Table -->
	<div
		class="catalog-card overflow-hidden rounded-lg border border-ink/15 bg-sand/30 shadow-[0_2px_4px_rgba(42,26,22,0.04)]"
	>
		{#if filteredBooks.length === 0}
			<div class="p-12 text-center text-ink-muted">
				<BookOpen size={36} class="mx-auto mb-3 text-ink-muted/40" />
				<p class="font-serif text-base font-bold text-ink">Tidak ada naskah yang cocok</p>
				<p class="mt-1 text-xs">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left text-xs sm:text-sm">
					<thead>
						<tr
							class="border-b border-ink/15 bg-sand/40 font-mono text-[11px] tracking-wider text-ink-muted uppercase"
						>
							<th class="px-3 py-3 font-semibold">Naskah & Penulis</th>
							<th class="px-3 py-3 font-semibold">Klasifikasi DDC</th>
							<th class="px-3 py-3 text-center font-semibold">Format</th>
							<th class="px-3 py-3 text-center font-semibold">Tahun</th>
							<th class="px-3 py-3 text-right font-semibold">Pembaca</th>
							<th class="w-36 px-3 py-3 text-center font-semibold">Aksi Pustakawan</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-ink/10">
						{#each filteredBooks as book (book.slug)}
							<tr class="group transition-colors hover:bg-sand/40">
								<!-- Cover + Title -->
								<td class="px-3 py-3">
									<div class="flex items-center gap-3">
										<div class="h-13 w-9 shrink-0 overflow-hidden rounded-xs shadow-xs">
											<BookCover
												title={book.title}
												slug={book.slug}
												author={book.author}
												src={book.coverUrl}
												classification={book.classification}
												size="sm"
											/>
										</div>
										<div class="min-w-0">
											<div class="flex items-center gap-1.5">
												<span class="truncate font-serif text-sm font-bold text-ink">
													{book.title}
												</span>
												{#if book.isFeatured}
													<span
														class="shrink-0 rounded bg-brick/10 p-0.5 text-brick"
														title="Pilihan Pustakawan"
													>
														<Sparkles size={11} />
													</span>
												{/if}
											</div>
											<p class="mt-0.5 truncate font-sans text-xs text-ink-muted">
												{book.author} • {book.publisher || 'UMKO Press'}
											</p>
											{#if book.isbn}
												<p class="mt-0.5 font-mono text-[10px] text-ink-muted/80">
													ISBN: {book.isbn}
												</p>
											{/if}
										</div>
									</div>
								</td>

								<!-- DDC Classification -->
								<td class="px-3 py-3">
									<div class="flex items-center gap-1.5">
										<span
											class="rounded-xs bg-brick/10 px-1.5 py-0.5 font-mono text-xs font-bold text-brick"
										>
											{book.classification || book.ddcCode}
										</span>
										<span class="max-w-35 truncate text-xs text-ink">
											{book.ddcName || book.category}
										</span>
									</div>
								</td>

								<!-- Format -->
								<td class="px-3 py-3 text-center">
									{#if book.fileType === 'epub'}
										<span
											class="inline-flex items-center gap-1 rounded-xs bg-terracotta/15 px-2 py-0.5 font-mono text-[10px] font-bold text-terracotta uppercase"
										>
											<BookIcon size={11} /> EPUB
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1 rounded-xs bg-brick/15 px-2 py-0.5 font-mono text-[10px] font-bold text-brick uppercase"
										>
											<FileText size={11} /> PDF
										</span>
									{/if}
								</td>

								<!-- Year -->
								<td class="px-3 py-3 text-center font-mono text-xs text-ink-muted">
									{book.year || '—'}
								</td>

								<!-- Readers -->
								<td class="px-3 py-3 text-right font-mono font-bold text-ink">
									{book.readersCount?.toLocaleString('id-ID')}
								</td>

								<!-- Actions -->
								<td class="px-3 py-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<!-- Read in Reader -->
										<a
											href="/baca/{book.slug}"
											target="_blank"
											class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted transition-colors hover:border-brick hover:bg-sand/60 hover:text-brick"
											title="Buka Reader"
										>
											<Eye size={14} />
										</a>

										<!-- Edit -->
										<button
											type="button"
											onclick={() => openEditModal(book)}
											class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted transition-colors hover:border-ink/40 hover:bg-sand/60 hover:text-ink"
											title="Sunting Metadata Naskah"
										>
											<Edit3 size={14} />
										</button>

										<!-- Delete -->
										<button
											type="button"
											onclick={() => openDeleteModal(book)}
											class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted transition-colors hover:border-brick hover:bg-brick/10 hover:text-brick"
											title="Hapus Naskah"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Modals -->
	<BookFormModal
		isOpen={isFormModalOpen}
		{bookToEdit}
		ddcTree={data.ddcTree}
		categories={data.categories}
		onClose={() => (isFormModalOpen = false)}
		onSaved={handleBookSaved}
	/>

	<DeleteBookModal
		isOpen={isDeleteModalOpen}
		book={bookToDelete}
		onClose={() => (isDeleteModalOpen = false)}
		onDeleted={handleBookDeleted}
	/>
</div>
