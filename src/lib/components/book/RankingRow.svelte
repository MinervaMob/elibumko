<script lang="ts">
	import BookCover from './BookCover.svelte';
	import type { BookData } from '#lib/types';
	import { BookOpen } from 'lucide-svelte';

	interface Props {
		rank: number;
		book: BookData;
		class?: string;
	}

	let { rank, book, class: className = '' }: Props = $props();

	const formattedRank = $derived(rank < 10 ? `0${rank}` : `${rank}`);
</script>

<div
	class="group focus-library relative flex items-center gap-3 rounded-md border-b border-ink/10 px-3 py-3.5 transition-all duration-200 hover:bg-sand/40 sm:gap-5 {className}"
>
	<!-- Large editorial numeral -->
	<span
		class="w-10 shrink-0 text-center font-serif text-2xl font-bold tracking-tight text-ink/30 transition-colors group-hover:text-brick sm:w-12 sm:text-4xl"
	>
		{formattedRank}
	</span>

	<!-- Book cover thumbnail -->
	<a href="/buku/{book.slug}" class="focus-library shrink-0 rounded-sm" tabindex="0">
		<BookCover
			title={book.title}
			slug={book.slug}
			author={book.author}
			src={book.coverUrl}
			classification={book.classification}
			size="sm"
			class="group-hover:book-shadow-hover w-13 sm:w-15"
		/>
	</a>

	<!-- Details -->
	<div class="min-w-0 flex-1">
		<div class="mb-0.5 flex items-center gap-2">
			{#if book.classification}
				<span class="py-0.2 rounded-xs bg-ink/10 px-1 font-mono text-[10px] font-semibold text-ink">
					{book.classification}
				</span>
			{/if}
			{#if book.category}
				<span class="hidden truncate text-xs text-ink-muted sm:inline">
					{book.category}
				</span>
			{/if}
		</div>

		<h4
			class="line-clamp-1 font-serif text-sm font-bold text-ink transition-colors group-hover:text-brick sm:text-base"
		>
			<a href="/buku/{book.slug}" class="focus-library">
				{book.title}
			</a>
		</h4>

		<p class="mt-0.5 truncate text-xs text-ink-muted">
			{book.author}
		</p>
	</div>

	<!-- Stats & action -->
	<div
		class="flex shrink-0 flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:gap-4"
	>
		{#if book.readersCount != null}
			<div class="text-right">
				<span class="font-mono text-xs font-semibold text-brick">
					{(book.readersCount ?? 0).toLocaleString('id-ID')}
				</span>
				<span class="ml-1 block font-sans text-[10px] text-ink-muted sm:inline"> pembaca </span>
			</div>
		{/if}

		<a
			href="/baca/{book.slug}"
			class="focus-library hidden items-center gap-1 rounded-sm bg-brick px-3 py-1 text-xs font-medium text-cream transition-colors hover:bg-brick-dark md:inline-flex"
			aria-label="Baca {book.title}"
		>
			<BookOpen size={12} />
			<span>Baca</span>
		</a>
	</div>
</div>
