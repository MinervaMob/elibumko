<script lang="ts">
	/**
	 * Header.svelte — Navigasi Utama Perpustakaan Digital ElibUMKO
	 *
	 * Standar Industri Modern:
	 * 1. Tinggi & kontainer konsisten (h-16 / max-w-300) tanpa layout shift (CLS = 0).
	 * 2. Active link terintegrasi reaktif via `$app/state` (page.url.pathname).
	 * 3. Scrollspy & hash handling untuk "Tentang ElibUMKO" (#profil):
	 *    - Ketika user mengklik atau berada di section #profil, "Tentang ElibUMKO" aktif dan "Beranda" inaktif.
	 *    - Buttery-smooth auto-scroll dengan URL hash update.
	 * 4. Rak Buku tetap aktif di seluruh sub-halaman katalog (/rak, /rak/[kode], /buku/[slug]).
	 * 5. Drawer seluler responsif dengan penanda status halaman aktif.
	 */

	import { Search, Menu, X, BookOpen } from 'lucide-svelte';
	import { page } from '$app/state';

	// ─── Status Scroll & Menu Mobile ──────────────────────────────────────────
	let isScrolled = $state(false);
	let mobileMenuOpen = $state(false);
	let headerSearchQuery = $state('');
	let isAtProfil = $state(false);

	// ─── Determinasi Reaktif Status Rute Aktif ─────────────────────────────────
	const currentPath = $derived(page.url.pathname);

	const isHomeActive = $derived(currentPath === '/' && !isAtProfil);
	const isTentangActive = $derived(currentPath === '/' && isAtProfil);
	const isRakActive = $derived(
		currentPath === '/rak' || currentPath.startsWith('/rak/') || currentPath.startsWith('/buku/')
	);

	// ─── Deteksi Posisi Section #profil (Scrollspy) ───────────────────────────
	function checkProfilPosition() {
		if (typeof window === 'undefined') return;

		// Hanya berlaku jika di halaman beranda
		if (currentPath !== '/') {
			isAtProfil = false;
			return;
		}

		const profilEl = document.getElementById('profil');
		const currentHash = window.location.hash;

		if (!profilEl) {
			isAtProfil = currentHash === '#profil';
			return;
		}

		const rect = profilEl.getBoundingClientRect();
		// Header offset 64px (h-16) + threshold deteksi
		const headerHeight = 64;
		const inSection = rect.top <= headerHeight + 120 && rect.bottom >= headerHeight + 80;

		// Jika user klik #profil atau scroll masuk ke section
		if (currentHash === '#profil' && rect.top <= window.innerHeight * 0.7) {
			isAtProfil = true;
		} else {
			isAtProfil = inSection;
		}
	}

	function handleScroll() {
		if (typeof window === 'undefined') return;
		isScrolled = window.scrollY > 15;
		checkProfilPosition();
	}

	function handleHashChange() {
		checkProfilPosition();
	}

	// Sinkronisasi saat rute berganti atau komponen mount
	$effect(() => {
		// Akses reaktif path agar effect terpanggil saat rute berganti
		void page.url.pathname;
		mobileMenuOpen = false;

		if (typeof window !== 'undefined') {
			// Berikan jeda sejenak untuk kalkulasi posisi elemen DOM
			setTimeout(checkProfilPosition, 80);
		}
	});

	function handleSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!headerSearchQuery.trim()) return;
		window.location.href = `/rak?q=${encodeURIComponent(headerSearchQuery.trim())}`;
	}

	// ─── Klik Navigasi Halus (Smooth Anchor Navigation) ────────────────────────
	function handleBerandaClick(e: MouseEvent) {
		if (currentPath === '/') {
			e.preventDefault();
			window.scrollTo({ top: 0, behavior: 'smooth' });
			history.pushState(null, '', '/');
			isAtProfil = false;
			mobileMenuOpen = false;
		}
	}

	function handleTentangClick(e: MouseEvent) {
		if (currentPath === '/') {
			const el = document.getElementById('profil');
			if (el) {
				e.preventDefault();
				el.scrollIntoView({ behavior: 'smooth' });
				history.pushState(null, '', '#profil');
				isAtProfil = true;
				mobileMenuOpen = false;
			}
		}
	}
</script>

<svelte:window onscroll={handleScroll} onhashchange={handleHashChange} />

