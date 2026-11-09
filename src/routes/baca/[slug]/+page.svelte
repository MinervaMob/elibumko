<script lang="ts">
	/**
	 * /baca/[slug] — Halaman Reader ElibUMKO
	 *
	 * Fitur:
	 * - PDF.js untuk PDF, epub.js untuk EPUB
	 * - Mode paged & continuous scroll
	 * - Pencarian kata kunci di dalam dokumen
	 * - Tema: terang / sepia / gelap / kontras tinggi
	 * - Zoom 50%–300% (PDF), ukuran font 12–28px (EPUB)
	 * - Resume posisi baca via localStorage
	 * - Proteksi anti-unduh & anti-copy (deterrence layer)
	 * - Keyboard navigation: ←/→ halaman, Ctrl+F cari, F fullscreen, Esc tutup panel
	 */

	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { TableOfContentItem } from '#lib';

	import ReaderToolbar from '#lib/components/reader/ReaderToolbar.svelte';
	import ReaderSearchPanel from '#lib/components/reader/ReaderSearchPanel.svelte';
	import ReaderSettingsModal from '#lib/components/reader/ReaderSettingsModal.svelte';
	import ReaderTocPanel from '#lib/components/reader/ReaderTocPanel.svelte';
	import PdfReader from '#lib/components/reader/PdfReader.svelte';
	import EpubReader from '#lib/components/reader/EpubReader.svelte';

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();

	// Snapshot book to avoid reactive reference warning
	const book = $derived(data.book);

	// ── Reader session identity state ──────────────────────────────────────────
	// svelte-ignore state_referenced_locally
	let currentRole = $state<'mahasiswa' | 'dosen' | 'umum'>(data.readerRole || 'umum');
	let isRolePromptOpen = $state(true);

	// ── Reader settings state ──────────────────────────────────────────────────
	type Theme = 'light' | 'sepia' | 'dark' | 'contrast';
	type ReadMode = 'paged' | 'scroll';

	let currentPage = $state(1);
	let totalPages = $state(0);
	let zoom = $state(100);
	let theme = $state<Theme>('sepia');
	let readMode = $state<ReadMode>('paged');
	let twoPageSpread = $state(false);
	let fontFamily = $state('Literata');
	let fontSize = $state(17);
	let lineHeight = $state(1.65);

	// ── Panel open/close state ────────────────────────────────────────────────
	let isTocOpen = $state(false);
	let isSearchOpen = $state(false);
	let isSettingsOpen = $state(false);
	let isFullscreen = $state(false);
	let isToolbarVisible = $state(true);
	let toolbarHideTimer: ReturnType<typeof setTimeout> | null = null;

	// ── Search state ──────────────────────────────────────────────────────────
	interface SearchResult {
		page: number;
		snippet: string;
		matchIndex: number;
	}
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searchActiveIndex = $state(0);
	let isSearching = $state(false);

	// ── TOC state ─────────────────────────────────────────────────────────────
	let toc = $state<TableOfContentItem[]>([]);

	// ── DOM refs ──────────────────────────────────────────────────────────────
	let epubReaderEl = $state<{ nextPage?: () => void; prevPage?: () => void } | null>(null);
	let readerContainerEl: HTMLDivElement | undefined = $state();

	// ── File info ─────────────────────────────────────────────────────────────
	const fileType = $derived(book.fileType ?? 'pdf');
	const streamUrl = $derived(`/api/books/${book.slug}/stream`);

	// ── TOC from book data (fallback for PDF) ─────────────────────────────────
	$effect(() => {
		if (book.toc?.length) {
			toc = book.toc;
		}
	});

	// ── Progress persistence via localStorage ─────────────────────────────────
	const STORAGE_KEY = $derived(`elibumko_reader_${book.slug}`);

	interface ReadingProgress {
		page: number;
		zoom: number;
		theme: Theme;
		readMode: ReadMode;
		fontFamily: string;
		fontSize: number;
		lineHeight: number;
		twoPageSpread: boolean;
		savedAt: string;
	}

	function saveProgress() {
		if (typeof window === 'undefined') return;
		const progress: ReadingProgress = {
			page: currentPage,
			zoom,
			theme,
			readMode,
			fontFamily,
			fontSize,
			lineHeight,
			twoPageSpread,
			savedAt: new Date().toISOString()
		};
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
		} catch {
			/* storage might be full */
		}
	}

	function loadProgress() {
		if (typeof window === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const saved: ReadingProgress = JSON.parse(raw);
			currentPage = saved.page ?? 1;
			zoom = saved.zoom ?? 100;
			theme = saved.theme ?? 'sepia';
			readMode = saved.readMode ?? 'paged';
			fontFamily = saved.fontFamily ?? 'Literata';
			fontSize = saved.fontSize ?? 17;
			lineHeight = saved.lineHeight ?? 1.65;
			twoPageSpread = saved.twoPageSpread ?? false;
		} catch {
			/* corrupt storage, ignore */
		}
	}

	let saveInterval: ReturnType<typeof setInterval>;

	// ── Zoom helpers ──────────────────────────────────────────────────────────
	function zoomIn() {
		zoom = Math.min(300, zoom + 10);
		saveProgress();
	}
	function zoomOut() {
		zoom = Math.max(50, zoom - 10);
		saveProgress();
	}

	// ── Page navigation ───────────────────────────────────────────────────────
	function prevPage() {
		if (fileType === 'epub' && epubReaderEl) {
			epubReaderEl.prevPage?.();
		} else {
			currentPage = Math.max(1, currentPage - (twoPageSpread ? 2 : 1));
		}
		saveProgress();
	}

	function nextPage() {
		if (fileType === 'epub' && epubReaderEl) {
			epubReaderEl.nextPage?.();
		} else {
			currentPage = Math.min(totalPages || 9999, currentPage + (twoPageSpread ? 2 : 1));
		}
		saveProgress();
	}

	function navigateToPage(page: number) {
		currentPage = page;
		isTocOpen = false;
		saveProgress();
	}

	// ── Search ────────────────────────────────────────────────────────────────
	function handleSearch(q: string) {
		searchQuery = q;
		isSearching = true;
		searchActiveIndex = 0;
	}

	function handleSearchResults(results: SearchResult[]) {
		searchResults = results;
		isSearching = false;
		searchActiveIndex = 0;
	}

	function prevResult() {
		if (searchResults.length === 0) return;
		searchActiveIndex = (searchActiveIndex - 1 + searchResults.length) % searchResults.length;
		currentPage = searchResults[searchActiveIndex].page;
	}

	function nextResult() {
		if (searchResults.length === 0) return;
		searchActiveIndex = (searchActiveIndex + 1) % searchResults.length;
		currentPage = searchResults[searchActiveIndex].page;
	}

	function navigateToResult(page: number) {
		currentPage = page;
	}

	// ── Fullscreen ────────────────────────────────────────────────────────────
	function toggleFullscreen() {
		if (typeof window === 'undefined') return;
		if (!document.fullscreenElement) {
			readerContainerEl?.requestFullscreen?.().catch(() => {});
		} else {
			document.exitFullscreen?.().catch(() => {});
		}
	}

	// ── Toolbar auto-hide ─────────────────────────────────────────────────────
	function showToolbar() {
		isToolbarVisible = true;
		if (toolbarHideTimer) clearTimeout(toolbarHideTimer);
		toolbarHideTimer = setTimeout(() => {
			if (!isTocOpen && !isSearchOpen && !isSettingsOpen) {
				isToolbarVisible = false;
			}
		}, 4000);
	}

	// ── Keyboard shortcuts ────────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

		if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
			e.preventDefault();
			isSearchOpen = true;
			isSettingsOpen = false;
			return;
		}

		switch (e.key) {
			case 'ArrowLeft':
			case 'PageUp':
				e.preventDefault();
				prevPage();
				break;
			case 'ArrowRight':
			case 'PageDown':
				e.preventDefault();
				nextPage();
				break;
			case 'f':
			case 'F':
				e.preventDefault();
				toggleFullscreen();
				break;
			case 'Escape':
				if (isSearchOpen) {
					isSearchOpen = false;
					break;
				}
				if (isSettingsOpen) {
					isSettingsOpen = false;
					break;
				}
				if (isTocOpen) {
					isTocOpen = false;
					break;
				}
				break;
		}
		showToolbar();
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
	}

	// ── Theme → background color ──────────────────────────────────────────────
	const themeBg: Record<Theme, string> = {
		light: '#F2ECBE',
		sepia: '#EDE0C4',
		dark: '#1C1210',
		contrast: '#FFFFFF'
	};
	const readerBg = $derived(themeBg[theme]);

	// ── Lifecycle ─────────────────────────────────────────────────────────────
	onMount(() => {
		loadProgress();
		saveInterval = setInterval(saveProgress, 30_000);
		document.addEventListener('fullscreenchange', onFullscreenChange);
		showToolbar();
	});

	onDestroy(() => {
		saveProgress();
		clearInterval(saveInterval);
		if (toolbarHideTimer) clearTimeout(toolbarHideTimer);
		if (typeof window !== 'undefined')
			document.removeEventListener('fullscreenchange', onFullscreenChange);
	});

	function onFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
	}

	// Progress percentage
	const progressPct = $derived(totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0);

	// Derived: should hide toolbar/progress
	const panelsIdle = $derived(!isTocOpen && !isSearchOpen && !isSettingsOpen);
	const toolbarHidden = $derived(!isToolbarVisible && panelsIdle);
