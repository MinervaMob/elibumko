<script lang="ts">
	import BookCover from './BookCover.svelte';
	import { BookOpen } from 'lucide-svelte';
	import type { BookData } from '#lib/types';

	interface Props {
		book: BookData;
		layout?: 'grid' | 'list';
		showActions?: boolean;
		class?: string;
	}

	let { book, layout = 'grid', showActions = false, class: className = '' }: Props = $props();
</script>

{#if layout === 'grid'}
	<!-- Grid Card layout -->
	<div
		class="group relative flex flex-col rounded-lg border border-ink/10 bg-sand/30 p-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-ink/25 hover:bg-sand/60 hover:shadow-md {className}"
	>
		<!-- Book cover container -->
		<a
			href="/buku/{book.slug}"
			class="focus-library relative mb-3 flex justify-center rounded-sm"
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
				class="group-hover:book-shadow-hover w-full max-w-40"
			/>
		</a>

		<!-- Info block -->
		<div class="flex grow flex-col">
			<!-- Classification and category tag -->
			<div class="mb-1.5 flex items-center justify-between gap-1">
				{#if book.classification}
					<span
						class="rounded-xs bg-ink/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink"
					>
						{book.classification}
					</span>
				{/if}
				{#if book.category}
					<span class="max-w-25 truncate text-[11px] text-ink-muted">
						{book.category}
					</span>
				{/if}
			</div>

			<!-- Title -->
			<h4
				class="line-clamp-2 font-serif text-sm leading-snug font-bold text-ink transition-colors group-hover:text-brick"
			>
				<a href="/buku/{book.slug}" class="focus-library">
					{book.title}
				</a>
			</h4>

			<!-- Author -->
			<p class="mt-1 line-clamp-1 text-xs text-ink-muted">
				{book.author}
			</p>

			<!-- Metadata row (Year, Pages, Readers) -->
			<div
				class="mt-auto flex items-center justify-between border-t border-ink/10 pt-3 font-mono text-[11px] text-ink-muted"
			>
				<span>{book.year ?? '2024'}</span>
				{#if book.pages}
					<span>{book.pages} hlm</span>
				{/if}
				{#if book.readersCount != null}
					<span class="font-medium text-brick">
						{(book.readersCount ?? 0).toLocaleString('id-ID')} baca
					</span>
				{/if}
			</div>

			{#if showActions}
				<div class="mt-2.5 flex items-center gap-1.5">
					<a
						href="/baca/{book.slug}"
						class="focus-library flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-brick px-2 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-brick-dark"
					>
						<BookOpen size={13} />
						<span>Baca</span>
					</a>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Horizontal List layout -->
	<div
		class="group flex items-start gap-4 rounded-lg border border-ink/10 bg-sand/25 p-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-ink/25 hover:bg-sand/55 {className}"
	>
		<a href="/buku/{book.slug}" class="focus-library shrink-0 rounded-sm">
			<BookCover
				title={book.title}
				slug={book.slug}
				author={book.author}
				src={book.coverUrl}
				classification={book.classification}
				isSaved={book.isSaved}
				isFeatured={book.isFeatured}
				size="sm"
				class="group-hover:book-shadow-hover w-21"
			/>
		</a>

		<div class="min-w-0 flex-1">
			<div class="mb-1 flex items-center gap-2">
				{#if book.classification}
					<span class="rounded-xs bg-ink/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-ink">
						{book.classification}
					</span>
				{/if}
				{#if book.category}
					<span class="text-xs text-ink-muted">
						{book.category}
					</span>
				{/if}
			</div>

			<h4
				class="font-serif text-base leading-snug font-bold text-ink transition-colors group-hover:text-brick"
			>
				<a href="/buku/{book.slug}" class="focus-library">
					{book.title}
				</a>
			</h4>

			<p class="mt-0.5 text-sm text-ink-muted">
				{book.author}
				{#if book.publisher}
					&bull; <span class="opacity-80">{book.publisher}</span>
				{/if}
			</p>

			<div class="mt-3 flex items-center gap-4 font-mono text-xs text-ink-muted">
				{#if book.year}
					<span>Tahun {book.year}</span>
				{/if}
				{#if book.pages}
					<span>{book.pages} halaman</span>
				{/if}
				{#if book.readersCount != null}
					<span class="font-medium text-brick">
						{(book.readersCount ?? 0).toLocaleString('id-ID')} pembaca
					</span>
				{/if}
			</div>
		</div>

		<div class="flex shrink-0 flex-col gap-2">
			<a
				href="/baca/{book.slug}"
				class="focus-library inline-flex items-center gap-1.5 rounded-sm bg-brick px-3 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-brick-dark"
			>
				<BookOpen size={14} />
				<span>Baca Sekarang</span>
			</a>
		</div>
	</div>
{/if}