<!--
	Header dengan tinggi tetap h-16 di seluruh resolusi & halaman.
	Perubahan scroll hanya mengubah background opacity & border/shadow halus,
	sehingga tidak ada pergeseran tinggi (zero cumulative layout shift).
-->
<header
	class="sticky top-0 z-50 w-full transition-colors duration-200 {isScrolled
		? 'border-b border-ink/15 bg-cream/95 shadow-[0_2px_12px_rgba(42,26,22,0.06)] backdrop-blur-md'
		: 'border-b border-ink/10 bg-cream'}"
>
	<div class="mx-auto max-w-300 px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between gap-4">
			<!-- ── 1. Identitas Institusi / Brand Logo ────────────────────────── -->
			<a
				href="/"
				onclick={handleBerandaClick}
				class="group focus-library flex shrink-0 items-center gap-2.5 rounded-sm"
				aria-label="ElibUMKO - Beranda Perpustakaan Digital"
			>
				<span
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brick font-serif text-lg font-black text-cream shadow-xs transition-colors group-hover:bg-brick-dark"
				>
					E
				</span>
				<div class="flex flex-col justify-center leading-none">
					<span
						class="font-serif text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-brick"
					>
						ElibUMKO
					</span>
					<span class="mt-1 font-mono text-[9px] tracking-wider text-ink-muted uppercase">
						Univ. Muhammadiyah Kotabumi
					</span>
				</div>
			</a>

			<!-- ── 2. Menu Navigasi Desktop dengan Active Link Presisi ───────── -->
			<nav class="hidden h-full items-center gap-1 md:flex lg:gap-2" aria-label="Navigasi Utama">
				<!-- Beranda Link -->
				<a
					href="/"
					onclick={handleBerandaClick}
					class="group focus-library relative inline-flex h-16 items-center px-3.5 text-sm transition-colors {isHomeActive
						? 'font-semibold text-brick'
						: 'font-medium text-ink/75 hover:text-brick'}"
					aria-current={isHomeActive ? 'page' : undefined}
				>
					<span>Beranda</span>
					{#if isHomeActive}
						<span class="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-brick"></span>
					{:else}
						<span
							class="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-brick/40 opacity-0 transition-opacity group-hover:opacity-100"
						></span>
					{/if}
				</a>

				<!-- Rak Buku & Koleksi Link (Tetap aktif saat buka rak kategori atau detail buku) -->
				<a
					href="/rak"
					class="group focus-library relative inline-flex h-16 items-center px-3.5 text-sm transition-colors {isRakActive
						? 'font-semibold text-brick'
						: 'font-medium text-ink/75 hover:text-brick'}"
					aria-current={isRakActive ? 'page' : undefined}
				>
					<span>Rak Buku</span>
					{#if isRakActive}
						<span class="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-brick"></span>
					{:else}
						<span
							class="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-brick/40 opacity-0 transition-opacity group-hover:opacity-100"
						></span>
					{/if}
				</a>

				<!-- Tentang ElibUMKO Link (Aktif saat user klik atau scroll ke section #profil) -->
				<a
					href="/#profil"
					onclick={handleTentangClick}
					class="group focus-library relative inline-flex h-16 items-center px-3.5 text-sm transition-colors {isTentangActive
						? 'font-semibold text-brick'
						: 'font-medium text-ink/75 hover:text-brick'}"
					aria-current={isTentangActive ? 'page' : undefined}
				>
					<span>Tentang ElibUMKO</span>
					{#if isTentangActive}
						<span class="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-brick"></span>
					{:else}
						<span
							class="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-brick/40 opacity-0 transition-opacity group-hover:opacity-100"
						></span>
					{/if}
				</a>
			</nav>

			<!-- ── 3. Aksi Kanan: Pencarian Ringkas & Portal Pustakawan ──────── -->
			<div class="hidden shrink-0 items-center gap-3 sm:flex">
				<!-- Pencarian Cepat Header -->
				<form onsubmit={handleSearchSubmit} class="relative w-44 lg:w-56">
					<Search
						size={14}
						class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-muted"
					/>
					<input
						type="text"
						bind:value={headerSearchQuery}
						placeholder="Cari judul / penulis..."
						class="w-full rounded-md border border-ink/15 bg-sand/35 py-1.5 pr-3 pl-8 text-xs text-ink transition-all placeholder:text-ink-muted/60 hover:bg-sand/60 focus:border-brick focus:bg-white focus:ring-1 focus:ring-brick focus:outline-none"
					/>
				</form>
			</div>

			<!-- ── 4. Tombol Hamburger Seluler ──────────────────────────────── -->
			<button
				type="button"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="focus-library rounded-sm p-2 text-ink transition-colors hover:bg-sand/60 hover:text-brick md:hidden"
				aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
				aria-expanded={mobileMenuOpen}
				aria-controls="mobile-nav-drawer"
			>
				{#if mobileMenuOpen}
					<X size={22} />
				{:else}
					<Menu size={22} />
				{/if}
			</button>
		</div>
	</div>

	<!-- ── 5. Drawer Navigasi Seluler Responsif ───────────────────────────── -->
	{#if mobileMenuOpen}
		<div
			id="mobile-nav-drawer"
			class="animate-in slide-in-from-top-2 space-y-3 border-t border-ink/15 bg-cream/98 px-4 pt-3 pb-6 shadow-lg backdrop-blur-sm duration-150 md:hidden"
		>
			<!-- Pencarian Mobile -->
			<form onsubmit={handleSearchSubmit} class="relative w-full">
				<Search
					size={15}
					class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
				/>
				<input
					type="text"
					bind:value={headerSearchQuery}
					placeholder="Cari judul, pengarang, ISBN..."
					class="w-full rounded-md border border-ink/20 bg-white py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brick focus:outline-none"
				/>
			</form>

			<!-- Link Navigasi Mobile dengan Visual State Aktif -->
			<nav class="flex flex-col space-y-1 pt-1" aria-label="Navigasi Seluler">
				<!-- Beranda -->
				<a
					href="/"
					onclick={(e) => {
						handleBerandaClick(e);
						mobileMenuOpen = false;
					}}
					class="focus-library flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors {isHomeActive
						? 'border-l-4 border-brick bg-brick/10 pl-3 font-semibold text-brick'
						: 'pl-4 font-medium text-ink hover:bg-sand/40'}"
					aria-current={isHomeActive ? 'page' : undefined}
				>
					<span>Beranda</span>
					{#if isHomeActive}
						<span
							class="rounded-full bg-brick px-2 py-0.5 font-mono text-[10px] font-bold text-cream uppercase"
						>
							Aktif
						</span>
					{/if}
				</a>

				<!-- Rak Buku -->
				<a
					href="/rak"
					onclick={() => (mobileMenuOpen = false)}
					class="focus-library flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors {isRakActive
						? 'border-l-4 border-brick bg-brick/10 pl-3 font-semibold text-brick'
						: 'pl-4 font-medium text-ink hover:bg-sand/40'}"
					aria-current={isRakActive ? 'page' : undefined}
				>
					<span>Rak Buku & Koleksi</span>
					{#if isRakActive}
						<span
							class="rounded-full bg-brick px-2 py-0.5 font-mono text-[10px] font-bold text-cream uppercase"
						>
							Aktif
						</span>
					{/if}
				</a>

				<!-- Tentang ElibUMKO -->
				<a
					href="/#profil"
					onclick={(e) => {
						handleTentangClick(e);
						mobileMenuOpen = false;
					}}
					class="focus-library flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors {isTentangActive
						? 'border-l-4 border-brick bg-brick/10 pl-3 font-semibold text-brick'
						: 'pl-4 font-medium text-ink hover:bg-sand/40'}"
					aria-current={isTentangActive ? 'page' : undefined}
				>
					<span>Tentang ElibUMKO</span>
					{#if isTentangActive}
						<span
							class="rounded-full bg-brick px-2 py-0.5 font-mono text-[10px] font-bold text-cream uppercase"
						>
							Aktif
						</span>
					{/if}
				</a>
			</nav>

			<!-- CTA Pustakawan Seluler -->
			<div class="border-t border-ink/10 pt-3">
				<a
					href="/admin"
					onclick={() => (mobileMenuOpen = false)}
					class="focus-library flex w-full items-center justify-center gap-2 rounded-md bg-brick px-4 py-2.5 text-sm font-semibold text-cream shadow-xs transition-colors hover:bg-brick-dark"
				>
					<BookOpen size={16} />
					<span>Masuk Portal Pustakawan</span>
				</a>
			</div>
		</div>
	{/if}
</header>