</script>

<svelte:head>
	<title>Membaca: {book.title} — ElibUMKO</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<svelte:document onkeydown={handleKeydown} oncontextmenu={handleContextMenu} />

<!--
	Reader Shell: fullscreen layout, no standard header/footer.
	Anti-copy is layered:
	  1. CSS user-select:none on the shell
	  2. JS oncontextmenu prevention via <svelte:document>
	  3. pointer-events:none on PDF canvases (in PdfReader.svelte)
	  4. epub.js CSS injection disabling selection inside iframes
	Note: This is deterrence, NOT true DRM.
-->
<div
	bind:this={readerContainerEl}
	class="reader-shell fixed inset-0 flex flex-col overflow-hidden"
	style:background={readerBg}
	role="main"
	aria-label="Halaman membaca buku"
	onmousemove={showToolbar}
	ontouchstart={showToolbar}
>
	<!-- ── TOOLBAR + SEARCH (collapsible) ─────────────────────────────────── -->
	<div
		class="reader-toolbar-wrap z-50 shrink-0 transition-transform duration-200 ease-in-out"
		class:pointer-events-none={toolbarHidden}
		style:transform={toolbarHidden ? 'translateY(-100%)' : 'translateY(0)'}
	>
		<ReaderToolbar
			title={book.title}
			author={book.author}
			{currentPage}
			{totalPages}
			{zoom}
			{isFullscreen}
			{isTocOpen}
			{isSearchOpen}
			{isSettingsOpen}
			onBack={() => goto(`/buku/${book.slug}`)}
			onPrevPage={prevPage}
			onNextPage={nextPage}
			onZoomIn={zoomIn}
			onZoomOut={zoomOut}
			onToggleToc={() => {
				isTocOpen = !isTocOpen;
				isSettingsOpen = false;
			}}
			onToggleSearch={() => {
				isSearchOpen = !isSearchOpen;
				isSettingsOpen = false;
			}}
			onToggleSettings={() => {
				isSettingsOpen = !isSettingsOpen;
				isSearchOpen = false;
			}}
			onToggleFullscreen={toggleFullscreen}
		/>

		<!-- Quick Reader Role Presence (Non-intrusive on-premise demographic identifier) -->
		{#if isRolePromptOpen && currentRole === 'umum'}
			<div
				class="flex items-center justify-between border-b border-ink/10 bg-sand/90 px-4 py-1 text-xs text-ink shadow-xs backdrop-blur-xs transition-all"
			>
				<div class="flex items-center gap-2">
					<span class="font-medium text-ink-muted">Identifikasi Sivitas UMKO:</span>
					<span class="text-[11px] text-ink">Membaca sebagai:</span>
				</div>
				<div class="flex items-center gap-1.5">
					<form
						method="POST"
						action="?/setRole"
						use:enhance={() => {
							currentRole = 'mahasiswa';
							isRolePromptOpen = false;
						}}
					>
						<input type="hidden" name="role" value="mahasiswa" />
						<button
							type="submit"
							class="rounded-xs bg-brick px-2 py-0.5 text-[10px] font-semibold text-cream transition-colors hover:bg-brick/90"
						>
							Mahasiswa
						</button>
					</form>
					<form
						method="POST"
						action="?/setRole"
						use:enhance={() => {
							currentRole = 'dosen';
							isRolePromptOpen = false;
						}}
					>
						<input type="hidden" name="role" value="dosen" />
						<button
							type="submit"
							class="rounded-xs bg-terracotta px-2 py-0.5 text-[10px] font-semibold text-cream transition-colors hover:bg-terracotta/90"
						>
							Dosen / Peneliti
						</button>
					</form>
					<button
						type="button"
						onclick={() => (isRolePromptOpen = false)}
						class="ml-2 text-[11px] text-ink-muted hover:text-ink"
						title="Tutup banner"
					>
						✕
					</button>
				</div>
			</div>
		{/if}

		<ReaderSearchPanel
			isOpen={isSearchOpen}
			results={searchResults}
			activeIndex={searchActiveIndex}
			{isSearching}
			onClose={() => {
				isSearchOpen = false;
				searchQuery = '';
				searchResults = [];
			}}
			onSearch={handleSearch}
			onNavigate={navigateToResult}
			onPrevResult={prevResult}
			onNextResult={nextResult}
		/>
	</div>

	<!-- ── MAIN READING AREA ──────────────────────────────────────────────── -->
	<div class="reader-body relative flex-1 overflow-hidden">
		<!-- TOC Side panel -->
		<ReaderTocPanel
			isOpen={isTocOpen}
			{toc}
			{currentPage}
			onClose={() => {
				isTocOpen = false;
			}}
			onNavigate={navigateToPage}
		/>

		<!-- Settings drawer (right side) -->
		<ReaderSettingsModal
			isOpen={isSettingsOpen}
			{fileType}
			{theme}
			{readMode}
			{twoPageSpread}
			{fontFamily}
			{fontSize}
			{lineHeight}
			onClose={() => {
				isSettingsOpen = false;
			}}
			onThemeChange={(t: Theme) => {
				theme = t;
				saveProgress();
			}}
			onReadModeChange={(m: ReadMode) => {
				readMode = m;
				saveProgress();
			}}
			onTwoPageSpreadChange={(s: boolean) => {
				twoPageSpread = s;
				saveProgress();
			}}
			onFontFamilyChange={(f: string) => {
				fontFamily = f;
				saveProgress();
			}}
			onFontSizeChange={(s: number) => {
				fontSize = s;
				saveProgress();
			}}
			onLineHeightChange={(lh: number) => {
				lineHeight = lh;
				saveProgress();
			}}
		/>

		<!-- ── PDF READER ──────────────────────────────────────────────────── -->
		{#if fileType === 'pdf'}
			<PdfReader
				src={streamUrl}
				bind:currentPage
				bind:zoom
				{readMode}
				{theme}
				{twoPageSpread}
				{toc}
				searchQuery={isSearchOpen ? searchQuery : ''}
				onPageChange={(p: number) => {
					currentPage = p;
					saveProgress();
				}}
				onTotalPagesLoaded={(n: number) => {
					totalPages = n;
				}}
				onTocLoaded={(t: TableOfContentItem[]) => {
					toc = t;
				}}
				onSearchResults={handleSearchResults}
				onReady={() => {}}
			/>

			<!-- ── EPUB READER ─────────────────────────────────────────────────── -->
		{:else if fileType === 'epub'}
			<EpubReader
				bind:this={epubReaderEl}
				src={streamUrl}
				bind:currentPage
				bind:totalPages
				{zoom}
				{readMode}
				{theme}
				{fontFamily}
				{fontSize}
				{lineHeight}
				searchQuery={isSearchOpen ? searchQuery : ''}
				onPageChange={(p: number) => {
					currentPage = p;
					saveProgress();
				}}
				onTotalPagesLoaded={(n: number) => {
					totalPages = n;
				}}
				onTocLoaded={(t: TableOfContentItem[]) => {
					toc = t;
				}}
				onSearchResults={handleSearchResults}
				onReady={() => {}}
			/>
		{:else}
			<div class="flex h-full flex-col items-center justify-center gap-3 text-ink-muted">
				<p class="font-serif text-lg text-brick">Format tidak didukung</p>
				<p class="text-sm">Hanya PDF dan EPUB yang dapat dibaca secara online.</p>
			</div>
		{/if}

		<!-- Tap-center to show toolbar (mobile) -->
		<button
			type="button"
			class="absolute inset-0 z-0 h-full w-full cursor-default md:hidden"
			tabindex="-1"
			onclick={showToolbar}
			aria-label="Tampilkan toolbar pembaca"
		></button>
	</div>

	<!-- ── PROGRESS BAR ───────────────────────────────────────────────────── -->
	<div
		class="reader-progress z-30 flex shrink-0 items-center gap-3
			border-t border-ink/10 px-4 py-1.5 transition-transform duration-200 ease-in-out"
		style:background="{readerBg}cc"
		style:transform={toolbarHidden ? 'translateY(100%)' : 'translateY(0)'}
	>
		<span class="w-8 shrink-0 text-right font-mono text-[10px] text-ink-muted">
			{progressPct}%
		</span>

		<input
			type="range"
			min="1"
			max={Math.max(1, totalPages)}
			value={currentPage}
			oninput={(e: Event) => {
				currentPage = parseInt((e.target as HTMLInputElement).value);
				saveProgress();
			}}
			class="reader-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-sand"
			aria-label="Posisi halaman saat ini"
		/>

		<span class="shrink-0 font-mono text-[10px] text-ink-muted">
			{currentPage}<span class="opacity-50"> / </span>{totalPages || '—'}
		</span>
	</div>
</div>

<style>
	/* Global anti-select for the reader page */
	:global(body:has(.reader-shell)) {
		user-select: none;
		-webkit-user-select: none;
		overflow: hidden;
	}

	/* Progress range slider */
	.reader-range::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #9a3b3b;
		cursor: pointer;
		border: 2px solid #f2ecbe;
		box-shadow: 0 1px 4px rgba(42, 26, 22, 0.25);
	}
	.reader-range::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #9a3b3b;
		cursor: pointer;
		border: 2px solid #f2ecbe;
		box-shadow: 0 1px 4px rgba(42, 26, 22, 0.25);
	}
	.reader-range::-webkit-slider-runnable-track {
		background: #e2c799;
		height: 4px;
		border-radius: 2px;
	}
	.reader-range::-moz-range-track {
		background: #e2c799;
		height: 4px;
		border-radius: 2px;
	}
</style>
