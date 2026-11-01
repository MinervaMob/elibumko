<script lang="ts">
	import { Search, X, ArrowRight, BookOpen, User } from 'lucide-svelte';

	interface Props {
		placeholder?: string;
		class?: string;
	}

	let {
		placeholder = 'Cari berdasarkan judul, penulis, ISBN, atau subjek...',
		class: className = ''
	}: Props = $props();

	let query = $state('');
	let isOpen = $state(false);
	let isLoading = $state(false);
	let inputElement: HTMLInputElement | null = $state(null);

	interface BookSuggestion {
		title: string;
		slug: string;
		author: string;
		classification?: string;
		category?: string;
		year?: number;
	}

	interface CategorySuggestion {
		code: string;
		name: string;
		count?: number;
	}

	let matchingBooks = $state<BookSuggestion[]>([]);
	let matchingCategories = $state<CategorySuggestion[]>([]);
	let matchingAuthors = $state<string[]>([]);

	// Quick suggestion tags
	const quickSuggestions = [
		'Pendidikan Matematika',
		'Kemuhammadiyahan',
		'Algoritma Struktur Data',
		'Hukum Tata Negara',
		'Statistika'
	];

	// Live debounced search via Service API
	$effect(() => {
		const q = query.trim();
		if (q.length < 2) {
			matchingBooks = [];
			matchingCategories = [];
			matchingAuthors = [];
			isLoading = false;
			return;
		}

		isLoading = true;
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
				if (res.ok) {
					const data = await res.json();
					matchingBooks = data.books || [];
					matchingCategories = data.categories || [];
					matchingAuthors = data.authors || [];
				}
			} catch {
				// Ignore fetch error
			} finally {
				isLoading = false;
			}
		}, 180);

		return () => clearTimeout(timer);
	});

	const hasResults = $derived(
		matchingBooks.length > 0 || matchingCategories.length > 0 || matchingAuthors.length > 0
	);

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!query.trim()) return;
		window.location.href = `/rak?q=${encodeURIComponent(query.trim())}`;
	}

	function handleSelectSuggestion(term: string) {
		query = term;
		window.location.href = `/rak?q=${encodeURIComponent(term)}`;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			inputElement?.blur();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative w-full {className}">
	<!-- Main Search Input Bar -->
	<form
		onsubmit={handleFormSubmit}
		class="relative flex items-center rounded-lg border-2 border-ink/20 bg-white shadow-[0_4px_20px_rgba(42,26,22,0.08)] transition-all duration-200 focus-within:border-brick focus-within:ring-2 focus-within:ring-brick/20"
	>
		<div class="pointer-events-none flex items-center pr-2 pl-4 text-brick">
			{#if isLoading}
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-brick/30 border-t-brick"
				></div>
			{:else}
				<Search size={22} />
			{/if}
		</div>

		<input
			bind:this={inputElement}
			type="text"
			bind:value={query}
			{placeholder}
			onfocus={() => (isOpen = true)}
			class="w-full border-none bg-transparent px-2 py-3.5 font-sans text-base text-ink placeholder:text-sm placeholder:font-normal placeholder:text-ink-muted/50 focus:border-none focus:ring-0 focus:outline-none sm:py-4 sm:text-lg sm:placeholder:text-base"
			autocomplete="off"
		/>

		{#if query.trim()}
			<button
				type="button"
				onclick={() => {
					query = '';
					isOpen = false;
				}}
				class="focus-library mr-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-sand/40 hover:text-ink"
				aria-label="Bersihkan pencarian"
			>
				<X size={18} />
			</button>
		{/if}

		<button
			type="submit"
			class="focus-library m-1.5 flex shrink-0 items-center gap-1.5 rounded-md bg-brick px-4 py-2.5 text-sm font-medium text-cream shadow-xs transition-colors hover:bg-brick-dark sm:m-2 sm:px-6 sm:py-3 sm:text-base"
		>
			<span class="hidden sm:inline">Cari Koleksi</span>
			<span class="sm:hidden">Cari</span>
			<ArrowRight size={16} />
		</button>
	</form>

	<!-- Quick Suggestions Pills -->
	<div class="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
		<span class="mr-1 font-mono text-xs tracking-wider text-ink-muted uppercase">
			Saran Cepat:
		</span>
		{#each quickSuggestions as suggestion (suggestion)}
			<button
				type="button"
				onclick={() => handleSelectSuggestion(suggestion)}
				class="focus-library rounded-sm border border-ink/10 bg-sand/40 px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-sand"
			>
				{suggestion}
			</button>
		{/each}
	</div>

	<!-- Autocomplete Dropdown Panel -->
	{#if isOpen && query.trim().length > 1}
		<!-- Click outside backdrop -->
		<button
			type="button"
			class="fixed inset-0 z-30 cursor-default bg-black/5"
			tabindex="-1"
			onclick={() => (isOpen = false)}
			aria-label="Tutup saran"
		></button>

		<div
			class="absolute top-full right-0 left-0 z-40 mt-2 max-h-115 overflow-hidden overflow-y-auto rounded-lg border border-ink/20 bg-cream shadow-[0_12px_32px_rgba(42,26,22,0.14)]"
		>
			{#if hasResults}
				<!-- Books Results Section -->
				{#if matchingBooks.length > 0}
					<div class="border-b border-ink/10 p-3">
						<span
							class="mb-2 block px-2 font-mono text-[11px] font-semibold tracking-wider text-ink-muted uppercase"
						>
							Buku Ditemukan
						</span>
						<div class="space-y-1">
							{#each matchingBooks as book (book.slug)}
								<a
									href="/buku/{book.slug}"
									class="focus-library group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-sand/60"
								>
									<div
										class="flex aspect-2/3 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-ink/10 bg-sand font-mono text-[8px] font-bold text-ink-muted"
									>
										{book.classification ?? 'DDC'}
									</div>
									<div class="min-w-0 flex-1">
										<p
											class="truncate font-serif text-sm font-bold text-ink group-hover:text-brick"
										>
											{book.title}
										</p>
										<p class="truncate font-sans text-xs text-ink-muted">
											{book.author}
											{#if book.year}
												&bull; {book.year}{/if}
										</p>
									</div>
									<span class="shrink-0 font-mono text-xs font-medium text-brick">
										Buka &rarr;
									</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Categories Results Section -->
				{#if matchingCategories.length > 0}
					<div class="border-b border-ink/10 bg-sand/20 p-3">
						<span
							class="mb-2 block px-2 font-mono text-[11px] font-semibold tracking-wider text-ink-muted uppercase"
						>
							Kategori & Klasifikasi
						</span>
						<div class="flex flex-wrap gap-2 px-2">
							{#each matchingCategories as cat (cat.code)}
								<a
									href="/rak/{cat.code}"
									class="focus-library inline-flex items-center gap-1.5 rounded-sm border border-ink/15 bg-white px-2.5 py-1 text-xs text-ink transition-colors hover:border-brick hover:text-brick"
								>
									<span class="font-mono text-[11px] font-bold text-brick">{cat.code}</span>
									<span>{cat.name}</span>
									<span class="text-[10px] text-ink-muted">({cat.count} buku)</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Authors Section -->
				{#if matchingAuthors.length > 0}
					<div class="bg-sand/10 p-3">
						<span
							class="mb-1.5 block px-2 font-mono text-[11px] font-semibold tracking-wider text-ink-muted uppercase"
						>
							Penulis Kampus
						</span>
						<div class="space-y-1">
							{#each matchingAuthors as author (author)}
								<a
									href="/rak?penulis={encodeURIComponent(author)}"
									class="focus-library flex items-center justify-between rounded-sm p-2 text-xs font-medium text-ink transition-colors hover:bg-sand/50"
								>
									<div class="flex items-center gap-2">
										<User size={14} class="text-ink-muted" />
										<span>{author}</span>
									</div>
									<span class="font-mono text-xs text-ink-muted">Lihat Karya &rarr;</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Footer action: View all results -->
				<div class="border-t border-ink/15 bg-sand/35 p-3 text-center">
					<a
						href="/rak?q={encodeURIComponent(query.trim())}"
						class="focus-library inline-flex items-center gap-1.5 text-xs font-semibold text-brick hover:text-brick-dark"
					>
						<span>Lihat seluruh hasil pencarian untuk "{query.trim()}"</span>
						<ArrowRight size={13} />
					</a>
				</div>
			{:else}
				<!-- Informative Empty State (Anti-slop compliant) -->
				<div class="p-6 text-center">
					<p class="mb-1 font-serif text-base font-bold text-ink">
						Tidak ada buku yang cocok dengan "{query.trim()}"
					</p>
					<p class="mx-auto mb-4 max-w-sm text-xs leading-relaxed text-ink-muted">
						Coba gunakan kata kunci yang lebih umum, periksa ejaan penulis, atau cari langsung
						berdasarkan nomor klasifikasi DDC.
					</p>
					<a
						href="/rak"
						class="focus-library inline-flex items-center gap-1.5 rounded-sm bg-brick px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-brick-dark"
					>
						<BookOpen size={13} />
						<span>Jelajahi Seluruh Rak Buku</span>
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
