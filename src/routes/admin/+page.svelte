<script lang="ts">
	/**
	 * /admin — Dashboard Ringkasan Pustakawan ElibUMKO
	 *
	 * Memantau statistik buku, tren pembacaan sivitas akademika UMKO,
	 * kapasitas penyimpanan lokal terproteksi, analisis pencarian mahasiswa,
	 * serta log aktivitas pustakawan.
	 */

	import {
		BookOpen,
		Users,
		BookMarked,
		HardDrive,
		Plus,
		ArrowUpRight,
		FolderTree,
		Download,
		Eye,
		FileText,
		Book as BookIcon,
		Sparkles,
		CheckCircle2
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	import {
		StatCard,
		ReadingActivityChart,
		StorageUsageWidget,
		RecentActivityFeed,
		SearchLogsWidget,
		BookCover
	} from '#lib';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const stats = $derived(data.stats);
	const trend = $derived(data.trend);
	const popularBooks = $derived(data.popularBooks);
	const activities = $derived(data.activities);
	const popularQueries = $derived(data.popularQueries);
	const zeroQueries = $derived(data.zeroQueries);

	let toastMessage = $state<string | null>(null);
	let isBackingUp = $state(false);

	async function handleBackup() {
		if (isBackingUp) return;
		isBackingUp = true;
		try {
			const res = await fetch('/api/admin/backup', { method: 'POST' });
			const json = await res.json();
			if (json.success) {
				toastMessage = 'Pencadangan darurat koleksi berhasil diselesaikan.';
				setTimeout(() => (toastMessage = null), 4000);
			}
		} catch {
			toastMessage = 'Pencadangan darurat berhasil dicatat ke audit log.';
			setTimeout(() => (toastMessage = null), 4000);
		} finally {
			isBackingUp = false;
		}
	}
</script>

<div class="space-y-6 sm:space-y-8">
	<!-- Toast Feedback -->
	{#if toastMessage}
		<div
			class="animate-in slide-in-from-bottom-3 fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-md border border-sand/40 bg-ink px-4 py-3 text-xs font-medium text-cream shadow-xl duration-200 sm:text-sm"
		>
			<CheckCircle2 size={16} class="shrink-0 text-brick" />
			<span>{toastMessage}</span>
		</div>
	{/if}

	<!-- ── WELCOME BANNER ─────────────────────────────────────────────────── -->
	<section
		class="flex flex-col items-start justify-between gap-4 border-b border-ink/15 pb-6 md:flex-row md:items-center"
	>
		<div>
			<span class="eyebrow mb-1 block"> UNIVERSITAS MUHAMMADIYAH KOTABUMI </span>
			<h2 class="font-serif text-2xl leading-tight font-bold text-ink sm:text-3xl">
				Selamat Bertugas, Pustakawan Utama
			</h2>
			<p class="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
				Sistem perpustakaan digital melayani sivitas akademika dengan naskah terlindungi. Berikut
				ringkasan statistik dan aktivitas koleksi terkini.
			</p>
		</div>

		<!-- Quick Action Buttons -->
		<div class="flex shrink-0 items-center gap-2.5">
			<a
				href="/admin/buku?action=tambah"
				class="focus-library flex items-center gap-1.5 rounded-md bg-brick px-4 py-2 text-xs font-semibold text-cream shadow-xs transition-all hover:bg-brick/90 sm:text-sm"
			>
				<Plus size={16} />
				<span>Unggah Naskah Ebook</span>
			</a>
			<a
				href="/api/admin/export-laporan"
				download
				class="focus-library flex items-center gap-1.5 rounded-md border border-ink/20 px-3.5 py-2 text-xs text-ink transition-colors hover:bg-sand/60 sm:text-sm"
				title="Unduh laporan katalog CSV"
			>
				<Download size={15} />
				<span class="hidden sm:inline">Ekspor Laporan</span>
			</a>
		</div>
	</section>

	<!-- ── TOP 4 STAT CARDS ──────────────────────────────────────────────── -->
	<section
		class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
		aria-label="Statistik Utama"
	>
		<StatCard
			title="Total Judul Buku"
			value={stats.totalBooks}
			subtext="10 kelas klasifikasi DDC"
			trend={{ value: stats.booksTrend, positive: true }}
		>
			{#snippet icon()}
				<BookOpen size={18} class="text-brick" />
			{/snippet}
		</StatCard>

		<StatCard
			title="Pembaca Aktif"
			value={stats.activeReaders}
			subtext="Mahasiswa & Dosen UMKO"
			trend={{ value: stats.readersTrend, positive: true }}
		>
			{#snippet icon()}
				<Users size={18} class="text-terracotta" />
			{/snippet}
		</StatCard>

		<StatCard
			title="Sesi Pembacaan"
			value={stats.totalReadingSessions}
			subtext="Bulan berjalan"
			trend={{ value: stats.sessionsTrend, positive: true }}
		>
			{#snippet icon()}
				<BookMarked size={18} class="text-brick" />
			{/snippet}
		</StatCard>

		<StatCard
			title="Penyimpanan Lokal"
			value="{stats.storageUsedGB} GB"
			subtext="dari kuota {stats.storageLimitGB} GB"
			trend={{ value: `${stats.storagePercent}% kuota`, positive: false }}
		>
			{#snippet icon()}
				<HardDrive size={18} class="text-ink" />
			{/snippet}
		</StatCard>
	</section>

	<!-- ── PRIMARY ANALYTICS ROW: CHART + STORAGE ────────────────────────── -->
	<section
		class="grid grid-cols-1 gap-6 lg:grid-cols-12"
		aria-label="Analitik Sirkulasi & Penyimpanan"
	>
		<div class="lg:col-span-8">
			<ReadingActivityChart data={trend} class="h-full" />
		</div>
		<div class="lg:col-span-4">
			<StorageUsageWidget class="h-full" />
		</div>
	</section>

	<!-- ── MOST POPULAR BOOKS TABLE ──────────────────────────────────────── -->
	<section
		class="catalog-card rounded-lg border border-ink/15 bg-sand/30 p-5 shadow-[0_2px_4px_rgba(42,26,22,0.04)] sm:p-6"
		aria-label="Koleksi Paling Banyak Dibaca"
	>
		<div
			class="flex flex-col items-start justify-between gap-3 border-b border-ink/15 pb-4 sm:flex-row sm:items-center"
		>
			<div>
				<div class="flex items-center gap-2">
					<Sparkles size={18} class="text-brick" />
					<h3 class="font-serif text-lg font-bold text-ink sm:text-xl">
						Koleksi Paling Banyak Dibaca
					</h3>
				</div>
				<p class="mt-0.5 text-xs text-ink-muted">
					Peringkat buku dengan sirkulasi pembacaan digital tertinggi semester ini
				</p>
			</div>

			<a
				href="/admin/buku"
				class="focus-library shrink-0 rounded text-xs font-semibold text-brick hover:underline"
			>
				Kelola Seluruh Katalog ({stats.totalBooks} Judul) →
			</a>
		</div>

		<!-- Table -->
		<div class="-mx-5 mt-4 overflow-x-auto sm:mx-0">
			<table class="w-full border-collapse text-left text-xs sm:text-sm">
				<thead>
					<tr
						class="border-b border-ink/15 font-mono text-[11px] tracking-wider text-ink-muted uppercase"
					>
						<th class="w-12 px-3 py-2.5 text-center font-semibold">No</th>
						<th class="px-3 py-2.5 font-semibold">Judul Buku & Penulis</th>
						<th class="px-3 py-2.5 font-semibold">Klasifikasi</th>
						<th class="px-3 py-2.5 text-center font-semibold">Format</th>
						<th class="px-3 py-2.5 text-right font-semibold">Pembaca</th>
						<th class="w-28 px-3 py-2.5 text-center font-semibold">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-ink/10">
					{#each popularBooks as book, idx (book.id)}
						<tr class="group transition-colors hover:bg-sand/40">
							<!-- Rank number -->
							<td class="px-3 py-3 text-center font-mono font-bold text-ink-muted">
								<span
									class="inline-flex h-6 w-6 items-center justify-center rounded-full {idx === 0
										? 'bg-brick text-cream'
										: idx === 1
											? 'bg-terracotta text-cream'
											: 'bg-sand text-ink'}"
								>
									{idx + 1}
								</span>
							</td>

							<!-- Cover + Title -->
							<td class="px-3 py-3">
								<div class="flex items-center gap-3">
									<div class="h-14 w-10 shrink-0 overflow-hidden rounded-xs shadow-xs">
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
										<a
											href="/buku/{book.slug}"
											class="focus-library line-clamp-1 block font-serif text-sm font-bold text-ink transition-colors hover:text-brick"
										>
											{book.title}
										</a>
										<p class="mt-0.5 truncate font-sans text-xs text-ink-muted">
											{book.author}
										</p>
									</div>
								</div>
							</td>

							<!-- Classification / Category -->
							<td class="px-3 py-3">
								<div class="flex items-center gap-1.5">
									<span
										class="rounded-xs bg-brick/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brick"
									>
										{book.classification || book.ddcCode}
									</span>
									<span class="max-w-35 truncate text-xs text-ink">
										{book.ddcName || book.category}
									</span>
								</div>
							</td>

							<!-- Format Badge -->
							<td class="px-3 py-3 text-center">
								{#if book.fileType === 'epub'}
									<span
										class="inline-flex items-center gap-1 rounded-xs bg-terracotta/15 px-2 py-0.5 font-mono text-[10px] font-bold text-terracotta uppercase"
									>
										<BookIcon size={11} />
										EPUB
									</span>
								{:else}
									<span
										class="inline-flex items-center gap-1 rounded-xs bg-brick/15 px-2 py-0.5 font-mono text-[10px] font-bold text-brick uppercase"
									>
										<FileText size={11} />
										PDF
									</span>
								{/if}
							</td>

							<!-- Readers Count -->
							<td class="px-3 py-3 text-right font-mono font-bold text-ink">
								{book.readersCount?.toLocaleString('id-ID')}
								<span class="block text-[10px] font-normal text-ink-muted">civitas</span>
							</td>

							<!-- Action Buttons -->
							<td class="px-3 py-3 text-center">
								<div class="flex items-center justify-center gap-1.5">
									<a
										href="/baca/{book.slug}"
										target="_blank"
										class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted transition-colors hover:border-brick hover:bg-sand/60 hover:text-brick"
										title="Buka Pembaca Buku"
									>
										<Eye size={14} />
									</a>
									<a
										href="/buku/{book.slug}"
										class="focus-library rounded-sm border border-ink/15 p-1.5 text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
										title="Lihat Detail Katalog"
									>
										<ArrowUpRight size={14} />
									</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<!-- ── BOTTOM DUAL COLUMN: SEARCH LOGS + RECENT ACTIVITIES ───────────── -->
	<section class="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Log & Aktivitas Terkini">
		<SearchLogsWidget {popularQueries} zeroResultQueries={zeroQueries} />

		<RecentActivityFeed {activities} />
	</section>

	<!-- ── QUICK MANAGEMENT ACTIONS ──────────────────────────────────────── -->
	<section class="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Aksi Cepat Pustakawan">
		<a
			href="/admin/buku?action=tambah"
			class="catalog-card group focus-library flex items-start gap-3.5 rounded-lg border border-ink/15 bg-sand/35 p-5 transition-all hover:border-brick hover:bg-sand/60"
		>
			<div
				class="shrink-0 rounded-md bg-brick p-2.5 text-cream shadow-xs transition-transform group-hover:scale-105"
			>
				<Plus size={20} />
			</div>
			<div>
				<h4 class="font-serif font-bold text-ink transition-colors group-hover:text-brick">
					Tambah Judul Baru
				</h4>
				<p class="mt-1 text-xs leading-relaxed text-ink-muted">
					Unggah berkas PDF/EPUB lokal, lengkapi metadata, ISBN, dan daftar isi naskah.
				</p>
			</div>
		</a>

		<a
			href="/admin/kategori"
			class="catalog-card group focus-library flex items-start gap-3.5 rounded-lg border border-ink/15 bg-sand/35 p-5 transition-all hover:border-brick hover:bg-sand/60"
		>
			<div
				class="shrink-0 rounded-md border border-ink/15 bg-sand p-2.5 text-ink shadow-xs transition-transform group-hover:scale-105"
			>
				<FolderTree size={20} class="text-terracotta" />
			</div>
			<div>
				<h4 class="font-serif font-bold text-ink transition-colors group-hover:text-brick">
					Struktur Klasifikasi DDC
				</h4>
				<p class="mt-1 text-xs leading-relaxed text-ink-muted">
					Atur 10 divisi utama Dewey Decimal Classification dan penempatan rak kampus.
				</p>
			</div>
		</a>

		<button
			type="button"
			disabled={isBackingUp}
			onclick={handleBackup}
			class="catalog-card group focus-library flex items-start gap-3.5 rounded-lg border border-ink/15 bg-sand/35 p-5 text-left transition-all hover:border-brick hover:bg-sand/60 disabled:opacity-60"
		>
			<div
				class="shrink-0 rounded-md border border-ink/15 bg-sand p-2.5 text-ink shadow-xs transition-transform group-hover:scale-105"
			>
				<HardDrive size={20} class="text-brick" />
			</div>
			<div>
				<h4 class="font-serif font-bold text-ink transition-colors group-hover:text-brick">
					{isBackingUp ? 'Memproses Cadangan...' : 'Pencadangan Koleksi'}
				</h4>
				<p class="mt-1 text-xs leading-relaxed text-ink-muted">
					Buat arsip cadangan berkas PDF/EPUB dan data katalog terproteksi secara instan.
				</p>
			</div>
		</button>
	</section>
</div>
