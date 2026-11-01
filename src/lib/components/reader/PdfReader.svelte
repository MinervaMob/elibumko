<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any, svelte/no-dom-manipulating */
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	type ReadMode = 'paged' | 'scroll';
	type Theme = 'light' | 'sepia' | 'dark' | 'contrast';

	interface SearchResult {
		page: number;
		snippet: string;
		matchIndex: number;
	}

	interface Props {
		src: string;
		currentPage?: number;
		zoom?: number;
		readMode?: ReadMode;
		theme?: Theme;
		twoPageSpread?: boolean;
		searchQuery?: string;
		onPageChange?: (page: number) => void;
		onTotalPagesLoaded?: (total: number) => void;
		onSearchResults?: (results: SearchResult[]) => void;
		onReady?: () => void;
	}

	let {
		src,
		currentPage = $bindable(1),
		zoom = $bindable(100),
		readMode = 'paged',
		theme = 'light',
		twoPageSpread = false,
		searchQuery = '',
		onPageChange,
		onTotalPagesLoaded,
		onSearchResults,
		onReady
	}: Props = $props();

	// Internal state
	let containerEl: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let canvas2El: HTMLCanvasElement | undefined = $state(); // second page for two-page spread
	let scrollContainerEl: HTMLDivElement | undefined = $state();

	let pdfDoc: any = null;
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let renderTask: any = null;
	let renderTask2: any = null;
	let totalPages = $state(0);
	let renderPending = $state(false);

	// Touch handling for swipe
	let touchStartX = 0;
	let touchStartY = 0;

	// IntersectionObserver for scroll mode
	let scrollObserver: IntersectionObserver | null = null;
	let pageCanvases: HTMLCanvasElement[] = [];
	let renderedPages = new SvelteSet<number>();

	// Theme CSS filter map
	const themeFilters: Record<Theme, string> = {
		light: 'none',
		sepia: 'sepia(0.45) brightness(0.97)',
		dark: 'invert(1) hue-rotate(180deg)',
		contrast: 'contrast(1.6) brightness(0.95)'
	};

	// ── PDF.js init ─────────────────────────────────────────────────────────
	async function loadPdf() {
		isLoading = true;
		error = null;
		try {
			const pdfjsLib = await import('pdfjs-dist');
			pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

			const loadingTask = pdfjsLib.getDocument({ url: src });
			pdfDoc = await loadingTask.promise;
			totalPages = pdfDoc.numPages;
			onTotalPagesLoaded?.(totalPages);
			isLoading = false;

			if (readMode === 'scroll') {
				await buildScrollView();
			} else {
				await renderPage(currentPage);
			}
			onReady?.();
		} catch (e: any) {
			isLoading = false;
			error = `Gagal memuat PDF: ${e.message ?? 'Terjadi kesalahan tidak dikenal.'}`;
		}
	}

	// ── Paged mode render ────────────────────────────────────────────────────
	async function renderPage(pageNum: number) {
		if (!pdfDoc || !canvasEl) return;
		renderPending = true;

		// Cancel any in-flight render
		try {
			await renderTask?.cancel();
			await renderTask2?.cancel();
		} catch {
			/* ignore */
		}

		try {
			const page = await pdfDoc.getPage(pageNum);
			const pixelRatio = window.devicePixelRatio || 1;
			const scale = (zoom / 100) * pixelRatio;
			const viewport = page.getViewport({ scale });

			// Primary canvas
			const ctx = canvasEl.getContext('2d')!;
			canvasEl.width = viewport.width;
			canvasEl.height = viewport.height;
			canvasEl.style.width = `${viewport.width / pixelRatio}px`;
			canvasEl.style.height = `${viewport.height / pixelRatio}px`;

			renderTask = page.render({ canvasContext: ctx, viewport });
			await renderTask.promise;

			// Two-page spread — render the next page if available
			if (twoPageSpread && canvas2El && pageNum < totalPages) {
				const page2 = await pdfDoc.getPage(pageNum + 1);
				const vp2 = page2.getViewport({ scale });
				const ctx2 = canvas2El.getContext('2d')!;
				canvas2El.width = vp2.width;
				canvas2El.height = vp2.height;
				canvas2El.style.width = `${vp2.width / pixelRatio}px`;
				canvas2El.style.height = `${vp2.height / pixelRatio}px`;
				renderTask2 = page2.render({ canvasContext: ctx2, viewport: vp2 });
				await renderTask2.promise;
			}

			onPageChange?.(pageNum);
		} catch (e: any) {
			if (e?.name !== 'RenderingCancelledException') {
				error = `Gagal merender halaman ${pageNum}.`;
			}
		} finally {
			renderPending = false;
		}
	}

	// ── Scroll mode ──────────────────────────────────────────────────────────
	async function buildScrollView() {
		if (!pdfDoc || !scrollContainerEl) return;
		scrollContainerEl.innerHTML = '';
		pageCanvases = [];
		renderedPages.clear();

		const pixelRatio = window.devicePixelRatio || 1;
		const scale = (zoom / 100) * pixelRatio;

		// Create placeholder divs for all pages (lazy-render via IntersectionObserver)
		for (let i = 1; i <= totalPages; i++) {
			const page = await pdfDoc.getPage(i);
			const viewport = page.getViewport({ scale });

			const wrapper = document.createElement('div');
			wrapper.className = 'pdf-page-wrapper';
			wrapper.dataset.pageNum = String(i);
			wrapper.style.cssText = `
				position: relative;
				width: ${viewport.width / pixelRatio}px;
				margin: 0 auto 24px;
			`;

			const canvas = document.createElement('canvas');
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			canvas.style.width = `${viewport.width / pixelRatio}px`;
			canvas.style.height = `${viewport.height / pixelRatio}px`;
			canvas.style.display = 'block';
			// Anti-copy
			canvas.style.pointerEvents = 'none';
			canvas.style.userSelect = 'none';

			// Page number label
			const label = document.createElement('div');
			label.className = 'pdf-page-label';
			label.style.cssText = `
				text-align: center;
				font-family: 'IBM Plex Mono', monospace;
				font-size: 11px;
				color: #6B5A4E;
				padding: 6px 0;
				letter-spacing: 0.06em;
			`;
			label.textContent = `— ${i} —`;

			wrapper.appendChild(canvas);
			wrapper.appendChild(label);
			scrollContainerEl.appendChild(wrapper);
			pageCanvases[i] = canvas;
		}

		// Lazy-render pages as they enter the viewport
		scrollObserver?.disconnect();
		scrollObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const pageNum = parseInt((entry.target as HTMLElement).dataset.pageNum ?? '0');
						if (pageNum > 0 && !renderedPages.has(pageNum)) {
							renderedPages.add(pageNum);
							renderScrollPage(pageNum);
						}
						// Update current page indicator
						currentPage = pageNum;
						onPageChange?.(pageNum);
					}
				});
			},
			{ threshold: 0.4 }
		);

		scrollContainerEl.querySelectorAll('.pdf-page-wrapper').forEach((el) => {
			scrollObserver!.observe(el);
		});
	}

	async function renderScrollPage(pageNum: number) {
		if (!pdfDoc || !pageCanvases[pageNum]) return;
		try {
			const page = await pdfDoc.getPage(pageNum);
			const pixelRatio = window.devicePixelRatio || 1;
			const scale = (zoom / 100) * pixelRatio;
			const viewport = page.getViewport({ scale });
			const canvas = pageCanvases[pageNum];
			const ctx = canvas.getContext('2d')!;
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			await page.render({ canvasContext: ctx, viewport }).promise;
		} catch {
			/* silently skip cancelled renders */
		}
	}

	// ── Search ───────────────────────────────────────────────────────────────
	async function performSearch(query: string) {
		if (!pdfDoc || !query.trim()) {
			onSearchResults?.([]);
			return;
		}
		const results: SearchResult[] = [];
		const q = query.toLowerCase();

		for (let i = 1; i <= Math.min(totalPages, 200); i++) {
			try {
				const page = await pdfDoc.getPage(i);
				const textContent = await page.getTextContent();
				const text = textContent.items.map((item: any) => item.str).join(' ');
				const lowerText = text.toLowerCase();
				let idx = lowerText.indexOf(q);
				if (idx !== -1) {
					const start = Math.max(0, idx - 40);
					const snippet = '...' + text.slice(start, start + 120) + '...';
					results.push({ page: i, snippet, matchIndex: results.length });
				}
			} catch {
				/* skip page on error */
			}
		}
		onSearchResults?.(results);
	}

	// ── Navigate ─────────────────────────────────────────────────────────────
	function goToPage(target: number) {
		const p = Math.max(1, Math.min(totalPages, target));
		currentPage = p;
		onPageChange?.(p);
		if (readMode === 'scroll') {
			const el = scrollContainerEl?.querySelector(`[data-page-num="${p}"]`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} else {
			renderPage(p);
		}
	}

	// ── Touch/swipe ──────────────────────────────────────────────────────────
	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}
	function onTouchEnd(e: TouchEvent) {
		if (readMode !== 'paged') return;
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
			if (dx < 0) goToPage(currentPage + (twoPageSpread ? 2 : 1));
			else goToPage(currentPage - (twoPageSpread ? 2 : 1));
		}
	}

	// ── Effects ──────────────────────────────────────────────────────────────
	$effect(() => {
		if (src) loadPdf();
	});

	$effect(() => {
		if (!pdfDoc || isLoading) return;
		if (readMode === 'paged') {
			renderPage(currentPage);
		} else {
			renderedPages.clear();
			buildScrollView();
		}
	});

	$effect(() => {
		// Zoom changed — re-render
		if (!pdfDoc || isLoading) return;
		if (readMode === 'paged') {
			renderPage(currentPage);
		} else {
			renderedPages.clear();
			buildScrollView();
		}
	});

	$effect(() => {
		if (searchQuery !== undefined) {
			performSearch(searchQuery);
		}
	});

	onDestroy(() => {
		scrollObserver?.disconnect();
		try {
			renderTask?.cancel();
		} catch {
			/* ignore */
		}
		try {
			renderTask2?.cancel();
		} catch {
			/* ignore */
		}
		pdfDoc?.destroy?.();
	});
