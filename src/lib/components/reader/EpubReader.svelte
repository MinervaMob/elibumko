<script lang="ts">
	/* eslint-disable @typescript-eslint/no-explicit-any, no-useless-assignment */
	import { onMount, onDestroy } from 'svelte';
	import type { TableOfContentItem } from '#lib';

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
		totalPages?: number;
		zoom?: number;
		readMode?: ReadMode;
		theme?: Theme;
		fontFamily?: string;
		fontSize?: number;
		lineHeight?: number;
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
		totalPages = $bindable(0),
		zoom: _zoom = 100,
		readMode = 'paged',
		theme = 'light',
		fontFamily = 'Literata',
		fontSize = 17,
		lineHeight = 1.65,
		searchQuery = '',
		onPageChange,
		onTotalPagesLoaded,
		onTocLoaded,
		onSearchResults,
		onReady
	}: Props = $props();

	let viewerEl: HTMLDivElement;
	let book: any = null;
	let rendition: any = null;
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Theme backgrounds and text
	const themeStyles: Record<Theme, Record<string, string>> = {
		light: { background: '#F2ECBE', color: '#2A1A16' },
		sepia: { background: '#EDE0C4', color: '#2A1A16' },
		dark: { background: '#1C1210', color: '#E2C799' },
		contrast: { background: '#FFFFFF', color: '#000000' }
	};

	async function loadEpub() {
		isLoading = true;
		error = null;
		try {
			// Dynamic import: EPUB.js must be browser-only
			const EpubModule = await import('epubjs');
			const Epub = EpubModule.default ?? EpubModule;

			book = Epub(src, { openAs: 'epub' });

			// Wait for book to be ready
			await book.ready;

			// Compute total pages (spine item count as approximation)
			const spineLength = book.spine?.spineItems?.length ?? 0;
			totalPages = spineLength;
			onTotalPagesLoaded?.(spineLength);

			// Extract TOC
			await book.loaded.navigation;
			const tocItems = mapNavItems(book.navigation?.toc ?? []);
			onTocLoaded?.(tocItems);

			// Create rendition
			rendition = book.renderTo(viewerEl, {
				flow: readMode === 'scroll' ? 'scrolled-doc' : 'paginated',
				width: '100%',
				height: '100%',
				spread: 'none'
			});

			// Apply theme styles
			applyTheme(theme);
			applyFontSettings();

			// Anti-copy: inject CSS into the iframe
			rendition.hooks.content.register((contents: any) => {
				contents.addStylesheetRules({
					'*': {
						'-webkit-user-select': 'none !important',
						'-moz-user-select': 'none !important',
						'user-select': 'none !important',
						'-webkit-touch-callout': 'none !important'
					},
					body: {
						'pointer-events': 'none !important'
					}
				});

				// Disable context menu inside epub iframe
				contents.document.addEventListener('contextmenu', (e: Event) => e.preventDefault());
				contents.document.addEventListener('keydown', (e: KeyboardEvent) => {
					// Block Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+P, F12
					if ((e.ctrlKey || e.metaKey) && ['c', 'a', 's', 'p', 'u'].includes(e.key.toLowerCase())) {
						e.preventDefault();
					}
				});
			});

			// Listen to location changes
			rendition.on('relocated', (location: any) => {
				const pageNum = location?.start?.index ?? 0;
				currentPage = pageNum + 1;
				onPageChange?.(pageNum + 1);
			});

			// Display at current page
			await rendition.display();
			isLoading = false;
			onReady?.();
		} catch (e: any) {
			isLoading = false;
			error = `Gagal memuat EPUB: ${e?.message ?? 'Terjadi kesalahan tidak dikenal.'}`;
		}
	}

	function mapNavItems(items: any[]): TableOfContentItem[] {
		return items.map((item: any) => ({
			title: item.label?.trim() ?? 'Tanpa Judul',
			page: item.index ?? 0,
			children: item.subitems?.length ? mapNavItems(item.subitems) : undefined
		}));
	}

	function applyTheme(t: Theme) {
		if (!rendition) return;
		const styles = themeStyles[t];
		rendition.themes.default({
			body: {
				background: styles.background + ' !important',
				color: styles.color + ' !important'
			},
			'*': {
				color: styles.color + ' !important',
				'border-color': 'rgba(42,26,22,0.18) !important'
			}
		});
	}

	function applyFontSettings() {
		if (!rendition) return;
		const familyCSS =
			fontFamily === 'Atkinson Hyperlegible'
				? `'Atkinson Hyperlegible', sans-serif`
				: fontFamily === 'Source Sans 3'
					? `'Source Sans 3', sans-serif`
					: `'Literata', Georgia, serif`;

		rendition.themes.default({
			body: {
				'font-family': familyCSS + ' !important',
				'font-size': fontSize + 'px !important',
				'line-height': lineHeight + ' !important',
				'max-width': '68ch !important',
				margin: '0 auto !important',
				padding: '1.5rem !important'
			}
		});
	}

	async function performSearch(query: string) {
		if (!book || !query.trim()) {
			onSearchResults?.([]);
			return;
		}
		const results: SearchResult[] = [];
		const q = query.toLowerCase();

		// Search across spine items
		await Promise.all(
			book.spine.spineItems.slice(0, 50).map(async (item: any, idx: number) => {
				try {
					const doc = await item.load(book.load.bind(book));
					const textContent = doc?.documentElement?.textContent ?? '';
					if (textContent.toLowerCase().includes(q)) {
						const lowerText = textContent.toLowerCase();
						const matchIdx = lowerText.indexOf(q);
						const start = Math.max(0, matchIdx - 40);
						const snippet = '…' + textContent.slice(start, start + 120) + '…';
						results.push({ page: idx + 1, snippet, matchIndex: results.length });
					}
				} catch {
					/* skip inaccessible section */
				}
			})
		);
		onSearchResults?.(results);
	}

	// Navigate to page index
	function goToPage(pageIdx: number) {
		if (!rendition || !book) return;
		const item = book.spine.spineItems[pageIdx - 1];
		if (item?.href) rendition.display(item.href);
	}

	// ── Reactivity ────────────────────────────────────────────────────────────
	$effect(() => {
		if (theme && rendition) applyTheme(theme);
	});

	$effect(() => {
		if ((fontFamily || fontSize || lineHeight) && rendition) applyFontSettings();
	});

	$effect(() => {
		if (searchQuery !== undefined) performSearch(searchQuery);
	});

	// External goToPage trigger
	$effect(() => {
		if (currentPage && rendition && !isLoading) {
			goToPage(currentPage);
		}
	});

	onMount(() => {
		loadEpub();
	});

	onDestroy(() => {
		try {
			rendition?.destroy();
			book?.destroy();
		} catch {
			/* ignore cleanup error */
		}
	});

	export function nextPage() {
		rendition?.next();
	}
	export function prevPage() {
		rendition?.prev();
	}
</script>

<!-- ── EPUB Reader Shell ──────────────────────────────────────────────────── -->
<div
	class="epub-reader-container relative h-full w-full overflow-hidden select-none"
	oncontextmenu={(e) => e.preventDefault()}
	role="region"
	aria-label="Pembaca EPUB"
>
	{#if isLoading}
		<div class="flex h-full flex-col items-center justify-center gap-4 text-ink-muted">
			<div class="flex gap-1">
				{#each [0, 1, 2] as i (i)}
					<div
						class="h-2 w-2 animate-bounce rounded-full bg-brick"
						style="animation-delay: {i * 0.15}s"
					></div>
				{/each}
			</div>
			<span class="font-mono text-xs tracking-widest uppercase">Memuat EPUB…</span>
		</div>
	{:else if error}
		<div class="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
			<p class="font-serif text-lg text-brick">Gagal memuat dokumen</p>
			<p class="text-sm text-ink-muted">{error}</p>
		</div>
	{/if}

	<!-- epub.js renders INTO this div -->
	<div
		bind:this={viewerEl}
		class="epub-viewer h-full w-full"
		class:hidden={isLoading || !!error}
	></div>
</div>
