<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any, svelte/no-dom-manipulating */
	import { onDestroy, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { TableOfContentItem } from '#lib/types';

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
		toc?: TableOfContentItem[];
		searchQuery?: string;
		onPageChange?: (page: number) => void;
		onTotalPagesLoaded?: (total: number) => void;
		onTocLoaded?: (toc: TableOfContentItem[]) => void;
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
		toc = [],
		searchQuery = '',
		onPageChange,
		onTotalPagesLoaded,
		onTocLoaded,
		onSearchResults,
		onReady
	}: Props = $props();

	// Internal state
	let containerEl: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();
	let canvas2El: HTMLCanvasElement | undefined = $state(); // second page for two-page spread
	let scrollContainerEl: HTMLDivElement | undefined = $state();

	let pdfDoc: any = $state(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let renderTask: any = null;
	let renderTask2: any = null;
	let totalPages = $state(0);
	let renderPending = $state(false);
	let renderSeq = 0;

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
			const loadedDoc = await loadingTask.promise;
			totalPages = loadedDoc.numPages;
			onTotalPagesLoaded?.(totalPages);
			pdfDoc = loadedDoc;
			isLoading = false;
			await tick();
			onReady?.();

			// 1. Ekstraksi dan resolusi outline bawaan PDF
			let outlineDetected = false;
			try {
				const outline = await loadedDoc.getOutline();
				if (Array.isArray(outline) && outline.length > 0) {
					const resolvedToc: TableOfContentItem[] = [];
					for (const item of outline) {
						let pageNum = 1;
						if (item.dest) {
							try {
								let dest: any = item.dest;
								if (typeof dest === 'string') {
									dest = await loadedDoc.getDestination(dest);
								}
								if (Array.isArray(dest)) {
									const pageIndex = await loadedDoc.getPageIndex(dest[0]);
									pageNum = pageIndex + 1;
								}
							} catch {
								/* dest resolve opsional */
							}
						}
						const cleanT = item.title
							?.replace(/[\s.-_–—·•…]+$/, '')
							?.replace(/\s+/g, ' ')
							?.trim();
						if (cleanT) {
							resolvedToc.push({
								title: cleanT,
								page: pageNum
							});
						}
					}
					if (resolvedToc.length > 0) {
						outlineDetected = true;
						onTocLoaded?.(resolvedToc);
					}
				}
			} catch {
				/* outline opsional */
			}

			// 2. Koreksi offset halaman otomatis jika Daftar Isi berasal dari database/teks
			if (!outlineDetected && toc && toc.length > 0 && onTocLoaded) {
				const firstCh = toc.find((it) => /^BAB\s+(I|1)\b/i.test(it.title));
				if (firstCh && firstCh.page <= 2 && totalPages > 5) {
					try {
						for (let p = 1; p <= Math.min(25, totalPages); p++) {
							const page = await loadedDoc.getPage(p);
							const content = await page.getTextContent();
							const text = content.items.map((it: any) => it.str).join(' ');
							if (/\bBAB\s+(I|1)\b/i.test(text) && !/\.{4,}\s*\d+/i.test(text)) {
								const offset = p - firstCh.page;
								if (offset > 0) {
									const adjustedToc = toc.map((it) => ({
										...it,
										title: it.title
											.replace(/[\s.-_–—·•…]+$/, '')
											.replace(/\s+/g, ' ')
											.trim(),
										page: Math.min(totalPages, it.page + offset)
									}));
									onTocLoaded(adjustedToc);
								}
								break;
							}
						}
					} catch {
						/* best effort */
					}
				}
			}
		} catch (e: any) {
			isLoading = false;
			error = `Gagal memuat PDF: ${e.message ?? 'Terjadi kesalahan tidak dikenal.'}`;
		}
	}

	// ── Paged mode render ────────────────────────────────────────────────────
	async function renderPage(pageNum: number) {
		if (!pdfDoc) return;
		if (!canvasEl) {
			await tick();
			if (!canvasEl) return;
		}

		const currentSeq = ++renderSeq;
		renderPending = true;

		// Cancel any in-flight render safely
		if (renderTask) {
			try {
				renderTask.cancel();
				await renderTask.promise;
			} catch {
				/* ignore cancellation */
			}
			renderTask = null;
		}
		if (renderTask2) {
			try {
				renderTask2.cancel();
				await renderTask2.promise;
			} catch {
				/* ignore cancellation */
			}
			renderTask2 = null;
		}

		try {
			const targetPage = Math.max(1, Math.min(pageNum, totalPages || 1));
			const page = await pdfDoc.getPage(targetPage);
			if (currentSeq !== renderSeq) return;

			const pixelRatio = window.devicePixelRatio || 1;
			const scale = (zoom / 100) * pixelRatio;
			const viewport = page.getViewport({ scale });

			// Primary canvas
			const ctx = canvasEl.getContext('2d')!;
			canvasEl.width = Math.floor(viewport.width);
			canvasEl.height = Math.floor(viewport.height);
			canvasEl.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
			canvasEl.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;

			// Fill solid white background so transparent PDFs render cleanly
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

			renderTask = page.render({ canvasContext: ctx, viewport, canvas: canvasEl });
			await renderTask.promise;
			if (currentSeq !== renderSeq) return;

			// Two-page spread — render the next page if available
			if (twoPageSpread && canvas2El && targetPage < totalPages) {
				const page2 = await pdfDoc.getPage(targetPage + 1);
				if (currentSeq !== renderSeq) return;
				const vp2 = page2.getViewport({ scale });
				const ctx2 = canvas2El.getContext('2d')!;
				canvas2El.width = Math.floor(vp2.width);
				canvas2El.height = Math.floor(vp2.height);
				canvas2El.style.width = `${Math.floor(vp2.width / pixelRatio)}px`;
				canvas2El.style.height = `${Math.floor(vp2.height / pixelRatio)}px`;

				ctx2.fillStyle = '#ffffff';
				ctx2.fillRect(0, 0, canvas2El.width, canvas2El.height);

				renderTask2 = page2.render({ canvasContext: ctx2, viewport: vp2, canvas: canvas2El });
				await renderTask2.promise;
			}

			if (currentSeq === renderSeq) {
				onPageChange?.(targetPage);
			}
		} catch (e: any) {
			if (e?.name !== 'RenderingCancelledException' && currentSeq === renderSeq) {
				console.error('PDF render error:', e);
				error = `Gagal merender halaman ${pageNum}.`;
			}
		} finally {
			if (currentSeq === renderSeq) {
				renderPending = false;
			}
		}
	}

	// ── Scroll mode ──────────────────────────────────────────────────────────
	async function buildScrollView() {
		if (!pdfDoc) return;
		if (!scrollContainerEl) {
			await tick();
			if (!scrollContainerEl) return;
		}

		scrollContainerEl.innerHTML = '';
		pageCanvases = [];
		renderedPages.clear();

		const pixelRatio = window.devicePixelRatio || 1;
		const scale = (zoom / 100) * pixelRatio;

		// Fetch page 1 to get standard aspect ratio for high-performance lazy loading
		let defaultWidth = 600 * (zoom / 100);
		let defaultHeight = 840 * (zoom / 100);
		try {
			const p1 = await pdfDoc.getPage(1);
			const vp1 = p1.getViewport({ scale });
			defaultWidth = vp1.width / pixelRatio;
			defaultHeight = vp1.height / pixelRatio;
		} catch {
			/* fallback to standard A4 */
		}

		// Create placeholder wrappers for all pages
		for (let i = 1; i <= totalPages; i++) {
			const wrapper = document.createElement('div');
			wrapper.className = 'pdf-page-wrapper';
			wrapper.dataset.pageNum = String(i);
			wrapper.style.cssText = `
				position: relative;
				width: ${Math.floor(defaultWidth)}px;
				min-height: ${Math.floor(defaultHeight)}px;
				margin: 0 auto 28px;
			`;

			const canvas = document.createElement('canvas');
			canvas.width = Math.floor(defaultWidth * pixelRatio);
			canvas.height = Math.floor(defaultHeight * pixelRatio);
			canvas.style.width = `${Math.floor(defaultWidth)}px`;
			canvas.style.height = `${Math.floor(defaultHeight)}px`;
			canvas.style.display = 'block';
			canvas.style.background = '#ffffff';
			canvas.style.borderRadius = '2px';
			canvas.style.boxShadow = '2px 4px 20px rgba(42,26,22,0.22)';
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
				padding: 8px 0 0;
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
			{ threshold: 0.25, rootMargin: '300px 0px' }
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
			canvas.width = Math.floor(viewport.width);
			canvas.height = Math.floor(viewport.height);
			canvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
			canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;

			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			await page.render({ canvasContext: ctx, viewport, canvas }).promise;
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
				const idx = lowerText.indexOf(q);
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
		if (src) {
			void loadPdf();
		}
	});

	$effect(() => {
		// Reactive dependencies
		const doc = pdfDoc;
		const page = currentPage;
		const _z = zoom;
		const mode = readMode;
		const _spread = twoPageSpread;
		const loading = isLoading;

		if (!doc || loading) return;

		if (mode === 'paged') {
			void renderPage(page);
		} else {
			void buildScrollView();
		}
	});

	$effect(() => {
		if (searchQuery !== undefined) {
			void performSearch(searchQuery);
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
						style="background: #ffffff;"
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
							style="background: #ffffff;"
							class="block rounded-sm shadow-[2px_4px_20px_rgba(42,26,22,0.22)]"
						></canvas>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