</script>

<!-- ── PDF Reader Shell ──────────────────────────────────────────────────── -->
<div
	bind:this={containerEl}
	class="pdf-reader-container relative flex h-full w-full flex-col items-center overflow-hidden select-none"
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	oncontextmenu={(e) => e.preventDefault()}
	role="region"
	aria-label="Pembaca PDF"
>
	<!-- Filter overlay for theme -->
	<div
		class="pdf-theme-wrap flex h-full w-full flex-col items-center overflow-auto"
		style="filter: {themeFilters[theme]};"
	>
		{#if isLoading}
			<!-- Loading skeleton -->
			<div class="flex h-full flex-col items-center justify-center gap-4 text-ink-muted">
				<div class="flex gap-1">
					{#each [0, 1, 2] as i (i)}
						<div
							class="h-2 w-2 animate-bounce rounded-full bg-brick"
							style="animation-delay: {i * 0.15}s"
						></div>
					{/each}
				</div>
				<span class="font-mono text-xs tracking-widest uppercase">Memuat dokumen…</span>
			</div>
		{:else if error}
			<div class="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
				<p class="font-serif text-lg text-brick">Gagal memuat dokumen</p>
				<p class="text-sm text-ink-muted">{error}</p>
			</div>
		{:else if readMode === 'scroll'}
			<!-- Scroll mode: all pages stacked -->
			<div bind:this={scrollContainerEl} class="pdf-scroll-view w-full px-4 py-6"></div>
		{:else}
			<!-- Paged mode -->
			<div class="pdf-paged-view flex h-full w-full items-center justify-center gap-4 px-4 py-4">
				<!-- Page left (or single) -->
				<div class="page-canvas-wrap relative shrink-0" style="pointer-events: none;">
					<canvas
						bind:this={canvasEl}
						class="block rounded-sm shadow-[2px_4px_20px_rgba(42,26,22,0.22)]"
					></canvas>
					{#if renderPending}
						<div class="absolute inset-0 flex items-center justify-center bg-cream/60">
							<div class="h-1.5 w-1.5 animate-ping rounded-full bg-brick"></div>
						</div>
					{/if}
				</div>

				<!-- Two-page spread: second canvas -->
				{#if twoPageSpread && currentPage < totalPages}
					<div class="page-canvas-wrap relative shrink-0" style="pointer-events: none;">
						<canvas
							bind:this={canvas2El}
							class="block rounded-sm shadow-[2px_4px_20px_rgba(42,26,22,0.22)]"
						></canvas>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
