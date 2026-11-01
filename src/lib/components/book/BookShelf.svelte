<script lang="ts">
	import BookCover from './BookCover.svelte';
	import type { BookData } from '#lib/types';
	import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		title: string;
		code?: string;
		description?: string;
		books: BookData[];
		href?: string;
		class?: string;
	}

	let { title, code, description, books, href, class: className = '' }: Props = $props();

	let scrollContainer: HTMLElement | null = $state(null);

	function scroll(direction: 'left' | 'right') {
		if (!scrollContainer) return;
		const offset = direction === 'left' ? -320 : 320;
		scrollContainer.scrollBy({ left: offset, behavior: 'smooth' });
	}
</script>

<section class="relative my-8 {className}">
	<!-- Shelf Header: Library Catalog Placard -->
	<div class="mb-4 flex items-end justify-between border-b border-ink/15 pb-2">
		<div class="flex items-center gap-3">
			{#if code}
				<div class="catalog-card rounded-xs border border-ink/20 px-2.5 py-1">
					<span class="font-mono text-xs font-bold tracking-wider text-brick">
						{code}
					</span>
				</div>
			{/if}
			<div>
				<h3 class="font-serif text-xl leading-tight font-bold text-ink sm:text-2xl">
					{title}
				</h3>
				{#if description}
					<p class="mt-0.5 max-w-lg text-xs text-ink-muted">
						{description}
					</p>
				{/if}
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- Scroll arrows for keyboard / mouse navigation -->
			<button
				type="button"
				onclick={() => scroll('left')}
				class="focus-library flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 bg-sand/60 text-ink transition-colors hover:bg-sand"
				aria-label="Gulir ke kiri"
			>
				<ChevronLeft size={16} />
			</button>
			<button
				type="button"
				onclick={() => scroll('right')}
				class="focus-library flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 bg-sand/60 text-ink transition-colors hover:bg-sand"
				aria-label="Gulir ke kanan"
			>
				<ChevronRight size={16} />
			</button>

			{#if href}
				<a
					{href}
					class="focus-library ml-2 hidden items-center gap-1 text-xs font-semibold tracking-wide text-brick hover:text-brick-dark sm:inline-flex"
				>
					<span>Buka Rak</span>
					<ArrowRight size={13} />
				</a>
			{/if}
		</div>
	</div>

	<!-- Shelf Container: books standing directly on wooden shelf plank -->
	<div class="relative pt-2">
		<!-- Horizontal scrollable row of books -->
		<div
			bind:this={scrollContainer}
			class="no-scrollbar flex items-end gap-5 overflow-x-auto scroll-smooth px-2 pb-0 sm:gap-7"
			aria-label="Deretan buku di rak {title}"
		>
			{#each books as book (book.slug)}
				<a
					href="/buku/{book.slug}"
					class="group focus-library flex shrink-0 flex-col items-center pb-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2"
					tabindex="0"
				>
					<BookCover
						title={book.title}
						slug={book.slug}
						author={book.author}
						src={book.coverUrl}
						classification={book.classification}
						isSaved={book.isSaved}
						isFeatured={book.isFeatured}
						size="md"
						class="group-hover:book-shadow-hover"
					/>
					<!-- Subtle book shadow resting on the wood -->
					<div
						class="-mt-1 h-2 w-4/5 rounded-full bg-black/25 blur-[2px] transition-transform group-hover:scale-90"
					></div>
					<div class="mt-2 w-35 text-center">
						<span
							class="line-clamp-1 block font-serif text-xs font-semibold text-ink transition-colors group-hover:text-brick"
						>
							{book.title}
						</span>
						<span class="line-clamp-1 block text-[11px] text-ink-muted">
							{book.author}
						</span>
					</div>
				</a>
			{/each}
		</div>

		<!-- Physical Wooden Shelf Plank -->
		<div class="shelf-plank mt-2 w-full rounded-b-xs"></div>
	</div>
</section>

<style>
	/* Hide standard scrollbar for organic library look */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
