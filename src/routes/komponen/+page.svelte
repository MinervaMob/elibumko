<script lang="ts">
	import type { PageData } from './$types';
	import {
		Button,
		Input,
		CategoryChip,
		BookCard,
		RankingRow,
		BookShelf,
		ReaderToolbar,
		StatCard
	} from '#lib';
	import {
		BookOpen,
		Search,
		Bookmark,
		SlidersHorizontal,
		Users,
		FileText,
		Database
	} from 'lucide-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Interactive states for testing components
	let searchVal = $state('');
	let emailVal = $state('');
	let activeChip = $state('000');
	let currentToolbarPage = $state(12);
	let currentToolbarZoom = $state(100);
	let isTocOpen = $state(false);
	let isSearchOpen = $state(false);
	let isSettingsOpen = $state(false);
	let isFullscreen = $state(false);
</script>

<svelte:head>
	<title>Sistem Desain & Referensi Komponen — ElibUMKO</title>
</svelte:head>

<div class="min-h-screen bg-cream pb-24 text-ink">
	<!-- Top Navigation Header -->
	<header
		class="sticky top-0 z-40 flex items-center justify-between border-b border-ink/15 bg-cream/95 px-4 py-3.5 backdrop-blur-xs sm:px-8"
	>
		<div class="flex items-center gap-3">
			<a href="/" class="focus-library flex items-center gap-2.5 rounded-sm">
				<span
					class="flex h-8 w-8 items-center justify-center rounded-sm bg-brick font-serif text-lg font-bold text-cream shadow-sm"
				>
					E
				</span>
				<div>
					<span class="block font-serif text-lg leading-tight font-bold tracking-tight text-ink">
						ElibUMKO
					</span>
					<span class="block font-mono text-[10px] tracking-wider text-ink-muted uppercase">
						Design System v1.0
					</span>
				</div>
			</a>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/"
				class="focus-library rounded-sm px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-sand/60 hover:text-ink"
			>
				&larr; Ke Halaman Utama
			</a>
			<a
				href="/rak"
				class="focus-library rounded-sm border border-brick/30 px-3 py-1.5 text-xs font-semibold text-brick transition-colors hover:bg-sand/30 hover:text-brick-dark"
			>
				Lihat Rak Buku
			</a>
		</div>
	</header>

	<main class="mx-auto max-w-300 px-4 pt-10 sm:px-6 lg:px-8">
		<!-- Introduction & Design Intent -->
		<div class="mb-12 border-b border-ink/15 pb-8">
			<div
				class="mb-3 inline-flex items-center gap-2 rounded-xs border border-ink/15 bg-sand/60 px-2.5 py-1 font-mono text-xs tracking-widest text-ink uppercase"
			>
				<span>Perpustakaan Akademik Tenang & Hangat</span>
			</div>
			<h1
				class="mb-4 font-serif text-3xl leading-tight font-bold tracking-tight text-ink sm:text-5xl"
			>
				Sistem Desain & Katalog Komponen
			</h1>
			<p class="max-w-3xl text-base leading-relaxed text-ink-muted sm:text-lg">
				Panduan desain visual ElibUMKO yang berakar pada estetika perpustakaan fisik: warna kertas (<span
					class="rounded bg-sand/50 px-1 py-0.5 font-mono text-xs">#F2ECBE</span
				>
				Cream), tekstur kayu & pasir (<span class="rounded bg-sand/50 px-1 py-0.5 font-mono text-xs"
					>#E2C799</span
				>
				Sand), penanda merah bata (<span class="rounded bg-sand/50 px-1 py-0.5 font-mono text-xs"
					>#9A3B3B</span
				>
				Brick), dan aksen terakota (<span class="rounded bg-sand/50 px-1 py-0.5 font-mono text-xs"
					>#C08261</span
				>). Tanpa elemen SaaS generik, tanpa gradient neon.
			</p>
		</div>

		<!-- Section 1: Color Palette & Contrast Tokens -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>01. DESIGN TOKENS</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">
						Palet Warna Perpustakaan & Rasio Kontras
					</h2>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
				<!-- Cream Card -->
				<div
					class="flex h-44 flex-col justify-between rounded-md border border-ink/20 bg-cream p-4 shadow-xs"
				>
					<div>
						<span class="font-serif text-lg font-bold text-ink">Cream</span>
						<p class="mt-0.5 font-mono text-xs text-ink-muted">#F2ECBE</p>
					</div>
					<div class="text-xs text-ink-muted">
						<span class="font-semibold text-ink">Porsi: ±60%</span>
						<p class="mt-0.5">
							Latar utama seluruh halaman pengganti putih layar silau, menyerupai lembaran buku
							antik.
						</p>
					</div>
				</div>

				<!-- Sand Card -->
				<div
					class="flex h-44 flex-col justify-between rounded-md border border-ink/20 bg-sand p-4 shadow-xs"
				>
					<div>
						<span class="font-serif text-lg font-bold text-ink">Sand</span>
						<p class="font-mono text-xs text-ink">#E2C799</p>
					</div>
					<div class="text-xs text-ink">
						<span class="font-semibold">Porsi: ±20%</span>
						<p class="mt-0.5">
							Permukaan kartu, rak buku, border hangat, dan hover section sekunder.
						</p>
					</div>
				</div>

				<!-- Brick Card -->
				<div
					class="flex h-44 flex-col justify-between rounded-md border border-brick-dark bg-brick p-4 text-cream shadow-xs"
				>
					<div>
						<span class="font-serif text-lg font-bold">Brick</span>
						<p class="font-mono text-xs opacity-90">#9A3B3B</p>
					</div>
					<div class="text-xs">
						<span class="font-semibold">Porsi: ±10%</span>
						<p class="mt-0.5 opacity-90">
							CTA utama, link aktif, header/footer, penanda buku pita.
						</p>
						<span
							class="mt-1.5 inline-block rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px]"
						>
							Kontras: 6.8:1 (AAA)
						</span>
					</div>
				</div>

				<!-- Terracotta Card -->
				<div
					class="flex h-44 flex-col justify-between rounded-md border border-terracotta-dark bg-terracotta p-4 text-cream shadow-xs"
				>
					<div>
						<span class="font-serif text-lg font-bold">Terracotta</span>
						<p class="font-mono text-xs opacity-90">#C08261</p>
					</div>
					<div class="text-xs">
						<span class="font-semibold">Porsi: ±5%</span>
						<p class="mt-0.5 opacity-90">
							Aksen sekunder, garis dekoratif, chip kategori, hanya teks besar.
						</p>
					</div>
				</div>
			</div>

			<!-- Typography Scales -->
			<div class="mt-8 rounded-lg border border-ink/15 bg-sand/30 p-6">
				<h3 class="mb-4 font-mono text-xs font-semibold tracking-wider text-ink-muted uppercase">
					Skala Tipografi Penerbit
				</h3>
				<div class="space-y-4">
					<div
						class="flex flex-col gap-2 border-b border-ink/10 pb-3 md:flex-row md:items-baseline md:gap-8"
					>
						<span class="w-32 shrink-0 font-mono text-xs text-ink-muted">H1 · Fraunces</span>
						<span class="font-serif text-4xl font-bold text-ink sm:text-5xl"
							>Koleksi Terbuka Kampus</span
						>
					</div>
					<div
						class="flex flex-col gap-2 border-b border-ink/10 pb-3 md:flex-row md:items-baseline md:gap-8"
					>
						<span class="w-32 shrink-0 font-mono text-xs text-ink-muted">H2 · Fraunces</span>
						<span class="font-serif text-2xl font-bold text-ink sm:text-3xl"
							>Buku Rekomendasi Pustakawan</span
						>
					</div>
					<div
						class="flex flex-col gap-2 border-b border-ink/10 pb-3 md:flex-row md:items-baseline md:gap-8"
					>
						<span class="w-32 shrink-0 font-mono text-xs text-ink-muted">Body · Source Sans 3</span>
						<span class="max-w-2xl font-sans text-[17px] leading-[1.65] text-ink">
							Membaca ratusan buku referensi kuliah langsung di peramban tanpa jeda unduhan, dengan
							tata letak yang dirancang untuk kenyamanan visual jangka panjang.
						</span>
					</div>
					<div class="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-8">
						<span class="w-32 shrink-0 font-mono text-xs text-ink-muted">Metadata · Plex Mono</span>
						<span class="font-mono text-xs text-ink-muted">
							ISBN 978-602-05-2418-4 · KLASIFIKASI DDC 370.7 · 342 HALAMAN
						</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Section 2: Tombol (Buttons) -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>02. KOMPONEN UI</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">Tombol (Buttons)</h2>
				</div>
			</div>

			<div class="space-y-6 rounded-lg border border-ink/15 bg-sand/25 p-6">
				<!-- Variants -->
				<div>
					<h4 class="mb-3 font-mono text-xs tracking-wider text-ink-muted uppercase">
						Varian Tombol
					</h4>
					<div class="flex flex-wrap items-center gap-3">
						<Button variant="primary">
							{#snippet iconLeft()}
								<BookOpen size={16} />
							{/snippet}
							Baca Sekarang (Primary)
						</Button>

						<Button variant="secondary">
							{#snippet iconLeft()}
								<Bookmark size={16} />
							{/snippet}
							Simpan ke Rak (Secondary)
						</Button>

						<Button variant="outline">
							{#snippet iconLeft()}
								<SlidersHorizontal size={15} />
							{/snippet}
							Filter Koleksi (Outline)
						</Button>

						<Button variant="ghost">Pelajari Lebih Lanjut &rarr;</Button>

						<Button variant="primary" disabled={true}>Nonaktif (Disabled)</Button>
					</div>
				</div>

				<!-- Sizes -->
				<div class="border-t border-ink/10 pt-4">
					<h4 class="mb-3 font-mono text-xs tracking-wider text-ink-muted uppercase">
						Ukuran Tombol
					</h4>
					<div class="flex flex-wrap items-center gap-3">
						<Button size="sm" variant="primary">Kecil (sm)</Button>
						<Button size="md" variant="primary">Sedang (md)</Button>
						<Button size="lg" variant="primary">Besar (lg)</Button>
					</div>
				</div>
			</div>
		</section>

		<!-- Section 3: Input Field & Search -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>03. FORM & SEARCH</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">Input & Pencarian Katalog</h2>
				</div>
			</div>

			<div
				class="grid grid-cols-1 gap-6 rounded-lg border border-ink/15 bg-sand/25 p-6 md:grid-cols-2"
			>
				<div>
					<Input
						label="Pencarian Cepat Koleksi"
						placeholder="Cari berdasarkan judul, penulis, ISBN, atau subjek..."
						bind:value={searchVal}
						shortcutHint="Ctrl K"
					>
						{#snippet iconLeft()}
							<Search size={16} />
						{/snippet}
					</Input>
					<p class="mt-2 text-xs text-ink-muted">
						Input teks bernuansa kertas putih bersih, border hangat, dan fokus cincin Brick 2px.
					</p>
				</div>

				<div>
					<Input
						label="Alamat Surel Mahasiswa / Dosen"
						placeholder="nama@umko.ac.id"
						bind:value={emailVal}
						hint="Gunakan akun resmi kampus"
						required={true}
					/>
				</div>

				<div class="pt-2 md:col-span-2">
					<Input
						label="State Error Validasi"
						placeholder="Contoh input error"
						value="Format nomor ISBN salah"
						error="ISBN harus terdiri dari 10 atau 13 digit angka valid."
					/>
				</div>
			</div>
		</section>

		<!-- Section 4: Chip Kategori & Klasifikasi -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>04. KLASIFIKASI & KATEGORI</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">Chip Kategori & Punggung Buku</h2>
				</div>
			</div>

			<!-- Style 1: Book-spine style categories (as explicitly requested: deretan punggung buku vertikal berwarna dari palet) -->
			<div class="mb-8">
				<h4 class="mb-3 font-mono text-xs tracking-wider text-ink-muted uppercase">
					Gaya Punggung Buku Vertikal (Bukan Grid Ikon Generik)
				</h4>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{#each data.categories.slice(0, 4) as cat (cat.code)}
						<CategoryChip
							name={cat.name}
							code={cat.code}
							count={cat.count}
							variant="spine"
							color={cat.color}
						/>
					{/each}
				</div>
			</div>

			<!-- Style 2: Catalog Card Style -->
			<div>
				<h4 class="mb-3 font-mono text-xs tracking-wider text-ink-muted uppercase">
					Gaya Kartu Katalog Perpustakaan (Index Card Chips)
				</h4>
				<div class="flex flex-wrap gap-2.5">
					{#each data.categories as cat (cat.code)}
						<CategoryChip
							name={cat.name}
							code={cat.code}
							count={cat.count}
							variant="catalog"
							active={activeChip === cat.code}
							onclick={() => (activeChip = cat.code)}
						/>
					{/each}
				</div>
			</div>
		</section>

		<!-- Section 5: Kartu Buku & Sampul Tipografis -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>05. SAMPUL & KARTU</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">
						Sampul Buku Rasio 2:3 & Sampul Tipografis Otomatis
					</h2>
				</div>
			</div>

			<p class="mb-6 max-w-2xl text-sm text-ink-muted">
				Semua buku memiliki rasio 2:3 dengan efek bayangan punggung buku di sisi kiri. Jika berkas
				sampul belum diunggah pustakawan, sistem secara otomatis merancang sampul tipografis
				penerbit elegan dari kombinasi palet tanpa stok foto acak.
			</p>

			<!-- Book Grid Preview -->
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
				{#each data.books.slice(0, 4) as book (book.slug)}
					<BookCard {book} layout="grid" showActions={true} />
				{/each}
			</div>

			<!-- Horizontal Book Card List Layout Preview -->
			<div class="mt-8">
				<h4 class="mb-3 font-mono text-xs tracking-wider text-ink-muted uppercase">
					Tampilan Daftar (List View untuk Pencarian & Hasil Filter)
				</h4>
				<div class="space-y-3">
					{#each data.books.slice(4, 6) as book (book.slug)}
						<BookCard {book} layout="list" />
					{/each}
				</div>
			</div>
		</section>

		<!-- Section 6: Baris Peringkat Editorial (Top 10) -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>06. EDITORIAL RANKING</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">
						Baris Peringkat Buku Terpopuler (1-10)
					</h2>
				</div>
			</div>

			<p class="mb-4 text-sm text-ink-muted">
				Daftar bernomor besar dengan font serif Fraunces, sampul berbayang punggung, dan metrik
				pembaca terverifikasi.
			</p>

			<div
				class="catalog-card divide-y divide-ink/10 overflow-hidden rounded-lg border border-ink/15 bg-sand/20"
			>
				{#each data.books.slice(0, 5) as book, index (book.slug)}
					<RankingRow rank={index + 1} {book} />
				{/each}
			</div>
		</section>

		<!-- Section 7: Rak Buku Fisik (Physical Wooden Shelf) -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>07. RAK BUKU KLASIFIKASI</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">Rak Buku Fisik & Garis Kayu Hangat</h2>
				</div>
			</div>

			<p class="mb-4 max-w-2xl text-sm text-ink-muted">
				Buku berdiri di atas bilah rak kayu bertekstur hangat dengan bayangan lantai yang realistis.
				Dilengkapi navigasi geser halus dan penanda kartu katalog.
			</p>

			<BookShelf
				title="Klasifikasi 370 — Pendidikan & Keguruan"
				code="DDC 370"
				description="Buku teks pedagogi, metodologi pengajaran, dan panduan penelitian dosen FKIP UMKO"
				books={data.books}
				href="/rak/370"
			/>
		</section>

		<!-- Section 8: Toolbar Reader -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>08. READER EXPERIENCE</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">Toolbar Reader Buku (/baca/[slug])</h2>
				</div>
			</div>

			<p class="mb-4 text-sm text-ink-muted">
				Toolbar terintegrasi dengan lompat halaman, zoom in/out, pencarian kata kunci, dan
				pengaturan tema baca (Cream, Sepia, Gelap).
			</p>

			<div class="overflow-hidden rounded-lg border border-ink/20 shadow-sm">
				<ReaderToolbar
					title="Metodologi Penelitian Pendidikan Matematika dan Sains"
					author="Prof. Dr. Ir. H. Sudirman, M.Pd."
					currentPage={currentToolbarPage}
					totalPages={342}
					zoom={currentToolbarZoom}
					{isTocOpen}
					{isSearchOpen}
					{isSettingsOpen}
					{isFullscreen}
					onPrevPage={() => (currentToolbarPage = Math.max(1, currentToolbarPage - 1))}
					onNextPage={() => (currentToolbarPage = Math.min(342, currentToolbarPage + 1))}
					onZoomIn={() => (currentToolbarZoom = Math.min(300, currentToolbarZoom + 10))}
					onZoomOut={() => (currentToolbarZoom = Math.max(50, currentToolbarZoom - 10))}
					onToggleToc={() => (isTocOpen = !isTocOpen)}
					onToggleSearch={() => (isSearchOpen = !isSearchOpen)}
					onToggleSettings={() => (isSettingsOpen = !isSettingsOpen)}
					onToggleFullscreen={() => (isFullscreen = !isFullscreen)}
					onBack={() => alert('Aksi kembali ke detail buku')}
				/>

				<!-- Simulated Reader Canvas preview -->
				<div
					class="flex min-h-55 flex-col items-center justify-center border-t border-ink/10 bg-sand/30 p-8 text-center sm:p-12"
				>
					<div class="catalog-card max-w-md rounded-md p-6 shadow-sm">
						<span class="font-mono text-xs font-bold tracking-wider text-brick uppercase"
							>Pratinjau Area Baca</span
						>
						<h4 class="mt-2 font-serif text-lg font-bold text-ink">Bab 1: Hakikat Metode Ilmiah</h4>
						<p class="mt-2 font-reader text-sm leading-relaxed text-ink-muted">
							Penelitian pendidikan menuntut ketajaman metodologis yang berakar pada fenomena
							empiris ruang kelas...
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Section 9: Kartu Statistik Admin -->
		<section class="mb-16">
			<div class="mb-6 flex items-center justify-between border-b border-ink/10 pb-2">
				<div>
					<span class="font-mono text-xs font-semibold tracking-wider text-brick uppercase"
						>09. CMS & ADMIN METRICS</span
					>
					<h2 class="font-serif text-2xl font-bold text-ink">Kartu Statistik Dashboard Admin</h2>
				</div>
			</div>

			<p class="mb-4 text-sm text-ink-muted">
				Statistik perpustakaan disajikan dengan angka IBM Plex Mono tebal, warna hangat, tanpa aksen
				dashboard biru standar SaaS.
			</p>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
				<StatCard
					title="Total Judul Buku"
					value={1428}
					subtext="Koleksi terbit & aktif"
					trend={{ value: '+24 bln ini', positive: true }}
				>
					{#snippet icon()}
						<BookOpen size={18} />
					{/snippet}
				</StatCard>

				<StatCard
					title="Pembaca Aktif"
					value={3894}
					subtext="Mahasiswa & Dosen"
					trend={{ value: '+14% vs lalu', positive: true }}
				>
					{#snippet icon()}
						<Users size={18} />
					{/snippet}
				</StatCard>

				<StatCard
					title="Halaman Terbaca"
					value={142980}
					subtext="Sesi baca di peramban"
					trend={{ value: 'Rata-rata 22 hlm/sesi', positive: true }}
				>
					{#snippet icon()}
						<FileText size={18} />
					{/snippet}
				</StatCard>

				<StatCard
					title="Penyimpanan Terpakai"
					value="18.4 GB"
					subtext="PDF & EPUB Terproteksi"
					trend={{ value: 'Kapasitas 100 GB' }}
				>
					{#snippet icon()}
						<Database size={18} />
					{/snippet}
				</StatCard>
			</div>
		</section>
	</main>
</div>
